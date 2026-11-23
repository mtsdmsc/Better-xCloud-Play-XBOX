import { compressCss, isFullVersion } from "@macros/build" with { type: "macro" };

import "@utils/global";
import { BxEvent } from "@utils/bx-event";
import { BX_FLAGS } from "@utils/bx-flags";
import { BxExposed } from "@utils/bx-exposed";
import { t } from "@utils/translation";
import { interceptHttpRequests } from "@utils/network";
import { CE } from "@utils/html";
import { showGamepadToast } from "@utils/gamepad";
import { EmulatedMkbHandler } from "@modules/mkb/mkb-handler";
import { StreamBadges } from "@modules/stream/stream-badges";
import { StreamStats } from "@modules/stream/stream-stats";
import { addCss, preloadFonts } from "@utils/css";
import { LoadingScreen } from "@modules/loading-screen";
import { MouseCursorHider } from "@modules/mkb/mouse-cursor-hider";
import { TouchController } from "@modules/touch-controller";
import { checkForUpdate, disablePwa, productTitleToSlug } from "@utils/utils";
import { Patcher } from "@/modules/patcher/patcher";
import { RemotePlayManager } from "@/modules/remote-play-manager";
import { onHistoryChanged, patchHistoryMethod } from "@utils/history";
import { disableAdobeAudienceManager, patchAudioContext, patchCanvasContext, patchMeControl, patchPointerLockApi, patchRtcCodecs, patchRtcPeerConnection, patchVideoApi } from "@utils/monkey-patches";
import { AppInterface, STATES } from "@utils/global";
import { BxLogger } from "@utils/bx-logger";
import { GameBar } from "./modules/game-bar/game-bar";
import { ScreenshotManager } from "./utils/screenshot-manager";
import { NativeMkbHandler } from "./modules/mkb/native-mkb-handler";
import { GuideMenu } from "./modules/ui/guide-menu";
import { updateVideoPlayer } from "./modules/stream/stream-settings-utils";
import { BlockFeature, NativeMkbMode, TouchControllerMode, UiSection } from "./enums/pref-values";
import { HeaderSection } from "./modules/ui/header";
import { GameTile } from "./modules/ui/game-tile";
import { ProductDetailsPage } from "./modules/ui/product-details";
import { NavigationDialogManager } from "./modules/ui/dialog/navigation-dialog";
import { SettingsDialog } from "./modules/ui/dialog/settings-dialog";
import { GlobalPref, StreamPref } from "./enums/pref-keys";
import { UserAgent } from "./utils/user-agent";
import { XboxApi } from "./utils/xbox-api";
import { StreamStatsCollector } from "./utils/stream-stats-collector";
import { StreamSettings } from "./utils/stream-settings";
import { KeyboardShortcutHandler } from "./modules/mkb/keyboard-shortcut-handler";
import { GhPagesUtils } from "./utils/gh-pages";
import { DeviceVibrationManager } from "./modules/device-vibration-manager";
import { BxEventBus } from "./utils/bx-event-bus";
import { getGlobalPref, getStreamPref } from "./utils/pref-utils";
import { SettingsManager } from "./modules/settings-manager";
import { Toast } from "./utils/toast";
import { PlaytimeTracker } from "./utils/playtime-tracker";
import { PlayXboxGamepad } from "./utils/play-xbox-gamepad";
import { ControllerShortcut } from "./modules/controller-shortcut";
import { WebGPUPlayer } from "./modules/player/webgpu/webgpu-player";
import { StreamUiHandler } from "./modules/stream/stream-ui";
import { TrueAchievements } from "./utils/true-achievements";
import { localRedirect } from "./modules/ui/ui";
import { handleDeepLink } from "./utils/deep-link";

SettingsManager.getInstance();

// Handle login page
if (window.location.pathname.includes('/auth/msa')) {
    const nativePushState = window.history['pushState'];
    window.history['pushState'] = function(...args: any[]) {
        const url = args[2];
        if (url && (url.startsWith('/play') || url.substring(6).startsWith('/play'))) {
            console.log('Redirecting to xbox.com/play');
            window.stop();
            window.location.href = 'https://www.xbox.com' + url;
            return;
        }

        // @ts-ignore
        return nativePushState.apply(this, arguments);
    }
    // Stop processing the script
    throw new Error('[Better xCloud] Refreshing the page after logging in');
}

BxLogger.info('readyState', document.readyState);

const IS_NEW_SITE = window.location.hostname === 'play.xbox.com';

if (!IS_NEW_SITE && isFullVersion() && BX_FLAGS.SafariWorkaround && document.readyState !== 'loading') {
    // Stop loading
    window.stop();

    // We need to set it to an empty string first to work around Bun's bug
    // https://github.com/oven-sh/bun/issues/12067
    let css = '';
    css += compressCss(`
.bx-reload-overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    background: #000000cc;
    z-index: 9999;
    color: #fff;
    text-align: center;
    font-weight: 400;
    font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    font-size: 1.3rem;
}

.bx-reload-overlay *:focus {
    outline: none !important;
}

.bx-reload-overlay > div {
    margin: 0 auto;
}

.bx-reload-overlay a {
    text-decoration: none;
    display: inline-block;
    background: #107c10;
    color: white;
    border-radius: 4px;
    padding: 6px;
}
`);

    const isSafari = UserAgent.isSafari();
    let $secondaryAction: HTMLElement;
    if (isSafari) {
        $secondaryAction = CE('p', false, t('settings-reloading'));
    } else {
        $secondaryAction = CE('a', {
            href: 'https://github.com/mtsdmsc/Better-xCloud-Play-XBOX/issues',
            target: '_blank',
        }, '🤓 ' + t('how-to-fix'));
    }

    // Show the reloading overlay
    const $fragment = document.createDocumentFragment();
    $fragment.appendChild(CE('style', false, css));
    $fragment.appendChild(CE('div',{
        class: 'bx-reload-overlay',
    },
        CE('div', false,
            CE('p', false, t('load-failed-message')),
            $secondaryAction,
        ),
    ));

    document.documentElement.appendChild($fragment);

    // Reload the page if using Safari
    // @ts-ignore
    isSafari && window.location.reload(true);

    // Stop processing the script
    throw new Error('[Better xCloud] Executing workaround for Safari');
}

// Make sure it only run on /play
if (!IS_NEW_SITE && !window.location.pathname.match(/^\/[a-zA-Z]{2}-[a-zA-Z]{2}\/play/)) {
    throw new Error('[Better xCloud] Not xCloud page');
}


if (IS_NEW_SITE) {
    // The new site has no patched hook for the header/guide -> watch the DOM (after React has hydrated)
    const startNewSiteWatchers = () => {
        window.setTimeout(() => {
            HeaderSection.getInstance().watchHeader();
            GuideMenu.getInstance().watchGuideMenu();
            StreamUiHandler.watchStreamHud();
            PlaytimeTracker.getInstance().watchQuota();
        }, 1200);
    };

    if (document.readyState === 'complete') {
        startNewSiteWatchers();
    } else {
        window.addEventListener('load', startNewSiteWatchers, { once: true });
    }
}

window.addEventListener('load', e => {
    // Automatically reload the page when running into the "We are sorry..." error message
    window.setTimeout(() => {
        if (!IS_NEW_SITE && document.body.classList.contains('legacyBackground')) {
            // Has error message -> reload page
            window.stop();
            // @ts-ignore
            window.location.reload(true);
        }
    }, 3000);
});

let interactiveInitialized = false;
const onDocumentInteractive = () => {
    if (interactiveInitialized) {
        return;
    }
    interactiveInitialized = true;

    STATES.isSignedIn = !!window.xbcUser?.isSignedIn || (IS_NEW_SITE && !!RemotePlayManager.getGssvToken());

    if (STATES.isSignedIn) {
        if (IS_NEW_SITE) {
            RemotePlayManager.fetchXcloudRegions();
        }
        // Preload Remote Play
        if (isFullVersion()) {
            RemotePlayManager.getInstance()?.initialize();
        }
    } else if (IS_NEW_SITE) {
        let attempts = 0;
        const retryTimer = window.setInterval(() => {
            attempts++;
            if (Object.keys(STATES.serverRegions).length > 0 || attempts > 8) {
                window.clearInterval(retryTimer);
                return;
            }
            if (RemotePlayManager.getGssvToken()) {
                window.clearInterval(retryTimer);
                STATES.isSignedIn = true;
                RemotePlayManager.fetchXcloudRegions();
                isFullVersion() && RemotePlayManager.getInstance()?.initialize();
            }
        }, 2000);
    } else {
        // Show Settings button in the header when not signed in
        // window.setTimeout(HeaderSection.watchHeader, 2000);
    }

    // Hide "Play with Friends" skeleton section
    if (getGlobalPref(GlobalPref.UI_HIDE_SECTIONS).includes(UiSection.FRIENDS) || getGlobalPref(GlobalPref.BLOCK_FEATURES).includes(BlockFeature.FRIENDS)) {
        const $parent = document.querySelector('div[class*=PlayWithFriendsSkeleton]')?.closest<HTMLElement>('div[class*=HomePage-module]');
        $parent && ($parent.style.display = 'none');
    }

    // Preload fonts
    preloadFonts();
};

if (document.readyState === 'interactive' || document.readyState === 'complete') {
    window.setTimeout(onDocumentInteractive, 0);
} else {
    document.addEventListener('readystatechange', e => {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            onDocumentInteractive();
        }
    });
}

// Deep link
if (AppInterface) {
    window.addEventListener(BxEvent.XCLOUD_ROUTER_HISTORY_READY, e => {
        if (window.location.pathname.includes('/fireos-browser-update')) {
            localRedirect('/play');
        } else {
            handleDeepLink();
        }
    }, { once: true });
}

window.BX_EXPOSED = BxExposed;

// Hide Settings UI when navigate to another page
// @ts-ignore
window.addEventListener(BxEvent.POPSTATE, onHistoryChanged);
window.addEventListener('popstate', onHistoryChanged);

// Make pushState/replaceState methods dispatch BxEvent.POPSTATE event
window.history.pushState = patchHistoryMethod('pushState');
window.history.replaceState = patchHistoryMethod('replaceState');

BxEventBus.Script.on('ui.header.rendered', () => {
    HeaderSection.getInstance().checkHeader();
});

BxEventBus.Stream.on('state.loading', () => {
    // Get title ID for screenshot's name
    if (window.location.pathname.includes('/launch/') && STATES.currentStream.titleInfo) {
        STATES.currentStream.titleSlug = productTitleToSlug(STATES.currentStream.titleInfo.product.title);
    } else {
        STATES.currentStream.titleSlug = 'remote-play';
    }
});

// Setup loading screen
getGlobalPref(GlobalPref.LOADING_SCREEN_GAME_ART) && BxEventBus.Script.on('titleInfo.ready', LoadingScreen.setup);

BxEventBus.Stream.on('state.starting', () => {
    // Hide loading screen
    LoadingScreen.hide();

    if (isFullVersion()) {
        // Start hiding cursor
        const cursorHider = MouseCursorHider.getInstance();
        if (cursorHider) {
            cursorHider.start();
            cursorHider.hide();
        }
    }
});

BxEventBus.Stream.on('state.playing', payload => {
    if (isFullVersion()) {
        window.BX_STREAM_SETTINGS = StreamSettings.settings;
        StreamSettings.refreshAllSettings();
    }

    STATES.isPlaying = true;
    PlaytimeTracker.getInstance().startSession();

    if (isFullVersion()) {
        const gameBar = GameBar.getInstance();
        if (gameBar) {
            gameBar.reset();
            gameBar.enable();
            gameBar.showBar();
        }

        // Setup Keyboard shortcuts
        KeyboardShortcutHandler.getInstance().start();

        // Setup screenshot
        const $video = payload.$video as HTMLVideoElement;
        ScreenshotManager.getInstance().updateCanvasSize($video.videoWidth, $video.videoHeight);

        // Setup local co-op
        if (getStreamPref(StreamPref.LOCAL_CO_OP_ENABLED)) {
            BxExposed.toggleLocalCoOp(true);
            Toast.show(t('local-co-op'), t('enabled'));
        }
    }

    updateVideoPlayer();
});

BxEventBus.Script.on('ui.error.rendered', () => {
    BxEventBus.Stream.emit('state.stopped', {});
});

BxEventBus.Script.on('ui.guideHome.rendered', () => {
    const $root = document.querySelector<HTMLElement>('#gamepass-dialog-root div[role=dialog] div[role=tabpanel] div[class*=HomeLandingPage]');
    $root && GuideMenu.getInstance().injectHome($root, STATES.isPlaying);
});

BxEventBus.Script.on('ui.guideAchievementProgress.rendered', () => {
    const $elm = document.querySelector('#gamepass-dialog-root button[class*=AchievementsButton-module__progressBarContainer]');
    if ($elm) {
        TrueAchievements.getInstance().injectAchievementsProgress($elm as HTMLElement);
    }
});

BxEventBus.Script.on('ui.guideAchievementDetail.rendered', () => {
    const $elm = document.querySelector('#gamepass-dialog-root div[class^=AchievementDetailPage-module]');
    if ($elm) {
        TrueAchievements.getInstance().injectAchievementDetailPage($elm as HTMLElement);
    }
});

BxEventBus.Stream.on('ui.streamMenu.rendered', async () => {
    await StreamUiHandler.handleStreamMenu();
});

BxEventBus.Stream.on('ui.streamHud.rendered', async () => {
    const $elm = document.querySelector<HTMLElement>('#StreamHud');
    $elm && StreamUiHandler.handleSystemMenu($elm);
});


isFullVersion() && window.addEventListener(BxEvent.XCLOUD_RENDERING_COMPONENT, e => {
    const component = (e as any).component;
    if (component === 'product-detail') {
        ProductDetailsPage.injectButtons();
    }
});

// Detect game change
BxEventBus.Stream.on('dataChannelCreated', payload => {
    const { dataChannel } = payload;
    if (dataChannel?.label !== 'message') {
        return;
    }

    dataChannel.addEventListener('message', async (msg: MessageEvent) => {
        if (msg.origin === 'better-xcloud' || typeof msg.data !== 'string') {
            return;
        }

        if (!msg.data.includes('/titleinfo')) {
            return;
        }

        // Get xboxTitleId from message
        const currentStream = STATES.currentStream;
        const json = JSON.parse(JSON.parse(msg.data).content);
        const currentId = currentStream.xboxTitleId ?? null;
        let newId: number = parseInt(json.titleid, 16);

        // Get titleSlug for Remote Play
        if (window.location.pathname.includes('/play/consoles/launch/')) {
            currentStream.titleSlug = 'remote-play';
            if (json.focused) {
                const productTitle = await XboxApi.getProductTitle(newId);
                if (productTitle) {
                    currentStream.titleSlug = productTitleToSlug(productTitle);
                } else {
                    newId = -1;
                }
            } else {
                newId = 0;
            }
        }

        if (currentId !== newId) {
            currentStream.xboxTitleId = newId;
            BxEventBus.Stream.emit('xboxTitleId.changed', {
                id: newId,
            });
        }
    });
});


function unload() {
    if (!STATES.isPlaying) {
        return;
    }

    BxLogger.warning('Unloading');
    if (isFullVersion()) {
        KeyboardShortcutHandler.getInstance().stop();

        // Stop MKB listeners
        EmulatedMkbHandler.getInstance()?.destroy();
        NativeMkbHandler.getInstance()?.destroy();

        DeviceVibrationManager.getInstance()?.reset();
    }

    // Destroy StreamPlayer
    STATES.currentStream.streamPlayerManager?.destroy();

    STATES.isPlaying = false;
    PlaytimeTracker.getInstance().stopSession();
    STATES.currentStream = {};
    window.BX_EXPOSED.shouldShowSensorControls = false;
    window.BX_EXPOSED.stopTakRendering = false;

    NavigationDialogManager.getInstance().hide();
    StreamStats.getInstance().destroy();
    StreamBadges.getInstance().destroy();

    if (isFullVersion()) {
        MouseCursorHider.getInstance()?.stop();
        TouchController.reset();

        GameBar.getInstance()?.disable();

        BxEventBus.Stream.emit('xboxTitleId.changed', { id: -1 });
    }
}

BxEventBus.Stream.on('state.stopped', unload);
window.addEventListener('pagehide', e => {
    BxEventBus.Stream.emit('state.stopped', {});
});

isFullVersion() && window.addEventListener(BxEvent.CAPTURE_SCREENSHOT, e => {
    ScreenshotManager.getInstance().takeScreenshot();
});


function main() {
    GhPagesUtils.fetchLatestCommit();

    if (isFullVersion()) {
        if (getGlobalPref(GlobalPref.NATIVE_MKB_MODE) !== NativeMkbMode.OFF) {
            const customList = getGlobalPref(GlobalPref.NATIVE_MKB_FORCED_GAMES);
            BX_FLAGS.ForceNativeMkbTitles.push(...customList);
        }
    }

    StreamSettings.setup();
    if (IS_NEW_SITE) {
        PlayXboxGamepad.install({
            isGuideOpen: () => GuideMenu.getInstance().isGuideMenuOpen(),
            refreshControllerSettings: () => StreamSettings.refreshControllerSettings(),
            handleShortcut: (gp) => ControllerShortcut.handle(gp),
            resetShortcut: (idx) => ControllerShortcut.reset(idx),
        });
    }

    // Monkey patches (wrapped so iOS WebKit quirks never abort UI initialization)
    try { patchRtcPeerConnection(); } catch (e) { BxLogger.error('patchRtcPeerConnection', e); }
    try { patchRtcCodecs(); } catch (e) { BxLogger.error('patchRtcCodecs', e); }
    try { interceptHttpRequests(); } catch (e) { BxLogger.error('interceptHttpRequests', e); }
    try { patchVideoApi(); } catch (e) { BxLogger.error('patchVideoApi', e); }
    try { patchCanvasContext(); } catch (e) { BxLogger.error('patchCanvasContext', e); }
    try { isFullVersion() && AppInterface && patchPointerLockApi(); } catch (e) { BxLogger.error('patchPointerLockApi', e); }

    try { getGlobalPref(GlobalPref.AUDIO_VOLUME_CONTROL_ENABLED) && patchAudioContext(); } catch (e) { BxLogger.error('patchAudioContext', e); }

    if (getGlobalPref(GlobalPref.BLOCK_TRACKING)) {
        try { patchMeControl(); } catch (e) { BxLogger.error('patchMeControl', e); }
        try { disableAdobeAudienceManager(); } catch (e) { BxLogger.error('disableAdobeAudienceManager', e); }
    }

    // Setup UI
    addCss();

    StreamStatsCollector.setupEvents();
    StreamBadges.setupEvents();
    StreamStats.setupEvents();

    if (isFullVersion()) {
        WebGPUPlayer.prepare();

        STATES.userAgent.capabilities.touch && TouchController.updateCustomList();

        DeviceVibrationManager.getInstance();

        // Check for Update
        BX_FLAGS.CheckForUpdate && checkForUpdate();

        if (!IS_NEW_SITE) {
            Patcher.init();
        }
        disablePwa();

        if (getGlobalPref(GlobalPref.TOUCH_CONTROLLER_MODE) === TouchControllerMode.ALL) {
            TouchController.setup();
        }

        // Start PointerProviderServer
        if (AppInterface && (getGlobalPref(GlobalPref.MKB_ENABLED) || getGlobalPref(GlobalPref.NATIVE_MKB_MODE) === NativeMkbMode.ON)) {
            STATES.pointerServerPort = AppInterface.startPointerServer() || 9269;
            BxLogger.info('startPointerServer', 'Port', STATES.pointerServerPort.toString());
        }

        // Show wait time in game card
        getGlobalPref(GlobalPref.UI_GAME_CARD_SHOW_WAIT_TIME) && GameTile.setup();

        EmulatedMkbHandler.setupEvents();
    }

    // Global desktop keyboard shortcuts:
    // - Alt + Shift + X: toggle Better xCloud Settings
    // - Alt + Shift + E: toggle Stream Stats bar (avoids Edge's Alt+Shift+S Visual Search)
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
        if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) {
            return;
        }
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
            return;
        }

        if (e.code === 'KeyX') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const dialogManager = NavigationDialogManager.getInstance();
            const settingsDialog = SettingsDialog.getInstance();
            if (dialogManager.isShowing()) {
                dialogManager.hide();
            } else {
                if (document.pointerLockElement) {
                    try { document.exitPointerLock(); } catch (err) {}
                }
                settingsDialog.show();
            }
        } else if (e.code === 'KeyE') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            StreamStats.getInstance().toggle();
        }
    };
    window.addEventListener('keydown', handleGlobalShortcuts, true);

    // Keep Better xCloud overlays visible inside the Fullscreen top-layer when play.xbox.com enters/exits fullscreen
    document.addEventListener('fullscreenchange', () => {
        const host = document.fullscreenElement || document.documentElement;
        const ids = ['bx-stream-stats', 'bx-game-bar'];
        for (const id of ids) {
            const $el = document.getElementById(id);
            if ($el && $el.parentElement !== host) {
                host.appendChild($el);
            }
        }
        const $overlay = document.querySelector<HTMLElement>('.bx-navigation-dialog-overlay');
        const $dialog = document.querySelector<HTMLElement>('.bx-navigation-dialog');
        if ($overlay && $overlay.parentElement !== host) {
            host.appendChild($overlay);
        }
        if ($dialog && $dialog.parentElement !== host) {
            host.appendChild($dialog);
        }
    });

    // On play.xbox.com, releasing Pointer Lock via Esc/F9 can trigger Xbox's side Guide panel right after exit.
    // Swallow Escape briefly right after pointer lock exits so user can freely click HUD/Stats/Game Bar.
    if (IS_NEW_SITE) {
        let lastPointerLockExitAt = 0;
        let hadPointerLock = false;
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement) {
                hadPointerLock = true;
            } else if (hadPointerLock) {
                hadPointerLock = false;
                lastPointerLockExitAt = performance.now();
            }
        });

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'Escape' && STATES.isPlaying && (document.pointerLockElement || performance.now() - lastPointerLockExitAt < 400)) {
                e.stopImmediatePropagation();
                e.stopPropagation();
            }
        }, true);

        // play.xbox.com: auto-dismiss post-stream feedback dialog ("Como foi sua sessão?" / "How was your session?")
        // and hide selected Home sections & blocked social panels
        const disableFeedbackDialog = getGlobalPref(GlobalPref.UI_DISABLE_FEEDBACK_DIALOG);
        const hiddenSections = getGlobalPref(GlobalPref.UI_HIDE_SECTIONS);
        const blockedFeatures = getGlobalPref(GlobalPref.BLOCK_FEATURES);

        const SECTION_HEADING_KEYWORDS: Partial<Record<UiSection, string[]>> = {
            [UiSection.JUMP_BACK_IN]: ['voltar a jogar', 'jump back in'],
            [UiSection.NEWS]: ['novidades', 'news'],
            [UiSection.GAME_PASS]: ['jogar com o game pass', 'jogar com game pass', 'play with game pass'],
            [UiSection.RECENTLY_ADDED]: ['adicionados recentemente', 'recently added'],
            [UiSection.MOST_POPULAR]: ['mais populares', 'most popular'],
            [UiSection.UBISOFT_CLASSICS]: ['ubisoft+ classics', 'ubisoft+'],
            [UiSection.NATIVE_MKB]: ['jogar com mouse e teclado', 'jogue com mouse e teclado', 'mouse e teclado', 'play with mouse'],
            [UiSection.BOYG]: ['transmita seu próprio jogo', 'jogue jogos que você possui', 'stream your own game'],
            [UiSection.LEAVING_SOON]: ['saindo de cena em breve', 'saindo em breve', 'leaving soon'],
            [UiSection.GENRES]: ['gêneros', 'generos', 'genres'],
            [UiSection.ALL_GAMES]: ['ver todos os jogos', 'todos os jogos', 'see all games', 'all games'],
            [UiSection.FRIENDS]: ['jogue com amigos', 'jogar com amigos', 'play with friends'],
            [UiSection.TOUCH]: ['jogar com toque', 'jogue com toque', 'play with touch'],
        };

        const getSectionBlock = ($headingEl: HTMLElement): HTMLElement | null => {
            const $main = document.querySelector('main');
            if (!$main) {
                return null;
            }
            // Walk up to the direct child of the vertical feed container (the container holding multiple rows)
            let cur: HTMLElement | null = $headingEl;
            while (cur && cur.parentElement && cur.parentElement !== $main && cur.parentElement !== document.body) {
                const parent = cur.parentElement;
                // A feed container usually has >= 3 sibling section rows
                if (parent.children.length >= 4 && cur.getBoundingClientRect().height < window.innerHeight * 0.85) {
                    return cur;
                }
                cur = parent;
            }
            return null;
        };

        let lastFeedbackDismissAt = 0;

        const applyNewSiteDomFilters = () => {
            // 1. Auto-close post-stream feedback modal ("Como foi sua sessão?" / "How was your session?")
            if (getGlobalPref(GlobalPref.UI_DISABLE_FEEDBACK_DIALOG)) {
                let $feedbackModal: HTMLElement | null = document.querySelector<HTMLElement>('[data-feedback-container="true"]');

                if (!$feedbackModal) {
                    const dialogs = document.querySelectorAll<HTMLElement>('dialog[open], dialog, [role="dialog"], [aria-modal="true"], [data-dialog]');
                    for (const $d of dialogs) {
                        if ($d.closest('.bx-navigation-dialog')) {
                            continue;
                        }
                        // Normalize non-breaking spaces (&nbsp; / \u00A0) used in play.xbox.com Portuguese strings
                        const txt = ($d.textContent || '').replace(/\s+/g, ' ').toLowerCase();
                        if (
                            txt.includes('como foi sua sessão') ||
                            txt.includes('how was your session') ||
                            (txt.includes('ótimo!') && txt.includes('não muito bom')) ||
                            (txt.includes('great!') && txt.includes('not great'))
                        ) {
                            $feedbackModal = $d;
                            break;
                        }
                    }
                }

                const now = performance.now();
                if ($feedbackModal && (now - lastFeedbackDismissAt > 300)) {
                    lastFeedbackDismissAt = now;

                    const $dialogRoot = $feedbackModal.closest<HTMLElement>('#dialog-root') || document.getElementById('dialog-root');
                    const $backdrop = $dialogRoot?.querySelector<HTMLElement>('[data-dialog-backdrop="true"]');

                    // A. Click the React dialog backdrop directly to trigger clean React unmount
                    if ($backdrop) {
                        try {
                            $backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
                            $backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
                            $backdrop.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
                            $backdrop.click();
                        } catch (e) {}
                    }

                    // B. Native HTML <dialog> close if applicable
                    const $nativeDialog = ($feedbackModal.tagName === 'DIALOG' ? $feedbackModal : $feedbackModal.closest('dialog')) as HTMLDialogElement | null;
                    if ($nativeDialog && typeof $nativeDialog.close === 'function') {
                        try { $nativeDialog.close(); } catch (e) {}
                    }

                    // C. Dispatch Escape (keydown + keyup) on active dialog + document + window
                    const $roleDialog = $feedbackModal.closest<HTMLElement>('[role="dialog"], [data-dialog]') || $feedbackModal;
                    const escTargets: EventTarget[] = [document.activeElement || document.body, $roleDialog, document, window];
                    for (const tgt of escTargets) {
                        try {
                            tgt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
                            tgt.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
                        } catch (e) {}
                    }
                }
            }

            // 2. Hide selected sections on play.xbox.com (exact containers + heading text fallback)
            if (hiddenSections.length > 0) {
                const $main = document.querySelector('main');
                if ($main) {
                    // Direct selectors confirmed from play.xbox.com DOM
                    if (hiddenSections.includes(UiSection.JUMP_BACK_IN)) {
                        const $hero = $main.querySelector<HTMLElement>('[data-home-hero-container="true"]');
                        if ($hero) {
                            $hero.style.setProperty('display', 'none', 'important');
                        }
                    }

                    if (hiddenSections.includes(UiSection.NEWS)) {
                        const $iris = $main.querySelector<HTMLElement>('[data-home-iris-container="true"]');
                        if ($iris) {
                            $iris.style.setProperty('display', 'none', 'important');
                        }
                    }

                    if (hiddenSections.includes(UiSection.ALL_GAMES)) {
                        const $seeAllBtn = $main.querySelector<HTMLElement>('button[data-testid="home-see-all-games-button"]');
                        if ($seeAllBtn) {
                            const $wrapper = $seeAllBtn.parentElement?.parentElement || $seeAllBtn;
                            $wrapper.style.setProperty('display', 'none', 'important');
                        }
                    }

                    const headingEls = $main.querySelectorAll<HTMLElement>('h2, h3, [role="heading"], a');
                    for (const $h of headingEls) {
                        // Ignore game cards (which contain images)
                        if ($h.querySelector('img')) {
                            continue;
                        }
                        const txt = ($h.textContent || '').trim().toLowerCase().replace(/\s+/g, ' ');
                        if (!txt || txt.length > 50) {
                            continue;
                        }

                        for (const section of hiddenSections) {
                            const keywords = SECTION_HEADING_KEYWORDS[section];
                            if (keywords && keywords.some(k => txt === k || txt.startsWith(k))) {
                                const $block = $h.closest<HTMLElement>('[data-home-hero-container="true"], [data-home-iris-container="true"], div.flow-root, section.my-8') || getSectionBlock($h);
                                if ($block) {
                                    $block.style.setProperty('display', 'none', 'important');
                                }
                                break;
                            }
                        }
                    }
                }
            }

            // 3. Hide Friends sidebar block on play.xbox.com when Friends feature is disabled
            if (blockedFeatures.includes(BlockFeature.FRIENDS)) {
                const friendHeadings = document.querySelectorAll<HTMLElement>('aside h2, aside h3, aside span');
                for (const $el of friendHeadings) {
                    const txt = ($el.textContent || '').trim().toLowerCase();
                    if (txt === 'amigos' || txt === 'friends') {
                        const $block = $el.closest<HTMLElement>('section') || $el.parentElement?.parentElement;
                        if ($block && $block.tagName !== 'NAV' && $block.tagName !== 'ASIDE' && $block.tagName !== 'BODY' && $block.querySelectorAll('a[href="/"], a[href*="library"]').length === 0) {
                            $block.style.display = 'none';
                        }
                    }
                }
            }
        };

        if (disableFeedbackDialog || hiddenSections.length > 0 || blockedFeatures.includes(BlockFeature.FRIENDS)) {
            let filterTimer: number | null = null;
            const scheduleFilters = () => {
                if (filterTimer) {
                    return;
                }
                filterTimer = window.setTimeout(() => {
                    filterTimer = null;
                    applyNewSiteDomFilters();
                }, 250);
            };
            new MutationObserver(scheduleFilters).observe(document.documentElement, { childList: true, subtree: true });
            window.setTimeout(applyNewSiteDomFilters, 1500);
        }
    }

    // Show a toast when connecting/disconecting controller
    if (getGlobalPref(GlobalPref.UI_CONTROLLER_SHOW_STATUS)) {
        window.addEventListener('gamepadconnected', e => showGamepadToast(e.gamepad));
        window.addEventListener('gamepaddisconnected', e => showGamepadToast(e.gamepad));
    }
}

main();
