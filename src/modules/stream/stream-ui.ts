import { STATES } from "@utils/global.ts";
import { createSvgIcon } from "@utils/html.ts";
import { BxIcon, type BxIconRaw } from "@utils/bx-icon";
import { t } from "@utils/translation.ts";
import { StreamBadges } from "./stream-badges.ts";
import { StreamStats } from "./stream-stats.ts";
import { SettingsDialog } from "../ui/dialog/settings-dialog.ts";
import { BxEventBus } from "@/utils/bx-event-bus.ts";


export class StreamUiHandler {
    private static $btnStreamSettings: HTMLElement | null | undefined;
    private static $btnStreamStats: HTMLElement | null | undefined;
    private static $btnRefresh: HTMLElement | null | undefined;
    private static $btnHome: HTMLElement | null | undefined;

    private static cloneStreamHudButton($btnOrg: HTMLElement, label: string, svgIcon: BxIconRaw): HTMLElement | null {
        if (!$btnOrg) {
            return null;
        }

        const $container = $btnOrg.cloneNode(true) as HTMLElement;
        let timeout: number | null;

        // Prevent touching other button while the bar is showing/hiding
        if (STATES.browser.capabilities.touch) {
            const onTransitionStart = (e: TransitionEvent) => {
                if (e.propertyName !== 'opacity') {
                    return;
                }

                timeout && clearTimeout(timeout);
                (e.target as HTMLElement).style.pointerEvents = 'none';
            };

            const onTransitionEnd = (e: TransitionEvent) => {
                if (e.propertyName !== 'opacity') {
                    return;
                }

                const $streamHud = (e.target as HTMLElement).closest<HTMLElement>('#StreamHud');
                if (!$streamHud) {
                    return;
                }

                const left = $streamHud.style.left;
                if (left === '0px') {
                    const $target = e.target as HTMLElement;
                    timeout && clearTimeout(timeout);
                    timeout = window.setTimeout(() => {
                        $target.style.pointerEvents = 'auto';
                    }, 100);
                }
            };

            $container.addEventListener('transitionstart', onTransitionStart);
            $container.addEventListener('transitionend', onTransitionEnd);
        }

        const $button = $container.querySelector<HTMLButtonElement>('button');
        if (!$button) {
            return null;
        }
        $button.setAttribute('title', label);

        const $orgSvg = $button.querySelector<SVGElement>('svg');
        if (!$orgSvg) {
            return null;
        }

        const $svg = createSvgIcon(svgIcon);
        $svg.style.fill = 'none';
        $svg.setAttribute('class', $orgSvg.getAttribute('class') || '');
        $svg.ariaHidden = 'true';

        $orgSvg.replaceWith($svg);
        return $container;
    }

    private static cloneCloseButton($btnOrg: HTMLElement, icon: BxIconRaw, className: string, onChange: any): HTMLElement | null {
        if (!$btnOrg) {
            return null;
        }
        // Create button from the Close button
        const $btn = $btnOrg.cloneNode(true) as HTMLElement;

        const $svg = createSvgIcon(icon);
        // Copy classes
        $svg.setAttribute('class', $btn.firstElementChild!.getAttribute('class') || '');
        $svg.style.fill = 'none';

        $btn.classList.add(className);
        // Remove icon
        $btn.removeChild($btn.firstElementChild!);
        // Add icon
        $btn.appendChild($svg);
        // Add "click" event listener
        $btn.addEventListener('click', onChange);

        return $btn;
    }

    static async handleStreamMenu() {
        const $btnCloseHud = document.querySelector<HTMLElement>('button[class*=StreamMenu-module__backButton]');
        if (!$btnCloseHud) {
            return;
        }

        let $btnRefresh = StreamUiHandler.$btnRefresh;
        let $btnHome = StreamUiHandler.$btnHome;

        // Create Refresh button from the Close button
        if (typeof $btnRefresh === 'undefined') {
            $btnRefresh = StreamUiHandler.cloneCloseButton($btnCloseHud, BxIcon.REFRESH, 'bx-stream-refresh-button', () => {
                confirm(t('confirm-reload-stream')) && window.location.reload();
            });
        }

        if (typeof $btnHome === 'undefined') {
            $btnHome = StreamUiHandler.cloneCloseButton($btnCloseHud, BxIcon.HOME, 'bx-stream-home-button', () => {
                confirm(t('back-to-home-confirm')) && (window.location.href = window.location.hostname === 'play.xbox.com' ? window.location.origin : window.location.href.substring(0, 31));
            });
        }

        // Add to website
        if ($btnRefresh && $btnHome) {
            $btnCloseHud.insertAdjacentElement('afterend', $btnRefresh);
            $btnRefresh.insertAdjacentElement('afterend', $btnHome);
        }

        // Render stream badges
        const $menu = document.querySelector('div[class*=StreamMenu-module__menuContainer] > div[class*=Menu-module]');
        $menu?.appendChild(await StreamBadges.getInstance().render());
    }

    static handleSystemMenu($streamHud: HTMLElement) {
        // Get the last button
        const $orgButton = $streamHud.querySelector<HTMLElement>('div[class^=HUDButton]');
        if (!$orgButton) {
            return;
        }

        if (StreamUiHandler.$btnStreamSettings && $streamHud.contains(StreamUiHandler.$btnStreamSettings)) {
            return;
        }

        const hideGripHandle = () => {
            // Grip handle
            const $gripHandle = document.querySelector<HTMLElement>('#StreamHud button[class^=GripHandle]');
            if ($gripHandle && $gripHandle.ariaExpanded === 'true') {
                $gripHandle.dispatchEvent(new PointerEvent('pointerdown'));
                $gripHandle.click();
                $gripHandle.dispatchEvent(new PointerEvent('pointerdown'));
                $gripHandle.click();
            }
        }

        // Create Stream Settings button
        let $btnStreamSettings = StreamUiHandler.$btnStreamSettings;
        if (typeof $btnStreamSettings === 'undefined') {
            $btnStreamSettings = StreamUiHandler.cloneStreamHudButton($orgButton, t('better-xcloud'), BxIcon.BETTER_XCLOUD);
            $btnStreamSettings?.addEventListener('click', e => {
                hideGripHandle();
                e.preventDefault();

                // Show Stream Settings dialog
                SettingsDialog.getInstance().show();
            });

            StreamUiHandler.$btnStreamSettings = $btnStreamSettings;
        }

        // Create Stream Stats button
        const streamStats = StreamStats.getInstance();
        let $btnStreamStats = StreamUiHandler.$btnStreamStats;
        if (typeof $btnStreamStats === 'undefined') {
            $btnStreamStats = StreamUiHandler.cloneStreamHudButton($orgButton, t('stream-stats'), BxIcon.STREAM_STATS);
            $btnStreamStats?.addEventListener('click', async (e) => {
                hideGripHandle();
                e.preventDefault();

                // Toggle Stream Stats
                await streamStats.toggle();

                const btnStreamStatsOn = (!streamStats.isHidden() && !streamStats.isGlancing());
                $btnStreamStats!.classList.toggle('bx-stream-menu-button-on', btnStreamStatsOn);
            });

            StreamUiHandler.$btnStreamStats = $btnStreamStats;
        }

        const $btnParent = $orgButton.parentElement!;

        if ($btnStreamSettings && $btnStreamStats) {
            const btnStreamStatsOn = (!streamStats.isHidden() && !streamStats.isGlancing());
            $btnStreamStats.classList.toggle('bx-stream-menu-button-on', btnStreamStatsOn);

            // Insert buttons after Stream Settings button
            $btnParent.insertBefore($btnStreamStats, $btnParent.lastElementChild);
            $btnParent.insertBefore($btnStreamSettings, $btnStreamStats);
        }

        // Move the Dots button to the beginning
        const $dotsButton = $btnParent.lastElementChild!;
        $dotsButton.parentElement!.insertBefore($dotsButton, $dotsButton.parentElement!.firstElementChild);
    }

    private static hudObserver: MutationObserver | null = null;

    static watchStreamHud() {
        if (StreamUiHandler.hudObserver) {
            return;
        }

        const checkNewHud = () => {
            const $nexusBtn = document.getElementById('NexusId');
            if (!$nexusBtn) {
                return;
            }

            const $nexusSpan = $nexusBtn.closest('span') || $nexusBtn;
            const $buttonsRow = $nexusSpan.parentElement;
            const $outerSlide = $buttonsRow?.parentElement?.parentElement;
            if (!$buttonsRow) {
                return;
            }

            // Detect expanded state of the new HUD for Quick Glance stats
            const $gripBtn = $buttonsRow.parentElement?.querySelector<HTMLButtonElement>('button[aria-expanded]');
            const isExpanded = $gripBtn ? $gripBtn.getAttribute('aria-expanded') === 'true' : !$buttonsRow.hasAttribute('inert');
            BxEventBus.Stream.emit('ui.streamHud.rendered', { expanded: isExpanded });

            // Watch attribute changes on the grip handle / buttons row for Quick Glance
            if (!$buttonsRow.dataset.bxWatched) {
                $buttonsRow.dataset.bxWatched = 'true';
                const attrObserver = new MutationObserver(() => {
                    const expanded = $gripBtn ? $gripBtn.getAttribute('aria-expanded') === 'true' : !$buttonsRow.hasAttribute('inert');
                    BxEventBus.Stream.emit('ui.streamHud.rendered', { expanded });
                });
                attrObserver.observe($buttonsRow, { attributes: true, attributeFilter: ['inert', 'aria-hidden', 'class'] });
                if ($gripBtn) {
                    attrObserver.observe($gripBtn, { attributes: true, attributeFilter: ['aria-expanded'] });
                }
            }

            if ($buttonsRow.querySelector('.bx-hud-settings-btn')) {
                return;
            }

            // Adjust translateX when collapsed so the 3 buttons stay hidden properly when collapsed
            if ($outerSlide && $outerSlide.style.transform.includes('-40px')) {
                // Observe style transform on outerSlide so when collapsed with 3 buttons (-120px) it hides cleanly
                const fixSlideOffset = () => {
                    const expanded = $gripBtn ? $gripBtn.getAttribute('aria-expanded') === 'true' : !$buttonsRow.hasAttribute('inert');
                    if (!expanded && $outerSlide.style.transform && !$outerSlide.style.transform.includes('0px')) {
                        $outerSlide.style.transform = 'translateX(-112px)';
                    }
                };
                fixSlideOffset();
                new MutationObserver(fixSlideOffset).observe($outerSlide, { attributes: true, attributeFilter: ['style'] });
            }

            const cloneNewButton = (label: string, svgIcon: BxIconRaw, extraClass: string) => {
                const $span = $nexusSpan.cloneNode(true) as HTMLElement;
                const $btn = ($span.tagName === 'BUTTON' ? $span : $span.querySelector('button')) as HTMLButtonElement;
                if (!$btn) {
                    return null;
                }
                $btn.removeAttribute('id');
                $btn.setAttribute('aria-label', label);
                $btn.setAttribute('title', label);
                $btn.classList.add(extraClass);

                const $orgSvg = $btn.querySelector('svg');
                if ($orgSvg) {
                    const $svg = createSvgIcon(svgIcon);
                    $svg.style.fill = 'none';
                    $svg.setAttribute('class', $orgSvg.getAttribute('class') || '');
                    $svg.ariaHidden = 'true';
                    $orgSvg.replaceWith($svg);
                }
                return { $span, $btn };
            };

            const collapseHud = () => {
                if ($gripBtn && $gripBtn.getAttribute('aria-expanded') === 'true') {
                    $gripBtn.click();
                }
            };

            const settingsBtnObj = cloneNewButton(t('better-xcloud'), BxIcon.BETTER_XCLOUD, 'bx-hud-settings-btn');
            const statsBtnObj = cloneNewButton(t('stream-stats'), BxIcon.STREAM_STATS, 'bx-hud-stats-btn');

            if (settingsBtnObj && statsBtnObj) {
                const streamStats = StreamStats.getInstance();

                settingsBtnObj.$btn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    collapseHud();
                    SettingsDialog.getInstance().show();
                });

                const updateStatsBtnState = () => {
                    const isOn = !streamStats.isHidden() && !streamStats.isGlancing();
                    statsBtnObj.$btn.classList.toggle('bx-stream-menu-button-on', isOn);
                };

                statsBtnObj.$btn.addEventListener('click', async e => {
                    e.preventDefault();
                    e.stopPropagation();
                    await streamStats.toggle();
                    updateStatsBtnState();
                    collapseHud();
                    statsBtnObj.$btn.blur();
                });

                updateStatsBtnState();
                $buttonsRow.appendChild(settingsBtnObj.$span);
                $buttonsRow.appendChild(statsBtnObj.$span);
            }
        };

        checkNewHud();
        StreamUiHandler.hudObserver = new MutationObserver(checkNewHud);
        StreamUiHandler.hudObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    static reset() {
        StreamUiHandler.$btnStreamSettings = undefined;
        StreamUiHandler.$btnStreamStats = undefined;
        StreamUiHandler.$btnRefresh = undefined;
        StreamUiHandler.$btnHome = undefined;
    }
}
