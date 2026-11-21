import { CE } from "@utils/html";


export function getBasePlayUrl(): string {
    return window.location.hostname === 'play.xbox.com' ? window.location.origin : window.location.href.substring(0, 31);
}

export function localRedirect(path: string) {
    const url = getBasePlayUrl() + path;

    const $pageContent = document.getElementById('PageContent');
    if (!$pageContent) {
        window.location.href = url;
        return;
    }

    const $anchor = CE('a', {
            href: url,
            class: 'bx-hidden bx-offscreen',
        }, '');
    $anchor.addEventListener('click', e => {
        // Remove element after clicking on it
        window.setTimeout(() => {
            $pageContent.removeChild($anchor);
        }, 1000);
    });

    $pageContent.appendChild($anchor);
    $anchor.click();
}

window.localRedirect = localRedirect;
