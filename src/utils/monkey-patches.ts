import { BxEvent } from "@utils/bx-event";
import { STATES } from "@utils/global";
import { BxLogger } from "@utils/bx-logger";
import { patchSdpBitrate, patchSdpBitrateHints, setCodecPreferences } from "./sdp";
import { StreamPlayerManager } from "@/modules/stream-player-manager";
import { GlobalPref, StreamPref } from "@/enums/pref-keys";
import { CodecProfile, StreamResolution } from "@/enums/pref-values";
import type { SettingDefinition } from "@/types/setting-definition";
import { BxEventBus } from "./bx-event-bus";
import { getGlobalPref, getGlobalPrefDefinition, getStreamPref } from "@/utils/pref-utils";
import type { StreamPlayerOptions } from "@/types/stream";

export function patchVideoApi() {
    const PREF_SKIP_SPLASH_VIDEO = getGlobalPref(GlobalPref.UI_SKIP_SPLASH_VIDEO);

    // Show video player when it's ready
    const showFunc = function(this: HTMLVideoElement) {
        this.style.visibility = 'visible';
        if (!this.videoWidth) {
            return;
        }

        const playerOptions = {
            processing: getStreamPref(StreamPref.VIDEO_PROCESSING),
            processingMode: getStreamPref(StreamPref.VIDEO_PROCESSING_MODE),
            sharpness: getStreamPref(StreamPref.VIDEO_SHARPNESS),
            saturation: getStreamPref(StreamPref.VIDEO_SATURATION),
            contrast: getStreamPref(StreamPref.VIDEO_CONTRAST),
            brightness: getStreamPref(StreamPref.VIDEO_BRIGHTNESS),
        } satisfies StreamPlayerOptions;

        const streamPlayerManager= StreamPlayerManager.getInstance();
        streamPlayerManager.setVideoElement(this);
        streamPlayerManager.updateOptions(playerOptions, false);
        streamPlayerManager.switchPlayerType(getStreamPref(StreamPref.VIDEO_PLAYER_TYPE));

        STATES.currentStream.streamPlayerManager = streamPlayerManager;

        BxEventBus.Stream.emit('state.playing', {
            $video: this,
        })
    }

    const nativePlay = HTMLMediaElement.prototype.play;
    (HTMLMediaElement.prototype as any).nativePlay = nativePlay;
    HTMLMediaElement.prototype.play = function() {
        if (this.className && this.className.startsWith('XboxSplashVideo')) {
            if (PREF_SKIP_SPLASH_VIDEO) {
                this.volume = 0;
                this.style.display = 'none';
                this.dispatchEvent(new Event('ended'));

                return new Promise<void>(() => {});
            }

            return nativePlay.apply(this);
        }

        const $parent = this.parentElement;
        // Video tag is stream player
        if (!this.src && $parent?.dataset.testid === 'media-container') {
            this.addEventListener('loadedmetadata', showFunc, { once: true });
        }

        return nativePlay.apply(this);
    };

    // Native "Prevent resolution drops" on play.xbox.com: clamp reported video frame decode/processing
    // durations so xCloud's client telemetry doesn't ask the server to downscale 1080p -> 720p.
    if (getGlobalPref(GlobalPref.STREAM_PREVENT_RESOLUTION_DROPS) && 'requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const nativeRvfc = HTMLVideoElement.prototype.requestVideoFrameCallback;
        HTMLVideoElement.prototype.requestVideoFrameCallback = function(callback: VideoFrameRequestCallback): number {
            const wrapped: VideoFrameRequestCallback = (now, metadata) => {
                if (metadata) {
                    try {
                        const clamped: any = Object.assign({}, metadata);
                        if (typeof clamped.processingDuration === 'number' && clamped.processingDuration > 0.004) {
                            clamped.processingDuration = 0.004;
                        }
                        if (typeof clamped.receiveTime === 'number' && typeof clamped.expectedDisplayTime === 'number') {
                            if (clamped.expectedDisplayTime - clamped.receiveTime > 10) {
                                clamped.expectedDisplayTime = clamped.receiveTime + 10;
                            }
                        }
                        return callback(now, clamped);
                    } catch (e) {}
                }
                return callback(now, metadata);
            };
            return nativeRvfc.call(this, wrapped);
        };
    }
}


export function patchRtcCodecs() {
    const codecProfile = getGlobalPref(GlobalPref.STREAM_CODEC_PROFILE);
    if (codecProfile === 'default') {
        return;
    }

    if (typeof RTCRtpTransceiver === 'undefined' || !('setCodecPreferences' in RTCRtpTransceiver.prototype)) {
        return false;
    }
}

export function patchRtcPeerConnection() {
    const nativeCreateDataChannel = RTCPeerConnection.prototype.createDataChannel;
    RTCPeerConnection.prototype.createDataChannel = function() {
        // @ts-ignore
        const dataChannel = nativeCreateDataChannel.apply(this, arguments);

        BxEventBus.Stream.emit('dataChannelCreated', { dataChannel });
        return dataChannel;
    }

    const maxVideoBitrateDef = getGlobalPrefDefinition(GlobalPref.STREAM_MAX_VIDEO_BITRATE) as Extract<SettingDefinition, { min: number }>;
    const maxVideoBitrate = getGlobalPref(GlobalPref.STREAM_MAX_VIDEO_BITRATE);
    const codec = getGlobalPref(GlobalPref.STREAM_CODEC_PROFILE);

    const nativeSetLocalDescription = RTCPeerConnection.prototype.setLocalDescription;
    RTCPeerConnection.prototype.setLocalDescription = function(description?: RTCLocalSessionDescriptionInit): Promise<void> {
        try {
            if (description && arguments[0]?.sdp) {
                // Set preferred codec profile
                if (codec !== CodecProfile.DEFAULT) {
                    arguments[0].sdp = setCodecPreferences(arguments[0].sdp, codec);
                }

                // Set maximum bitrate or push Chromium WebRTC bitrate hints toward the server's plan ceiling
                const hasCustomCap = maxVideoBitrate > 0 && maxVideoBitrate < maxVideoBitrateDef.max;
                if (hasCustomCap) {
                    const kbps = Math.round(maxVideoBitrate / 1000);
                    arguments[0].sdp = patchSdpBitrate(arguments[0].sdp, kbps);
                    arguments[0].sdp = patchSdpBitrateHints(arguments[0].sdp, kbps);
                } else {
                    arguments[0].sdp = patchSdpBitrateHints(arguments[0].sdp, 30000);
                }
            }
        } catch (e) {
            BxLogger.error('setLocalDescription', e);
        }

        // @ts-ignore
        return nativeSetLocalDescription.apply(this, arguments);
    };

    const nativeSetRemoteDescription = RTCPeerConnection.prototype.setRemoteDescription;
    RTCPeerConnection.prototype.setRemoteDescription = function(description: RTCSessionDescriptionInit): Promise<void> {
        const originalSdp = description?.sdp;
        if (description && originalSdp) {
            try {
                const hasCustomCap = maxVideoBitrate > 0 && maxVideoBitrate < maxVideoBitrateDef.max;
                const kbps = hasCustomCap ? Math.round(maxVideoBitrate / 1000) : 30000;
                const patchedSdp = hasCustomCap
                    ? patchSdpBitrateHints(patchSdpBitrate(originalSdp, kbps), kbps)
                    : patchSdpBitrateHints(originalSdp, kbps);
                const patchedDesc = { type: description.type, sdp: patchedSdp };
                // Fall back cleanly to original SDP if browser rejects any hint
                return nativeSetRemoteDescription.call(this, patchedDesc).catch(() => nativeSetRemoteDescription.call(this, description));
            } catch (e) {
                BxLogger.error('setRemoteDescription', e);
            }
        }

        // @ts-ignore
        return nativeSetRemoteDescription.apply(this, arguments);
    };

    const OrgRTCPeerConnection = window.RTCPeerConnection;
    // @ts-ignore
    window.RTCPeerConnection = function() {
        const conn = new OrgRTCPeerConnection();
        STATES.currentStream.peerConnection = conn;

        conn.addEventListener('connectionstatechange', e => {
            BxLogger.info('connectionstatechange', conn.connectionState);
        });
        return conn;
    };

    // Govern reported WebRTC inbound video decode time when "Prevent resolution drops" is active.
    // play.xbox.com's WebRtcStreamV1 reads totalDecodeTime / framesDecoded from getStats() and asks
    // the server to downscale 1080p -> 720p if decode time spikes. Our own StreamStatsCollector
    // uses __pxeNativeGetStats so the HUD always shows the true hardware decode time.
    if (getGlobalPref(GlobalPref.STREAM_PREVENT_RESOLUTION_DROPS)) {
        const MAX_DECODE_SEC_PER_FRAME = 0.0075; // 7.5 ms per frame ceiling
        type DecodeBudgetTrack = { prevFrames: number; prevRawSec: number; governedSec: number };
        const receiverBudgets = new WeakMap<object, Map<string, DecodeBudgetTrack>>();

        const governStatsReport = (holder: object, rawReport: RTCStatsReport): RTCStatsReport => {
            let trackMap = receiverBudgets.get(holder);
            if (!trackMap) {
                trackMap = new Map();
                receiverBudgets.set(holder, trackMap);
            }

            let modified = false;
            const entries = new Map<string, any>();

            rawReport.forEach((stat: any, id: string) => {
                if (
                    stat &&
                    stat.type === 'inbound-rtp' &&
                    (stat.kind === 'video' || stat.mediaType === 'video') &&
                    typeof stat.framesDecoded === 'number' &&
                    stat.framesDecoded > 0 &&
                    typeof stat.totalDecodeTime === 'number'
                ) {
                    const frames = stat.framesDecoded;
                    const rawSec = stat.totalDecodeTime;
                    const prev = trackMap!.get(id);
                    let nextGovernedSec: number;

                    if (!prev || frames < prev.prevFrames || rawSec < prev.prevRawSec) {
                        nextGovernedSec = Math.min(rawSec, frames * MAX_DECODE_SEC_PER_FRAME);
                        trackMap!.set(id, { prevFrames: frames, prevRawSec: rawSec, governedSec: nextGovernedSec });
                    } else {
                        const frameDelta = frames - prev.prevFrames;
                        const rawDelta = rawSec - prev.prevRawSec;
                        const allowedDelta = Math.min(rawDelta, frameDelta * MAX_DECODE_SEC_PER_FRAME);
                        nextGovernedSec = prev.governedSec + allowedDelta;
                        prev.prevFrames = frames;
                        prev.prevRawSec = rawSec;
                        prev.governedSec = nextGovernedSec;
                    }

                    if (nextGovernedSec !== rawSec) {
                        stat = Object.assign({}, stat, { totalDecodeTime: nextGovernedSec });
                        modified = true;
                    }
                }
                entries.set(id, stat);
            });

            return modified ? (entries as unknown as RTCStatsReport) : rawReport;
        };

        const patchGetStatsOnProto = (proto: any) => {
            if (!proto || typeof proto.getStats !== 'function' || proto.__pxeNativeGetStats) {
                return;
            }
            const origGetStats = proto.getStats;
            proto.__pxeNativeGetStats = origGetStats;
            proto.getStats = function(...args: any[]) {
                const res = origGetStats.apply(this, args);
                if (args.length === 0 && res && typeof res.then === 'function') {
                    return res.then((report: RTCStatsReport) => governStatsReport(this, report));
                }
                return res;
            };
        };

        patchGetStatsOnProto(OrgRTCPeerConnection?.prototype);
        patchGetStatsOnProto(window.RTCRtpReceiver?.prototype);
    }

    // Suppress virtual Touch Adaptation Kit (TAK) controller & negotiations on play.xbox.com (Desktop-only build)
    // and handle 1440p (2K Experimental) DataChannel negotiation when selected.
    if (window.RTCDataChannel?.prototype) {
        const dcProto = window.RTCDataChannel.prototype as any;
        if (typeof dcProto.send === 'function' && !dcProto.__pxeNativeSend) {
            const origSend = dcProto.send;
            dcProto.__pxeNativeSend = origSend;
            const isQhdTarget = getGlobalPref(GlobalPref.STREAM_RESOLUTION) === StreamResolution.DIM_1440P;
            const negotiatedControlChannels = new WeakSet<RTCDataChannel>();
            let activeControlChannel: RTCDataChannel | null = null;
            let pendingQhdAlias = false;

            dcProto.send = function(this: RTCDataChannel, payload: any) {
                if (this?.label === 'control') {
                    activeControlChannel = this;
                }

                if (typeof payload === 'string') {
                    try {
                        // Force touchcontrols enabled: false so play.xbox.com never spawns the virtual touch controller on tablets
                        if (this?.label === 'message' && payload.includes('/streaming/touchcontrols/')) {
                            const parsed = JSON.parse(payload);
                            if (typeof parsed?.target === 'string' && parsed.target.startsWith('/streaming/touchcontrols/') && typeof parsed.content === 'string') {
                                const contentObj = JSON.parse(parsed.content);
                                if ('enabled' in contentObj) {
                                    contentObj.enabled = false;
                                }
                                if ('maxTouchPoints' in contentObj) {
                                    contentObj.maxTouchPoints = 0;
                                }
                                parsed.content = JSON.stringify(contentObj);
                                payload = JSON.stringify(parsed);
                            }
                        } else if (isQhdTarget && this?.label === 'message' && payload.includes('/streaming/characteristics/dimensionschanged')) {
                            const parsed = JSON.parse(payload);
                            if (parsed?.target === '/streaming/characteristics/dimensionschanged' && typeof parsed.content === 'string') {
                                const contentObj = Object.assign({}, JSON.parse(parsed.content), {
                                    preferredWidth: 2560,
                                    preferredHeight: 1440,
                                    safeAreaLeft: 0,
                                    safeAreaTop: 0,
                                    safeAreaRight: 2560,
                                    safeAreaBottom: 1440,
                                    supportsCustomResolution: true,
                                });
                                parsed.content = JSON.stringify(contentObj);
                                payload = JSON.stringify(parsed);
                                pendingQhdAlias = true;
                            }
                        } else if (isQhdTarget && this?.label === 'control' && payload.includes('userRequestedResolutionUpdate')) {
                            const parsed = JSON.parse(payload);
                            if (parsed?.message === 'userRequestedResolutionUpdate') {
                                parsed.resolutionAlias = '1440';
                                payload = JSON.stringify(parsed);
                                negotiatedControlChannels.add(this);
                                pendingQhdAlias = false;
                            }
                        }
                    } catch (e) {}
                }

                const result = origSend.call(this, payload);

                if (
                    isQhdTarget &&
                    pendingQhdAlias &&
                    activeControlChannel &&
                    activeControlChannel.readyState === 'open' &&
                    !negotiatedControlChannels.has(activeControlChannel)
                ) {
                    pendingQhdAlias = false;
                    negotiatedControlChannels.add(activeControlChannel);
                    try {
                        origSend.call(activeControlChannel, JSON.stringify({
                            message: 'userRequestedResolutionUpdate',
                            resolutionAlias: '1440',
                        }));
                    } catch (e) {}
                }

                return result;
            };
        }
    }
}

export function patchAudioContext() {
    const OrgAudioContext = window.AudioContext;
    const nativeCreateGain = OrgAudioContext.prototype.createGain;

    // @ts-ignore
    window.AudioContext = function(options?: AudioContextOptions | undefined): AudioContext {
        if (options && options.latencyHint) {
            options.latencyHint = 0;
        }

        const ctx = new OrgAudioContext(options);
        BxLogger.info('patchAudioContext', ctx, options);

        ctx.createGain = function() {
            const gainNode = nativeCreateGain.apply(this);
            gainNode.gain.value = getStreamPref(StreamPref.AUDIO_VOLUME) / 100;

            STATES.currentStream.audioGainNode = gainNode;
            return gainNode;
        }

        STATES.currentStream.audioContext = ctx;
        return ctx;
    }
}

/**
 * Disable telemetry flags in meversion.js
 */
export function patchMeControl() {
    const overrideConfigs = {
        enableAADTelemetry: false,
        enableTelemetry: false,
        telEvs: '',
        oneDSUrl: '',
    };

    const MSA = {
        MeControl: {
            API: {
                setDisplayMode: () => {},
                setMobileState: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
            },
        },
    };
    const MeControl = {};

    const MsaHandler: ProxyHandler<any> = {
        get(target, prop, receiver) {
            return target[prop];
        },

        set(obj, prop, value) {
            if (prop === 'MeControl' && value.Config) {
                value.Config = Object.assign(value.Config, overrideConfigs);
            }

            obj[prop] = value;
            return true;
        },
    };

    const MeControlHandler: ProxyHandler<any> = {
        get(target, prop, receiver) {
            return target[prop];
        },

        set(obj, prop, value) {
            if (prop === 'Config') {
                value = Object.assign(value, overrideConfigs);
            }

            obj[prop] = value;
            return true;
        },
    };

    window.MSA = new Proxy(MSA, MsaHandler);
    window.MeControl = new Proxy(MeControl, MeControlHandler);
}


/**
 * Disable Adobe Audience Manager (AAM)
 */
export function disableAdobeAudienceManager() {
    Object.defineProperty(window, 'adobe', {
        get() { return Object.freeze({}); }
    });
}

/**
 * Use power-saving flags for touch control
 */
export function patchCanvasContext() {
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    // @ts-ignore
    HTMLCanvasElement.prototype.getContext = function(contextType: string, contextAttributes?: any) {
        if (contextType.includes('webgl')) {
            contextAttributes = contextAttributes || {};
            if (!contextAttributes.isBx) {
                contextAttributes.antialias = false;

                // Use low-power profile for touch controller
                if (contextAttributes.powerPreference === 'high-performance') {
                    contextAttributes.powerPreference = 'low-power';
                }
            }
        }

        // @ts-ignore
        return nativeGetContext.apply(this, [contextType, contextAttributes]);
    }
}


export function patchPointerLockApi() {
    Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get() {
            return document.documentElement;
        },
    });

    HTMLElement.prototype.requestFullscreen = function(options?: FullscreenOptions): Promise<void> {
        return Promise.resolve();
    }

    let pointerLockElement: unknown = null;
    Object.defineProperty(document, 'pointerLockElement', {
        configurable: true,
        get() {
            return pointerLockElement;
        },
    });

    // const nativeRequestPointerLock = HTMLElement.prototype.requestPointerLock;
    // @ts-ignore
    HTMLElement.prototype.requestPointerLock = function() {
        pointerLockElement = document.documentElement;
        window.dispatchEvent(new Event(BxEvent.POINTER_LOCK_REQUESTED));
        // document.dispatchEvent(new Event('pointerlockchange'));

        // @ts-ignore
        // nativeRequestPointerLock.apply(this, arguments);
    }

    // const nativeExitPointerLock = Document.prototype.exitPointerLock;
    Document.prototype.exitPointerLock = function() {
        pointerLockElement = null;
        window.dispatchEvent(new Event(BxEvent.POINTER_LOCK_EXITED));
        // document.dispatchEvent(new Event('pointerlockchange'));

        // nativeExitPointerLock.apply(this);
    }
}
