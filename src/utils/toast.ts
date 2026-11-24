import { CE } from "@utils/html";
import { BxLogger } from "./bx-logger";

type ToastOptions = {
    instant?: boolean;
    html?: boolean;
    duration?: number;
    variant?: 'default' | 'alert';
}

export class Toast {
    private static instance: Toast;
    public static getInstance = () => Toast.instance ?? (Toast.instance = new Toast());
    private readonly LOG_TAG = 'Toast';

    private $wrapper: HTMLElement;
    private $msg: HTMLElement;
    private $status: HTMLElement;

    private stack: Array<[string, string, ToastOptions]> = [];
    private isShowing = false;

    private timeoutId?: number | null;
    private DURATION = 3000;

    private constructor() {
        BxLogger.info(this.LOG_TAG, 'constructor()');

        this.$wrapper = CE('div', { class: 'bx-toast bx-offscreen' },
            this.$msg = CE('span', { class: 'bx-toast-msg' }),
            this.$status = CE('span', { class: 'bx-toast-status' }),
        );

        this.$wrapper.addEventListener('transitionend', e => {
            const classList = this.$wrapper.classList;
            if (classList.contains('bx-hide')) {
                classList.remove('bx-offscreen', 'bx-hide');
                classList.add('bx-offscreen');

                this.showNext();
            }
        });

        if (window.location.hostname !== 'play.xbox.com') {
            document.documentElement.appendChild(this.$wrapper);
        }
    }

    private show(msg: string, status?: string, options: Partial<ToastOptions> = {}) {
        const host = document.fullscreenElement || document.documentElement;
        if (this.$wrapper.parentElement !== host) {
            host.appendChild(this.$wrapper);
        }
        options = options || {};

        const args = Array.from(arguments) as [string, string, ToastOptions];
        if (options.instant) {
            // Clear stack
            this.stack = [args];
            this.showNext();
        } else {
            this.stack.push(args);
            !this.isShowing && this.showNext();
        }
    }

    private showNext() {
        if (!this.stack.length) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;

        // Get values from item
        const [msg, status, options] = this.stack.shift()!;

        this.timeoutId && clearTimeout(this.timeoutId);
        const duration = (options && options.duration) || this.DURATION;
        this.timeoutId = window.setTimeout(this.hide, duration);

        if (options && options.html) {
            this.$msg.innerHTML = msg;
        } else {
            this.$msg.textContent = msg;
        }

        if (status) {
            this.$status.classList.remove('bx-gone');
            this.$status.textContent = status;
        } else {
            this.$status.classList.add('bx-gone');
        }

        const classList = this.$wrapper.classList;
        classList.toggle('bx-toast-alert', options?.variant === 'alert');
        classList.remove('bx-offscreen', 'bx-hide');
        classList.add('bx-show');
    }

    private hide = () => {
        this.timeoutId = null;

        const classList = this.$wrapper.classList;
        classList.remove('bx-show');
        classList.add('bx-hide');
    }

    static show(msg: string, status?: string, options: Partial<ToastOptions> = {}) {
        Toast.getInstance().show(msg, status, options);
    }

    static showNext() {
        Toast.getInstance().showNext();
    }
}
