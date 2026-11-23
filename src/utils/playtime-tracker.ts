import { Toast } from "./toast";
import { t } from "./translation";

type PlaytimeData = {
    monthKey: string;
    monthMinutes: number;
    dayKey: string;
    dayMinutes: number;
};

const STORAGE_KEY = 'BetterXcloud.PlaytimeTracker';
const ALERT_INTERVAL_MINUTES = 30;

export class PlaytimeTracker {
    private static instance: PlaytimeTracker;
    public static getInstance = () => PlaytimeTracker.instance ?? (PlaytimeTracker.instance = new PlaytimeTracker());

    private intervalId: number | null = null;
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
        let data: PlaytimeData = { monthKey, monthMinutes: 0, dayKey, dayMinutes: 0 };

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
        this.saveData({
            monthKey: this.getMonthKey(),
            monthMinutes: 0,
            dayKey: this.getTodayKey(),
            dayMinutes: 0,
        });
    }

    static formatMinutes(totalMinutes: number): string {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        if (h === 0) {
            return `${m}min`;
        }
        return `${h}h ${String(m).padStart(2, '0')}m`;
    }

    startSession() {
        this.stopSession();
        this.sessionMinutes = 0;

        this.intervalId = window.setInterval(() => {
            this.sessionMinutes += 1;
            const data = this.getData();
            data.dayMinutes += 1;
            data.monthMinutes += 1;
            this.saveData(data);

            if (this.sessionMinutes > 0 && this.sessionMinutes % ALERT_INTERVAL_MINUTES === 0) {
                const sessionStr = PlaytimeTracker.formatMinutes(this.sessionMinutes);
                const dayStr = PlaytimeTracker.formatMinutes(data.dayMinutes);
                const monthStr = PlaytimeTracker.formatMinutes(data.monthMinutes);

                Toast.show(
                    `⏱️ ${t('playtime-alert-title')}: ${sessionStr}`,
                    `${t('playtime-today')}: ${dayStr} • ${t('playtime-month')}: ${monthStr}`,
                    { instant: true },
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

