import { t } from "@utils/translation";
import { STATES } from "@utils/global";
import { Toast } from "@utils/toast";
import { ceilToNearest, floorToNearest } from "@/utils/utils";
import { GlobalPref, StreamPref } from "@/enums/pref-keys";
import { getGlobalPref } from "@/utils/pref-utils";
import { BxEventBus } from "@/utils/bx-event-bus";
import { getStreamPref, setStreamPref } from "@/utils/pref-utils";

export enum SpeakerState {
    ENABLED,
    MUTED,
}

export class SoundShortcut {
    static adjustGainNodeVolume(amount: number): number {
        if (!getGlobalPref(GlobalPref.AUDIO_VOLUME_CONTROL_ENABLED) || !STATES.currentStream.audioGainNode) {
            // Fallback for play.xbox.com (or when AudioContext gain node is off): adjust media element volume directly
            const $media = document.querySelector<HTMLMediaElement>('div[data-testid=media-container] audio')
                ?? document.querySelector<HTMLMediaElement>('div[data-testid=media-container] video')
                ?? document.querySelector<HTMLMediaElement>('#game-stream audio, #game-stream video');
            if (!$media) {
                return 0;
            }
            const currentPct = Math.round(($media.muted ? 0 : $media.volume) * 100);
            const nextPct = Math.max(0, Math.min(100, currentPct + amount));
            $media.muted = nextPct === 0;
            $media.volume = nextPct / 100;
            Toast.show(`${t('stream')} ❯ ${t('volume')}`, nextPct === 0 ? t('muted') : nextPct + '%', { instant: true });
            BxEventBus.Stream.emit('speaker.state.changed', {
                state: nextPct === 0 ? SpeakerState.MUTED : SpeakerState.ENABLED,
            });
            return nextPct;
        }

        const currentValue = getStreamPref(StreamPref.AUDIO_VOLUME);
        let nearestValue: number;

        if (amount > 0) {  // Increase
            nearestValue = ceilToNearest(currentValue, amount);
        } else {  // Decrease
            nearestValue = floorToNearest(currentValue, -1 * amount);
        }

        let newValue: number;
        if (currentValue !== nearestValue) {
            newValue = nearestValue;
        } else {
            newValue = currentValue + amount;
        }

        newValue = setStreamPref(StreamPref.AUDIO_VOLUME, newValue, 'direct');
        SoundShortcut.setGainNodeVolume(newValue);

        // Show toast
        Toast.show(`${t('stream')} ❯ ${t('volume')}`, newValue + '%', { instant: true });

        return newValue;
    }

    static setGainNodeVolume(value: number) {
        STATES.currentStream.audioGainNode && (STATES.currentStream.audioGainNode.gain.value = value / 100);
    }

    static muteUnmute() {
        if (getGlobalPref(GlobalPref.AUDIO_VOLUME_CONTROL_ENABLED) && STATES.currentStream.audioGainNode) {
            const gainValue = STATES.currentStream.audioGainNode.gain.value;
            const settingValue = getStreamPref(StreamPref.AUDIO_VOLUME);

            let targetValue: number;
            if (settingValue === 0) {  // settingValue is 0 => set to 100
                targetValue = 100;
                setStreamPref(StreamPref.AUDIO_VOLUME, targetValue, 'direct');
            } else if (gainValue === 0) {  // is being muted => set to settingValue
                targetValue = settingValue;
            } else {  // not being muted => mute
                targetValue = 0;
            }

            let status: string;
            if (targetValue === 0) {
                status = t('muted');
            } else {
                status = targetValue + '%';
            }

            SoundShortcut.setGainNodeVolume(targetValue);
            Toast.show(`${t('stream')} ❯ ${t('volume')}`, status, { instant: true });

            BxEventBus.Stream.emit('speaker.state.changed', {
                state: targetValue === 0 ? SpeakerState.MUTED : SpeakerState.ENABLED,
            });
            return;
        }

        const $media = document.querySelector<HTMLAudioElement>('div[data-testid=media-container] audio') ?? document.querySelector<HTMLAudioElement>('div[data-testid=media-container] video');
        if ($media) {
            $media.muted = !$media.muted;

            const status = $media.muted ? t('muted') : t('unmuted');
            Toast.show(`${t('stream')} ❯ ${t('volume')}`, status, { instant: true });

            BxEventBus.Stream.emit('speaker.state.changed', {
                state: $media.muted ? SpeakerState.MUTED : SpeakerState.ENABLED,
            });
        }
    }
}
