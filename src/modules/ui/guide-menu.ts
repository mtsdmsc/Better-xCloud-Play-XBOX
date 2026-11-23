import { AppInterface, STATES } from "@/utils/global";
import { createButton, ButtonStyle, CE } from "@/utils/html";
import { t } from "@/utils/translation";
import { SettingsDialog } from "./dialog/settings-dialog";
import { NavigationDialogManager } from "./dialog/navigation-dialog";
import { PlayXboxGamepad } from "@/utils/play-xbox-gamepad";
import { BxIcon } from "@/utils/bx-icon";
import { BxEventBus } from "@/utils/bx-event-bus";
import { getGlobalPref } from "@/utils/pref-utils";
import { UiLayout } from "@/enums/pref-values";
import { GlobalPref } from "@/enums/pref-keys";

export enum GuideMenuTab {
    HOME = 'home',
}

export class GuideMenu {
    private static instance: GuideMenu;
    public static getInstance = () => GuideMenu.instance ?? (GuideMenu.instance = new GuideMenu());

    private $renderedButtons?: HTMLElement;

    private observer: MutationObserver | null = null;
    private gamepadHomePrevPressed = false;
    private guideOpenedAt = 0;

    isGuideMenuOpen(): boolean {
        return !!document.querySelector('#guide-tab-bar, #guide-jump-landing-page');
    }

    private restoreStreamFocus() {
        if (window.location.hostname !== 'play.xbox.com' || !STATES.isPlaying) {
            return;
        }
        window.setTimeout(() => {
            if (this.isGuideMenuOpen() || NavigationDialogManager.getInstance().isShowing()) {
                return;
            }
            const $streamTarget = document.querySelector<HTMLElement>('[data-testid="media-container"] video, [data-testid="media-container"], #game-stream video, #game-stream');
            if ($streamTarget) {
                if ($streamTarget.tabIndex < 0) {
                    $streamTarget.tabIndex = -1;
                }
                $streamTarget.focus({ preventScroll: true });
            }
        }, 80);
    }

    closeGuideMenu() {
        if (window.BX_EXPOSED.dialogRoutes) {
            window.BX_EXPOSED.dialogRoutes.closeAll();
            return;
        }

        // Only click explicit Close buttons (never tab bar buttons like Achievements)
        const $newCloseBtn = document.querySelector<HTMLElement>('#dialog-root [role="dialog"] button[aria-label*="Fechar"], #dialog-root [role="dialog"] button[aria-label*="Close"]');
        if ($newCloseBtn) {
            $newCloseBtn.click();
            return;
        }

        // Use alternative method for Lite version
        const $btnClose = document.querySelector<HTMLElement>('#gamepass-dialog-root button[class^=Header-module__closeButton]');
        if ($btnClose) {
            $btnClose.click();
            return;
        }

        const $dialog = document.querySelector<HTMLElement>('#guide-jump-landing-page, #guide-tab-bar, #dialog-root [role="dialog"]') || document.activeElement as HTMLElement || document.documentElement;
        const escDown = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
        const escUp = new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
        $dialog.dispatchEvent(escDown);
        $dialog.dispatchEvent(escUp);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
    }

    watchGuideMenu = () => {
        if (this.observer) {
            return;
        }

        let wasOpen = false;
        this.observer = new MutationObserver(() => {
            const isOpen = this.isGuideMenuOpen();
            if (isOpen && !wasOpen) {
                this.guideOpenedAt = performance.now();
            } else if (!isOpen && wasOpen) {
                this.restoreStreamFocus();
            }
            wasOpen = isOpen;

            const $newGuideRoot = document.querySelector<HTMLElement>('#guide-jump-landing-page');
            if ($newGuideRoot) {
                this.injectHome($newGuideRoot, STATES.isPlaying);
            }
        });

        this.observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        PlayXboxGamepad.setGuideOpenChecker(() => this.isGuideMenuOpen());

        // Poll physical gamepad Xbox/Home button (button[16]) to close the Guide menu if play.xbox.com doesn't close it natively
        window.setInterval(() => {
            if (NavigationDialogManager.getInstance().isShowing()) {
                this.gamepadHomePrevPressed = false;
                return;
            }
            const gamepads = PlayXboxGamepad.getRawGamepads();
            let homePressed = false;
            for (const gp of gamepads) {
                if (gp && gp.connected && gp.buttons[16]?.pressed) {
                    homePressed = true;
                    break;
                }
            }

            if (homePressed && !this.gamepadHomePrevPressed) {
                if (this.isGuideMenuOpen() && (performance.now() - this.guideOpenedAt > 500)) {
                    // Wait briefly so native Guide toggle runs first; only close via Escape if still open
                    window.setTimeout(() => {
                        if (this.isGuideMenuOpen() && !NavigationDialogManager.getInstance().isShowing()) {
                            this.closeGuideMenu();
                        }
                    }, 150);
                }
            }
            this.gamepadHomePrevPressed = homePressed;
        }, 60);
    }

    private renderButtons() {
        if (this.$renderedButtons) {
            return this.$renderedButtons;
        }

        const buttons = {
            scriptSettings: createButton({
                label: t('better-xcloud'),
                icon: BxIcon.BETTER_XCLOUD,
                style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE | ButtonStyle.PRIMARY,
                onClick: () => {
                    if (window.location.hostname === 'play.xbox.com') {
                        this.closeGuideMenu();
                        setTimeout(() => SettingsDialog.getInstance().show(), 100);
                        return;
                    }

                    // Wait until the Guide dialog is closed
                    BxEventBus.Script.once('dialog.dismissed', () => {
                        setTimeout(() => SettingsDialog.getInstance().show(), 50);
                    });

                    // Close all xCloud's dialogs
                    this.closeGuideMenu();
                },
            }),

            closeApp: AppInterface && createButton({
                icon: BxIcon.POWER,
                label: t('close-app'),
                title: t('close-app'),
                style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE | ButtonStyle.DANGER,
                onClick: e => {
                    AppInterface.closeApp();
                },

                attributes: {
                    'data-state': 'normal',
                },
            }),

            reloadPage: createButton({
                icon: BxIcon.REFRESH,
                label: t('reload-page'),
                title: t('reload-page'),
                style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE,
                onClick: () => {
                    // Close all xCloud's dialogs
                    this.closeGuideMenu();

                    if (STATES.isPlaying) {
                        confirm(t('confirm-reload-stream')) && window.location.reload();
                    } else {
                        window.location.reload();
                    }
                },
            }),

            backToHome: createButton({
                icon: BxIcon.HOME,
                label: t('back-to-home'),
                title: t('back-to-home'),
                style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE,
                onClick: () => {
                    // Close all xCloud's dialogs
                    this.closeGuideMenu();

                    confirm(t('back-to-home-confirm')) && (window.location.href = window.location.hostname === 'play.xbox.com' ? window.location.origin : window.location.href.substring(0, 31));
                },
                attributes: {
                    'data-state': 'playing',
                },
            }),
        };

        const buttonsLayout = [
            buttons.scriptSettings,
            [
                buttons.backToHome,
                buttons.reloadPage,
                buttons.closeApp,
            ],
        ];

        const $div = CE('div', {
            class: 'bx-guide-home-buttons',
        });

        // Set TV tag
        if (STATES.userAgent.isTv || getGlobalPref(GlobalPref.UI_LAYOUT) === UiLayout.TV) {
            document.body.dataset.bxMediaType = 'tv';
        }

        for (const $button of buttonsLayout) {
            if (!$button) {
                continue;
            }

            if ($button instanceof HTMLElement) {
                $div.appendChild($button);
            } else if (Array.isArray($button)) {
                const $wrapper = CE('div', {});
                for (const $child of $button) {
                    $child && $wrapper.appendChild($child);
                }
                $div.appendChild($wrapper);
            }
        }

        this.$renderedButtons = $div;
        return $div;
    }

    injectHome($root: HTMLElement, isPlaying = false) {
        const $buttons = this.renderButtons();
        if ($root.contains($buttons)) {
            return;
        }

        // Find the element to add buttons to
        let $target: HTMLElement | null = null;
        if (isPlaying) {
            // Quit button
            $target = $root.querySelector('a[class*=QuitGameButton]');

            // Hide xCloud's Home button
            const $btnXcloudHome = $root.querySelector<HTMLElement>('div[class^=HomeButtonWithDivider]');
            $btnXcloudHome && ($btnXcloudHome.style.display = 'none');
        } else {
            // Last divider
            const $dividers = $root.querySelectorAll('div[class*=Divider-module__divider]');
            if ($dividers) {
                $target = $dividers[$dividers.length - 1] as HTMLElement;
            }
        }

        if (!$target && window.location.hostname === 'play.xbox.com') {
            $buttons.dataset.isPlaying = isPlaying.toString();
            $buttons.style.cssText = 'padding: 12px 16px; display: flex; flex-direction: column; gap: 8px;';
            $root.appendChild($buttons);
            return;
        }

        if (!$target) {
            return false;
        }

        $buttons.dataset.isPlaying = isPlaying.toString();
        $target.insertAdjacentElement('afterend', $buttons);
    }
}
