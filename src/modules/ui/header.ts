import { isFullVersion } from "@macros/build" with { type: "macro" };

import { SCRIPT_VERSION, STATES } from "@utils/global";
import { createButton, ButtonStyle, CE } from "@utils/html";
import { BxIcon } from "@utils/bx-icon";
import { getPreferredServerRegion } from "@utils/region";
import { RemotePlayManager } from "@/modules/remote-play-manager";
import { t } from "@utils/translation";
import { SettingsDialog } from "./dialog/settings-dialog";
import { GlobalPref } from "@/enums/pref-keys";
import { getGlobalPref } from "@/utils/pref-utils";
import { BxLogger } from "@/utils/bx-logger";
import { BxEventBus } from "@/utils/bx-event-bus";
import { BlockFeature } from "@/enums/pref-values";
import { Toast } from "@/utils/toast";

export class HeaderSection {
    private static instance: HeaderSection;
    public static getInstance = () => HeaderSection.instance ?? (HeaderSection.instance = new HeaderSection());
    private readonly LOG_TAG = 'HeaderSection';

    private $btnRemotePlay: HTMLElement | null;
    private $btnSettings: HTMLElement;
    private $buttonsWrapper: HTMLElement;
    private observer: MutationObserver | null = null;

    constructor() {
        BxLogger.info(this.LOG_TAG, 'constructor()');

        if (isFullVersion()) {
            this.$btnRemotePlay = createButton({
                classes: ['bx-header-remote-play-button', 'bx-gone'],
                icon: BxIcon.REMOTE_PLAY,
                title: t('remote-play'),
                style: ButtonStyle.GHOST | ButtonStyle.FOCUSABLE | ButtonStyle.CIRCULAR,
                onClick: e => RemotePlayManager.getInstance()?.togglePopup(),
            });
        } else {
            this.$btnRemotePlay = null;
        }

        let $btnSettings = this.$btnSettings = createButton({
            classes: ['bx-header-settings-button', 'bx-gone'],
            label: t('better-xcloud'),
            title: `${t('better-xcloud')} (Alt + Shift + X)`,
            style: ButtonStyle.FROSTED | ButtonStyle.DROP_SHADOW | ButtonStyle.FOCUSABLE | ButtonStyle.FULL_HEIGHT,
            onClick: e => SettingsDialog.getInstance().show(),
        });

        this.$buttonsWrapper = CE('div', {
            class: 'bx-header-buttons-wrapper',
            style: 'display: flex; align-items: center; gap: 8px;',
        },
            !getGlobalPref(GlobalPref.BLOCK_FEATURES).includes(BlockFeature.REMOTE_PLAY) ? this.$btnRemotePlay : null,
            this.$btnSettings,
        );

        BxEventBus.Script.on('xcloud.server', ({ status }) => {
            if (status === 'ready') {
                STATES.isSignedIn = true;

                // Show server name
                $btnSettings.querySelector('span')!.textContent = getPreferredServerRegion(true) || t('better-xcloud');
                const PREF_LATEST_VERSION = getGlobalPref(GlobalPref.VERSION_LATEST);
                // Show new update status
                if (!SCRIPT_VERSION.includes('beta') && PREF_LATEST_VERSION && PREF_LATEST_VERSION !== SCRIPT_VERSION) {
                    $btnSettings.setAttribute('data-update-available', 'true');
                }
            } else if (status === 'error') {
                Toast.show(t('server-list-error'), '❌', { instant: true });
            } else if (status === 'unavailable') {
                STATES.supportedRegion = false;

                // Open Settings dialog on Unsupported page
                const $unsupportedPage = document.querySelector<HTMLElement>('div[class^=UnsupportedMarketPage-module__container]');
                if ($unsupportedPage) {
                    SettingsDialog.getInstance().show();
                }
            }

            $btnSettings.classList.remove('bx-gone');
        });
        BxEventBus.Script.on('setting.changed', ({ settingKey }) => {
            if (settingKey === GlobalPref.SERVER_REGION && Object.keys(STATES.serverRegions).length > 0) {
                $btnSettings.querySelector('span')!.textContent = getPreferredServerRegion(true) || t('better-xcloud');
            }
        });
    }

    watchHeader = () => {
        if (this.observer) {
            return;
        }

        this.checkHeader();
        this.observer = new MutationObserver(() => {
            if (!this.$buttonsWrapper.isConnected) {
                this.checkHeader();
            }
        });

        this.observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    checkHeader = () => {
        // Novo site: play.xbox.com (Desktop)
        if (window.location.hostname === 'play.xbox.com') {
            const $nav = document.querySelector('nav[data-group] [role=toolbar]')
                ?? document.querySelector('nav[role=banner]')
                ?? document.querySelector('nav');
            if (!$nav) {
                return;
            }

            // IDs: title-bar-* (current) / nav-* (older markup)
            const $anchorBtn = $nav.querySelector('#title-bar-controller, #title-bar-notifications, #title-bar-me, #nav-controller, #nav-me');
            const $anchorItem = $anchorBtn?.closest('span')?.parentElement;
            const $rightSection = $anchorItem?.parentElement;
            if (!$anchorItem || !$rightSection) {
                return;
            }

            if ($rightSection.contains(this.$buttonsWrapper)) {
                return;
            }

            this.$buttonsWrapper.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; margin-right: 8px; z-index: 50; flex-shrink: 0;';
            $rightSection.insertBefore(this.$buttonsWrapper, $anchorItem);

            if ($nav.querySelector('#gamerpic-visual')) {
                STATES.isSignedIn = true;
            }

            if (Object.keys(STATES.serverRegions).length > 0) {
                this.$btnSettings.querySelector('span')!.textContent = getPreferredServerRegion(true) || t('better-xcloud');
            }

            // Garante que o botão apareça mesmo antes do evento xcloud.server
            this.$btnSettings.classList.remove('bx-gone');
            return;
        }

        // Site antigo: www.xbox.com/*/play
        const $header = document.querySelector('#gamepass-root header[class^=Header-module__header]');
        if (!$header) {
            return;
        }

        let $target = $header.querySelector('div[class*=EdgewaterHeader-module__rightSectionSpacing], div[class*=RemotePlayHeader-module__rightSectionSpacing]');
        if (!$target) {
            $target = document.querySelector('div[class^=UnsupportedMarketPage-module__buttons]');
        }

        $target?.appendChild(this.$buttonsWrapper);

        if (!STATES.isSignedIn) {
            BxEventBus.Script.emit('xcloud.server', { status: 'signed-out' });
        }
    }

    showRemotePlayButton() {
        this.$btnRemotePlay?.classList.remove('bx-gone');
    }
}