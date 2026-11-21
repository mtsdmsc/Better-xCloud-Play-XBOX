import { StorageKey } from "@/enums/pref-keys";
import { NATIVE_FETCH } from "./bx-flags";
import { BxLogger } from "./bx-logger";
import { BxEventBus } from "./bx-event-bus";

// Offline snapshots embedded for play.xbox.com (where CSP blocks external GitHub fetches)
const OFFLINE_NATIVE_MKB_LIST: ForceNativeMkbResponse['data'] = {
    "9P6DWL7R6NTL": "7 Days to Die",
    "9NFCMC3S42NV": "ANIMAL WELL",
    "9N4096HX1WWQ": "Assassin's Creed Mirage",
    "9P4NJFH17MRT": "Assassin's Creed Valhalla",
    "9NC4WDL5KZBL": "Atomfall",
    "9MSVPJCHHRPR": "Avowed",
    "BX3M8L83BBRW": "Cyberpunk 2077",
    "BSR9NLHVF1KL": "DayZ",
    "9NW2S9T1GH7X": "Fear the Spotlight",
    "9PLKVSWR299F": "Forza Motorsport",
    "9P4KMR76PLLQ": "Gears 5",
    "9P1GN7LSJZXQ": "Harry Potter: Quidditch Champions",
    "9MT5NJ5W7B8Z": "Hogwarts Legacy",
    "9NK4NTBFWW81": "Hogwarts Legacy (Xbox One)",
    "C46KTZB9HK8B": "Insurgency: Sandstorm",
    "C07KJZRH0L7S": "Immortals Fenyx Rising",
    "9N4W31HSMVVD": "Kingdom Come: Deliverance II",
    "C1TBTQBVJMFL": "Metro Exodus",
    "9PMQDM08SNK9": "Microsoft Flight Simulator 2020",
    "9NKV34XDW014": "Palworld",
    "9NBV5QFW83WC": "Prince of Persia The Lost Crown",
    "C2CSDTSCBZ0C": "STAR WARS Jedi: Fallen Order",
    "9NJCVGS6T30K": "South of Midnight",
};

const OFFLINE_LOCAL_CO_OP_IDS: string[] = [
    "9NS4Q51TVR51", "9NR7XDNVP5SW", "BX27S00SKW1V", "9NJWFF2KHL6H", "9NFWDRBZXDL9",
    "9N2J0FGV30DX", "9P03ZQMBMV65", "9P9VNSQK1W3K", "9N82SNQTZVMQ", "9PFGQGC0XWLV",
    "C4B8XR1LCXR5", "9PLZPHBNHTMF", "9PLT62LRF9V7", "9P46M5JQ2PTF", "9NN6QW1NPCKN",
    "9P5H37NXML9D", "9NNPSTWT06VM", "9N436FQM30HX", "9NB65S6LFZRT", "9P3NT9H51RMR",
    "9NZWW8K1KX6S", "C2P985H1H42H", "BPQZT43FWD49", "C1SDBNRFXT1D", "BPKDQSSFQ9WV",
    "BSHMMGRP84N4", "BV0NM309K1TL", "9N6639H7VGH4", "BPKVH4C4XV4N", "9P4811KBD5R9",
    "C1ZWH2BZ9TSF", "9N2HB4MWG7HM", "BWT2GPVWCH2F", "BRMKDCZT0C4L", "9N71WRL15FJ0",
    "9P74C0WC1KW8", "9PFFBT24PBM0", "9NM9V6FQXPDX", "9N7271QN4SGB", "BTC0L0BW6LWC",
    "9NT7FNZ0WJM1", "9NKMMS11R27Q", "9N9W42TW36FS", "9PCX1R3DMMWH", "9PFFWMFBFWP3",
    "9PN0LC4CNLPT", "9MZ08RDQ4DM1", "9N3TF03KNTBD", "9N8WRDC25K6J", "9P3PL76N0KWZ",
    "C12T2QLN7H4V", "9PJ1045MHZJ0", "9NG5L58FD3X5", "C3D891Z6TNQM", "C0GWTPD0S8S1",
    "9N0TRF57SMQH", "9NS3673HVH41", "9NZG72SH3H4W", "9NH8K4B707H0", "9PD5BM2Z8C4L",
    "9NQSBF2V7XRR", "9PHPPNKLP777",
];

export class GhPagesUtils {
    private static isBlockedByCsp(): boolean {
        return window.location.hostname === 'play.xbox.com';
    }

    static fetchLatestCommit() {
        if (GhPagesUtils.isBlockedByCsp()) {
            return;
        }
        const url = 'https://api.github.com/repos/redphx/better-xcloud/branches/gh-pages';

        NATIVE_FETCH(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            },
        })
            .then(response => response.json())
            .then(data => {
                const latestCommitHash = data.commit.sha;
                window.localStorage.setItem(StorageKey.GH_PAGES_COMMIT_HASH, latestCommitHash);
            }).catch(error => {
                BxLogger.error('GhPagesUtils', 'Error fetching the latest commit:', error);
            });
    }

    static getUrl(path: string): string {
        if (path[0] === '/') {
            alert('`path` must not starts with "/"');
        }

        const prefix = 'https://raw.githubusercontent.com/redphx/better-xcloud';
        const latestCommitHash = window.localStorage.getItem(StorageKey.GH_PAGES_COMMIT_HASH);
        if (latestCommitHash) {
            return `${prefix}/${latestCommitHash}/${path}`;
        } else {
            return `${prefix}/refs/heads/gh-pages/${path}`;
        }
    }

    static getNativeMkbCustomList(update=false): ForceNativeMkbResponse['data'] {
        const supportedSchema = 1;
        const key = StorageKey.LIST_FORCE_NATIVE_MKB;

        if (GhPagesUtils.isBlockedByCsp()) {
            return OFFLINE_NATIVE_MKB_LIST;
        }

        // Update IDs in the background
        update && NATIVE_FETCH(GhPagesUtils.getUrl('native-mkb/ids.json'))
            .then(response => response.json())
            .then((json: ForceNativeMkbResponse) => {
                if (json.$schemaVersion === supportedSchema) {
                    // Save to storage
                    window.localStorage.setItem(key, JSON.stringify(json));
                    BxEventBus.Script.emit('list.forcedNativeMkb.updated', {
                        data: json,
                    });
                } else {
                    window.localStorage.removeItem(key);
                }
            }).catch(() => {});

        const info = JSON.parse(window.localStorage.getItem(key) || '{}');
        if (info.$schemaVersion !== supportedSchema) {
            // Delete storage;
            window.localStorage.removeItem(key);
            return OFFLINE_NATIVE_MKB_LIST;
        }

        return info.data;
    }

    static getTouchControlCustomList() {
        // TODO: use Set()
        const key = StorageKey.LIST_CUSTOM_TOUCH_LAYOUTS;

        !GhPagesUtils.isBlockedByCsp() && NATIVE_FETCH(GhPagesUtils.getUrl('touch-layouts/ids.json'))
            .then(response => response.json())
            .then(json => {
                if (Array.isArray(json)) {
                    window.localStorage.setItem(key, JSON.stringify(json));
                }
            }).catch(() => {});

        const customList = JSON.parse(window.localStorage.getItem(key) || '[]');
        return customList;
    }

    static getLocalCoOpList(): Set<string> {
        const supportedSchema = 1;
        const key = StorageKey.LIST_LOCAL_CO_OP;

        if (GhPagesUtils.isBlockedByCsp()) {
            return new Set(OFFLINE_LOCAL_CO_OP_IDS);
        }

        NATIVE_FETCH(GhPagesUtils.getUrl('local-co-op/ids.json'))
            .then(response => response.json())
            .then(json => {
                if (json.$schemaVersion === supportedSchema) {
                    window.localStorage.setItem(key, JSON.stringify(json));
                    const ids = new Set(Object.keys(json.data));
                    BxEventBus.Script.emit('list.localCoOp.updated', { ids });
                } else {
                    window.localStorage.removeItem(key);
                    BxEventBus.Script.emit('list.localCoOp.updated', { ids: new Set() });
                }
            }).catch(() => {});

        const info = JSON.parse(window.localStorage.getItem(key) || '{}');
        if (info.$schemaVersion !== supportedSchema) {
            // Delete storage;
            window.localStorage.removeItem(key);
            return new Set(OFFLINE_LOCAL_CO_OP_IDS);
        }

        return new Set(Object.keys(info.data || {}));
    }
}
