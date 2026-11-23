import { BxEvent } from "@/utils/bx-event";
import { BxIcon } from "@/utils/bx-icon";
import { CE, createSvgIcon, getReactProps, isElementVisible, secondsToHm } from "@/utils/html";
import { XcloudApi } from "@/utils/xcloud-api";

interface GameTimeElement extends HTMLElement {
    hasWaitTime?: boolean;
    waitTimePending?: boolean;
}

export class GameTile {
    static timeoutId: number | null;
    static pendingElement: HTMLElement | null = null;

    private static async showWaitTime($elm: HTMLElement, productId: string) {
        const tile = $elm as GameTimeElement;
        if (tile.hasWaitTime || tile.waitTimePending) {
            return;
        }
        tile.waitTimePending = true;

        try {
            let totalWaitTime;

            const api = XcloudApi.getInstance();
            const info = await api.getTitleInfo(productId);
            if (!info) {
                // Token/region may not be ready yet; allow retry on next hover/scan
                return;
            }
            tile.hasWaitTime = true;

            if (info.titleId) {
                const waitTime = await api.getWaitTime(info.titleId);
                if (waitTime) {
                    totalWaitTime = waitTime.estimatedAllocationTimeInSeconds;
                }
            }

            if (typeof totalWaitTime === 'number' && isElementVisible($elm) && !$elm.querySelector('.bx-game-tile-wait-time')) {
                const $div = CE('div', { class: 'bx-game-tile-wait-time' },
                    createSvgIcon(BxIcon.PLAYTIME),
                    CE('span', false, totalWaitTime < 60 ? totalWaitTime + 's' : secondsToHm(totalWaitTime)),
                );

                const duration = (totalWaitTime >= 15 * 60) ? 'long' : (totalWaitTime >= 10 * 60) ? 'medium' : (totalWaitTime >= 5 * 60 ) ? 'short' : '';
                if (duration) {
                    $div.dataset.duration = duration;
                }

                if (window.location.hostname === 'play.xbox.com') {
                    if (getComputedStyle($elm).position === 'static') {
                        $elm.style.position = 'relative';
                    }
                    // Insert at end with z-index: 20 so it always paints above hero/sticker overlays
                    $elm.insertAdjacentElement('beforeend', $div);
                } else {
                    $elm.insertAdjacentElement('afterbegin', $div);
                }
            }
        } finally {
            tile.waitTimePending = false;
        }
    }

    private static requestWaitTime($elm: HTMLElement, productId: string) {
        if (GameTile.pendingElement === $elm && GameTile.timeoutId) {
            return;
        }
        GameTile.timeoutId && clearTimeout(GameTile.timeoutId);
        GameTile.pendingElement = $elm;
        GameTile.timeoutId = window.setTimeout(async () => {
            GameTile.timeoutId = null;
            GameTile.pendingElement = null;
            GameTile.showWaitTime($elm, productId);
        }, 450);
    }

    private static findProductId($elm: HTMLElement): string | null {
        let productId = null;

        try {
            if (($elm.tagName === 'BUTTON' && $elm.className.includes('MruGameCard')) || (($elm.tagName === 'A' && $elm.className.includes('GameCard')))) {
                let props = getReactProps($elm.parentElement!);

                // When context menu is enabled
                if (Array.isArray(props.children)) {
                    productId = props.children[0].props.productId;
                } else {
                    productId = props.children.props.productId;
                }
            } else if ($elm.tagName === 'A' && $elm.className.includes('GameItem'))  {
                let props = getReactProps($elm.parentElement!);
                props = props.children.props;

                if (props.location !== 'NonStreamableGameItem') {
                    if ('productId' in props) {
                        productId = props.productId;
                    } else {
                        // Search page
                        productId = props.children.props.productId;
                    }
                }
            }
        } catch (e) {}

        return productId;
    }

    private static extractProductIdFromString(str: string): string | null {
        if (!str) {
            return null;
        }
        const match = str.match(/\/(?:stream|games|launch|product|products)\/[^/?#]+\/([A-Za-z0-9]{12})(?:[/?#]|$)/i)
            || str.match(/\/(?:stream|games|launch|product|products)\/([A-Za-z0-9]{12})(?:[/?#]|$)/i)
            || str.match(/\/([A-Za-z0-9]{12})(?:[/?#]|$)/);
        return match ? match[1].toUpperCase() : null;
    }

    private static extractProductIdFromObject(obj: any, depth = 0, visited = new Set<any>()): string | null {
        if (!obj || typeof obj !== 'object' || depth > 4 || visited.has(obj)) {
            return null;
        }
        visited.add(obj);

        const directKeys = ['productId', 'storeId', 'bigId'];
        for (const key of directKeys) {
            const val = obj[key];
            if (typeof val === 'string' && /^[A-Za-z0-9]{12}$/.test(val)) {
                return val.toUpperCase();
            }
        }

        const urlKeys = ['href', 'to', 'url', 'path'];
        for (const key of urlKeys) {
            const val = obj[key];
            if (typeof val === 'string') {
                const extracted = GameTile.extractProductIdFromString(val);
                if (extracted) {
                    return extracted;
                }
            }
        }

        const nestedKeys = ['product', 'game', 'item', 'data', 'props', 'children', 'memoizedProps'];
        for (const key of nestedKeys) {
            const val = obj[key];
            if (!val) {
                continue;
            }
            if (Array.isArray(val)) {
                for (let i = 0; i < Math.min(val.length, 4); i++) {
                    const found = GameTile.extractProductIdFromObject(val[i], depth + 1, visited);
                    if (found) {
                        return found;
                    }
                }
            } else if (typeof val === 'object') {
                const found = GameTile.extractProductIdFromObject(val, depth + 1, visited);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    private static findProductIdFromNewSite($elm: HTMLElement): string | null {
        // 1. Direct data-product-id attribute on element or descendant
        const dataId = $elm.dataset.productId
            || $elm.getAttribute('data-product-id')
            || $elm.querySelector<HTMLElement>('[data-product-id]')?.getAttribute('data-product-id');
        if (dataId && /^[A-Za-z0-9]{12}$/.test(dataId)) {
            return dataId.toUpperCase();
        }

        // 2. href on element or descendant link (supports /stream/, /products/, /games/, /launch/)
        const href = $elm.getAttribute('href') || $elm.querySelector<HTMLAnchorElement>('a[href]')?.getAttribute('href') || '';
        const fromHref = GameTile.extractProductIdFromString(href);
        if (fromHref) {
            return fromHref;
        }

        // 3. Descendant badge/sticker element id (e.g. "9N3P3TRJGWV0-BadgeStickerGamePass")
        const idEls = $elm.querySelectorAll<HTMLElement>('[id]');
        for (const $idEl of idEls) {
            const idMatch = ($idEl.id || '').match(/^([A-Za-z0-9]{12})-/);
            if (idMatch) {
                return idMatch[1].toUpperCase();
            }
        }

        // 4. React props & React Fiber tree (covers "Voltar a jogar" hero cards without data-product-id)
        try {
            const fiberKey = Object.keys($elm).find(k => k.startsWith('__reactFiber'));
            if (fiberKey) {
                let fiber = ($elm as any)[fiberKey];
                for (let step = 0; step < 12 && fiber; step++) {
                    const fromFiber = GameTile.extractProductIdFromObject(fiber.memoizedProps)
                        || GameTile.extractProductIdFromObject(fiber.pendingProps);
                    if (fromFiber) {
                        return fromFiber;
                    }
                    fiber = fiber.return;
                }
            }

            let cur: HTMLElement | null = $elm;
            for (let i = 0; i < 4 && cur && cur.tagName !== 'SECTION' && cur.tagName !== 'MAIN'; i++) {
                const props = getReactProps(cur);
                if (props) {
                    const fromProps = GameTile.extractProductIdFromObject(props);
                    if (fromProps) {
                        return fromProps;
                    }
                }
                cur = cur.parentElement;
            }
        } catch (e) {}

        return null;
    }

    private static scanHeroCards() {
        const $hero = document.querySelector<HTMLElement>('[data-home-hero-container="true"]');
        if (!$hero) {
            return;
        }

        const candidates = $hero.querySelectorAll<HTMLElement>('button, a, [data-product-id]');
        for (const $card of candidates) {
            const tile = $card as GameTimeElement;
            if (tile.hasWaitTime || tile.waitTimePending) {
                continue;
            }
            if (!$card.querySelector('img')) {
                continue;
            }
            const productId = GameTile.findProductIdFromNewSite($card);
            if (productId) {
                GameTile.showWaitTime($card, productId);
            }
        }
    }

    static setup() {
        // Novo site: play.xbox.com (detecta hover/foco nos cartões de jogos e carrega automaticamente "Voltar a jogar")
        if (window.location.hostname === 'play.xbox.com') {
            const CARD_SELECTOR = 'a[href*="/stream/"], a[href*="/games/"], a[href*="/launch/"], a[href*="/product/"], a[href*="/products/"], [data-product-id], [data-home-hero-container="true"] button, [data-home-hero-container="true"] a';

            const onCardInteract = (e: Event) => {
                const target = e.target as HTMLElement | null;
                if (!target || !target.closest) {
                    return;
                }
                const $card = target.closest<HTMLElement>(CARD_SELECTOR);
                if (!$card || ($card as GameTimeElement).hasWaitTime || ($card as GameTimeElement).waitTimePending) {
                    return;
                }
                // Ignora links/botões sem imagem de jogo (ex.: setas de rolagem, títulos de seção)
                if (!$card.querySelector('img')) {
                    return;
                }
                const productId = GameTile.findProductIdFromNewSite($card);
                if (productId) {
                    if ($card.closest('[data-home-hero-container="true"]')) {
                        GameTile.showWaitTime($card, productId);
                    } else {
                        GameTile.requestWaitTime($card, productId);
                    }
                }
            };

            document.addEventListener('pointerenter', onCardInteract, true);
            document.addEventListener('focusin', onCardInteract, true);

            // Carrega tempo de espera automaticamente nos cartões da seção "Voltar a jogar"
            let heroScanTimer: number | null = null;
            const scheduleHeroScan = () => {
                if (heroScanTimer) {
                    return;
                }
                heroScanTimer = window.setTimeout(() => {
                    heroScanTimer = null;
                    GameTile.scanHeroCards();
                }, 600);
            };
            new MutationObserver(scheduleHeroScan).observe(document.documentElement, { childList: true, subtree: true });
            window.setTimeout(() => GameTile.scanHeroCards(), 1800);
            window.setTimeout(() => GameTile.scanHeroCards(), 4000);
        }

        window.addEventListener(BxEvent.NAVIGATION_FOCUS_CHANGED, e => {
            const $elm = (e as any).element;
            const className = $elm.className || '';

            if (className.includes('MruGameCard')) {
                // Show the wait time of every games in the "Jump back in" section all at once
                const $ol = $elm.closest('ol') as GameTimeElement;
                if ($ol && !$ol.hasWaitTime) {
                    $ol.hasWaitTime = true;
                    $ol.querySelectorAll<HTMLElement>('button[class*=MruGameCard]').forEach(($elm: HTMLElement) => {
                        const productId = GameTile.findProductId($elm);
                        productId && GameTile.showWaitTime($elm, productId);
                    });
                }
            } else {
                const productId = GameTile.findProductId($elm);
                productId && GameTile.requestWaitTime($elm, productId);
            }
        });
    }
}
