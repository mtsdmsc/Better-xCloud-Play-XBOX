import { Toast } from "./toast";
import { t } from "./translation";

type PlaytimeData = {
    monthKey: string;
    monthMinutes: number;
    dayKey: string;
    dayMinutes: number;
    remainingMinutes: number | null;
};

const STORAGE_KEY = 'BetterXcloud.PlaytimeTracker';
const ALERT_INTERVAL_MINUTES = 30;

export class PlaytimeTracker {
    private static instance: PlaytimeTracker;
    public static getInstance = () => PlaytimeTracker.instance ?? (PlaytimeTracker.instance = new PlaytimeTracker());

    private intervalId: number | null = null;
    private observer: MutationObserver | null = null;
    private sessionMinutes = 0;

    private getTodayKey(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    private getMonthKey(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    getData(): PlaytimeData {
        const dayKey = this.getTodayKey();
        const monthKey = this.getMonthKey();
        let data: PlaytimeData = { monthKey, monthMinutes: 0, dayKey, dayMinutes: 0, remainingMinutes: null };

        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<PlaytimeData>;
                if (parsed.monthKey === monthKey && typeof parsed.monthMinutes === 'number') {
                    data.monthMinutes = parsed.monthMinutes;
                }
                if (parsed.dayKey === dayKey && typeof parsed.dayMinutes === 'number') {
                    data.dayMinutes = parsed.dayMinutes;
                }
                if (typeof parsed.remainingMinutes === 'number' && parsed.remainingMinutes >= 0) {
                    data.remainingMinutes = parsed.remainingMinutes;
                }
            }
        } catch (e) {}

        return data;
    }

    private saveData(data: PlaytimeData) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    resetCycle() {
        const current = this.getData();
        this.saveData({
            monthKey: this.getMonthKey(),
            monthMinutes: 0,
            dayKey: this.getTodayKey(),
            dayMinutes: 0,
            remainingMinutes: current.remainingMinutes,
        });
    }

    static formatMinutes(totalMinutes: number): string {
        const safe = Math.max(0, Math.floor(totalMinutes));
        const h = Math.floor(safe / 60);
        const m = safe % 60;
        if (h === 0) {
            return `${m}min`;
        }
        return `${h}h ${String(m).padStart(2, '0')}m`;
    }

    /**
     * Parses official Xbox Cloud Gaming remaining quota text from the DOM:
     * e.g. "12h 45m restantes", "13 horas 49 minutos de jogo restante", "12h 45m remaining", "45m restantes"
     */
    private parseRemainingMinutes(text: string): number | null {
        const normalized = text.trim().toLowerCase();
        if (!normalized || normalized.length > 80) {
            return null;
        }
        if (!normalized.includes('restante') && !normalized.includes('remaining') && !normalized.includes('left')) {
            return null;
        }

        // Matches "12h 45m" or "13 horas 49 minutos" or "13 hours 49 minutes"
        const hm = normalized.match(/(\d+)\s*(?:h|hora|horas|hr|hrs|hour|hours)\s*(?:e\s*)?(\d+)\s*(?:m|min|mins|minuto|minutos|minute|minutes)/);
        if (hm) {
            return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
        }

        const onlyH = normalized.match(/(\d+)\s*(?:h|hora|horas|hr|hrs|hour|hours)\b/);
        if (onlyH) {
            return parseInt(onlyH[1], 10) * 60;
        }

        const onlyM = normalized.match(/(\d+)\s*(?:m|min|mins|minuto|minutos|minute|minutes)\b/);
        if (onlyM) {
            return parseInt(onlyM[1], 10);
        }

        return null;
    }

    syncRemainingFromDom = () => {
        const candidates = document.querySelectorAll<HTMLElement>('span, p, div');
        for (const $el of candidates) {
            if ($el.children.length > 0 || $el.closest('.bx-navigation-dialog, .bx-toast')) {
                continue;
            }
            const parsed = this.parseRemainingMinutes($el.textContent || '');
            if (parsed !== null) {
                const data = this.getData();
                if (data.remainingMinutes !== parsed) {
                    data.remainingMinutes = parsed;
                    this.saveData(data);
                }
                break;
            }
        }
    }

    watchQuota() {
        if (this.observer) {
            return;
        }
        let timer: number | null = null;
        this.observer = new MutationObserver(() => {
            if (timer) {
                return;
            }
            timer = window.setTimeout(() => {
                timer = null;
                this.syncRemainingFromDom();
            }, 600);
        });
        this.observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    startSession() {
        this.stopSession();
        this.sessionMinutes = 0;
        this.syncRemainingFromDom();

        this.intervalId = window.setInterval(() => {
            this.sessionMinutes += 1;
            const data = this.getData();
            data.dayMinutes += 1;
            data.monthMinutes += 1;
            if (data.remainingMinutes !== null && data.remainingMinutes > 0) {
                data.remainingMinutes -= 1;
            }
            this.saveData(data);

            if (this.sessionMinutes > 0 && this.sessionMinutes % ALERT_INTERVAL_MINUTES === 0) {
                const sessionStr = PlaytimeTracker.formatMinutes(this.sessionMinutes);
                const dayStr = PlaytimeTracker.formatMinutes(data.dayMinutes);
                const statusParts = [];
                if (data.remainingMinutes !== null) {
                    statusParts.push(`${t('playtime-remaining')}: ~${PlaytimeTracker.formatMinutes(data.remainingMinutes)}`);
                }
                statusParts.push(`${t('playtime-today')}: ${dayStr}`);

                Toast.show(
                    `⏱️ ${t('playtime-alert-title')}: ${sessionStr}`,
                    statusParts.join(' • '),
                    { instant: true, duration: 10000, variant: 'alert' },
                );
            }
        }, 60 * 1000);
    }

    stopSession() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
