import { GamepadKey } from "@/enums/gamepad";
import { ControllerShortcut } from "@/modules/controller-shortcut";
import { VIRTUAL_GAMEPAD_ID } from "@/modules/mkb/mkb-handler";
import { BxEvent } from "./bx-event";
import { STATES } from "./global";
import { StreamSettings } from "./stream-settings";

const XCLOUD_KEY_TO_GAMEPAD_INDEX: Partial<Record<keyof XcloudGamepad, GamepadKey>> = {
    A: GamepadKey.A,
    B: GamepadKey.B,
    X: GamepadKey.X,
    Y: GamepadKey.Y,
    LeftShoulder: GamepadKey.LB,
    RightShoulder: GamepadKey.RB,
    LeftTrigger: GamepadKey.LT,
    RightTrigger: GamepadKey.RT,
    View: GamepadKey.SELECT,
    Menu: GamepadKey.START,
    LeftThumb: GamepadKey.L3,
    RightThumb: GamepadKey.R3,
    DPadUp: GamepadKey.UP,
    DPadDown: GamepadKey.DOWN,
    DPadLeft: GamepadKey.LEFT,
    DPadRight: GamepadKey.RIGHT,
    Nexus: GamepadKey.HOME,
    Share: GamepadKey.SHARE,
};

type HomeShortcutState = {
    pressedAt: number;
    shortcutTriggered: boolean;
    suppressedButtons: Set<number>;
};

export class PlayXboxGamepad {
    private static readonly rawGetGamepads: Navigator['getGamepads'] = window.navigator.getGamepads.bind(window.navigator);
    private static installed = false;
    private static dialogNeutralMode = false;
    private static neutralCache: Map<number, Gamepad> = new Map();
    private static knownGamepadIds: Set<string> = new Set();

    private static homeStates: Map<number, HomeShortcutState> = new Map();
    private static syntheticHomeUntil: Map<number, number> = new Map();
    private static sharePrevPressed: Map<number, boolean> = new Map();
    private static guideOpenChecker: (() => boolean) | null = null;

    static getRawGamepads(): (Gamepad | null)[] {
        try {
            return Array.from(PlayXboxGamepad.rawGetGamepads() || []);
        } catch (e) {
            return [];
        }
    }

    static setGuideOpenChecker(fn: () => boolean) {
        PlayXboxGamepad.guideOpenChecker = fn;
    }

    static setDialogNeutralMode(enabled: boolean) {
        PlayXboxGamepad.dialogNeutralMode = enabled;
        if (!enabled) {
            PlayXboxGamepad.neutralCache.clear();
        }
    }

    static install() {
        if (PlayXboxGamepad.installed || window.location.hostname !== 'play.xbox.com') {
            return;
        }
        PlayXboxGamepad.installed = true;

        const patched = () => PlayXboxGamepad.getProcessedGamepads();
        try {
            window.navigator.getGamepads = patched as any;
        } catch (e) {
            try {
                Object.defineProperty(window.navigator, 'getGamepads', {
                    value: patched,
                    configurable: true,
                    writable: true,
                });
            } catch (e2) {}
        }
    }

    private static buildNeutralGamepad(gp: Gamepad): Gamepad {
        let neutral = PlayXboxGamepad.neutralCache.get(gp.index);
        if (!neutral || neutral.id !== gp.id || neutral.buttons.length !== gp.buttons.length || neutral.axes.length !== gp.axes.length) {
            neutral = {
                axes: Object.freeze(new Array(gp.axes.length).fill(0)),
                buttons: Object.freeze(new Array(gp.buttons.length).fill(null).map(() => Object.freeze({
                    pressed: false,
                    touched: false,
                    value: 0,
                }))),
                connected: true,
                id: gp.id,
                index: gp.index,
                mapping: gp.mapping,
                timestamp: gp.timestamp,
                vibrationActuator: (gp as any).vibrationActuator ?? null,
                hapticActuators: (gp as any).hapticActuators ?? [],
            } as unknown as Gamepad;
            PlayXboxGamepad.neutralCache.set(gp.index, neutral);
        }
        return neutral;
    }

    private static cloneGamepad(gp: Gamepad, timestampOverride?: number) {
        const axes = Array.from(gp.axes);
        const buttons = gp.buttons.map(b => ({
            pressed: b.pressed,
            touched: b.touched,
            value: b.value,
        }));

        return {
            axes,
            buttons,
            connected: gp.connected,
            id: gp.id,
            index: gp.index,
            mapping: gp.mapping,
            timestamp: timestampOverride ?? gp.timestamp,
            vibrationActuator: (gp as any).vibrationActuator ?? null,
            hapticActuators: (gp as any).hapticActuators ?? [],
        };
    }

    private static applyStickRange(axes: number[], xIdx: number, yIdx: number, range: [number, number]) {
        const [from, to] = range;
        const x = axes[xIdx] ?? 0;
        const y = axes[yIdx] ?? 0;
        const mag = Math.sqrt(x * x + y * y);
        if (mag === 0) {
            return;
        }
        let newMag = mag > to ? 1 : mag;
        newMag = newMag < from ? 0 : newMag;
        if (newMag !== mag) {
            axes[xIdx] = x * (newMag / mag);
            axes[yIdx] = y * (newMag / mag);
        }
    }

    private static getProcessedGamepads(): (Gamepad | null)[] {
        const rawPads = PlayXboxGamepad.getRawGamepads();
        const result: (Gamepad | null)[] = [];
        const now = performance.now();

        for (let i = 0; i < rawPads.length; i++) {
            const gp = rawPads[i];
            if (!gp || !gp.connected) {
                result.push(null);
                continue;
            }

            if (gp.id === VIRTUAL_GAMEPAD_ID) {
                result.push(gp);
                continue;
            }

            // While Better xCloud dialog is open, report a connected neutral gamepad
            // so xCloud never disconnects the slot and never moves the game behind the menu.
            if (PlayXboxGamepad.dialogNeutralMode) {
                result.push(PlayXboxGamepad.buildNeutralGamepad(gp));
                continue;
            }

            // Only intercept shortcuts/customization while actively playing a game
            if (!STATES.isPlaying) {
                PlayXboxGamepad.homeStates.delete(gp.index);
                PlayXboxGamepad.syntheticHomeUntil.delete(gp.index);
                result.push(gp);
                continue;
            }

            // Ensure controller settings are loaded for this gamepad ID
            if (!PlayXboxGamepad.knownGamepadIds.has(gp.id)) {
                PlayXboxGamepad.knownGamepadIds.add(gp.id);
                StreamSettings.refreshControllerSettings();
            }

            const controllerSettings = window.BX_STREAM_SETTINGS?.controllers?.[gp.id];
            const shortcuts = controllerSettings?.shortcuts;
            const hasShortcuts = !!shortcuts && Object.keys(shortcuts).length > 0;
            const customization = controllerSettings?.customization;
            const hasCustomization = !!customization && (
                Object.keys(customization.mapping || {}).length > 0 ||
                Object.keys(customization.ranges || {}).length > 0
            );

            // Handle Share button (button 17) screenshot capture on rising edge
            const sharePressed = !!gp.buttons[GamepadKey.SHARE]?.pressed;
            const wasSharePressed = !!PlayXboxGamepad.sharePrevPressed.get(gp.index);
            PlayXboxGamepad.sharePrevPressed.set(gp.index, sharePressed);
            let shareRemapped = false;
            if (customization?.mapping && 'Share' in customization.mapping) {
                shareRemapped = true;
            }
            if (sharePressed && !wasSharePressed && !shareRemapped) {
                window.dispatchEvent(new Event(BxEvent.CAPTURE_SCREENSHOT));
            }

            // Fast path: nothing to transform
            const synthUntil = PlayXboxGamepad.syntheticHomeUntil.get(gp.index) || 0;
            if (!hasShortcuts && !hasCustomization && now >= synthUntil && !PlayXboxGamepad.homeStates.has(gp.index)) {
                result.push(gp);
                continue;
            }

            let cloned = PlayXboxGamepad.cloneGamepad(gp);
            let modified = false;

            // 1. Controller Shortcuts (Hold Xbox button + combo button)
            const isGuideOpen = PlayXboxGamepad.guideOpenChecker ? PlayXboxGamepad.guideOpenChecker() : false;
            const homeBtn = gp.buttons[GamepadKey.HOME];

            if (hasShortcuts && homeBtn && !isGuideOpen) {
                let state = PlayXboxGamepad.homeStates.get(gp.index);

                if (homeBtn.pressed) {
                    if (!state) {
                        ControllerShortcut.reset(gp.index);
                        state = {
                            pressedAt: now,
                            shortcutTriggered: false,
                            suppressedButtons: new Set(),
                        };
                        PlayXboxGamepad.homeStates.set(gp.index, state);
                    }

                    // Suppress HOME button while held so Guide doesn't immediately open
                    cloned.buttons[GamepadKey.HOME] = { pressed: false, touched: false, value: 0 };
                    modified = true;

                    const handled = ControllerShortcut.handle(gp);
                    if (handled) {
                        state.shortcutTriggered = true;
                    }

                    // Suppress any combo buttons pressed while HOME is held so they don't trigger in-game actions
                    for (let b = 0; b < gp.buttons.length; b++) {
                        if (b !== GamepadKey.HOME && gp.buttons[b]?.pressed) {
                            state.suppressedButtons.add(b);
                            cloned.buttons[b] = { pressed: false, touched: false, value: 0 };
                        }
                    }
                } else if (state) {
                    PlayXboxGamepad.homeStates.delete(gp.index);
                    ControllerShortcut.reset(gp.index);

                    if (!state.shortcutTriggered) {
                        // Normal quick tap of Xbox button -> pulse HOME to open Xbox Guide
                        PlayXboxGamepad.syntheticHomeUntil.set(gp.index, now + 110);
                    }
                }
            }

            // Emit synthetic HOME pulse if a normal tap just finished
            const activeSynthUntil = PlayXboxGamepad.syntheticHomeUntil.get(gp.index) || 0;
            if (activeSynthUntil > now && cloned.buttons[GamepadKey.HOME]) {
                cloned.buttons[GamepadKey.HOME] = { pressed: true, touched: true, value: 1 };
                cloned.timestamp = now;
                modified = true;
            } else if (activeSynthUntil > 0 && activeSynthUntil <= now) {
                PlayXboxGamepad.syntheticHomeUntil.delete(gp.index);
                if (cloned.buttons[GamepadKey.HOME]) {
                    cloned.buttons[GamepadKey.HOME] = { pressed: false, touched: false, value: 0 };
                    cloned.timestamp = now;
                    modified = true;
                }
            }

            // 2. Controller Customization (trigger ranges, stick deadzones, button remapping)
            if (hasCustomization && customization) {
                const { mapping, ranges } = customization;

                // Trigger ranges
                if (ranges.LeftTrigger && cloned.buttons[GamepadKey.LT]) {
                    const [from, to] = ranges.LeftTrigger;
                    let v = cloned.buttons[GamepadKey.LT].value;
                    v = v > to ? 1 : (v < from ? 0 : v);
                    if (v !== cloned.buttons[GamepadKey.LT].value) {
                        cloned.buttons[GamepadKey.LT] = { pressed: v > 0.05, touched: v > 0, value: v };
                        modified = true;
                    }
                }
                if (ranges.RightTrigger && cloned.buttons[GamepadKey.RT]) {
                    const [from, to] = ranges.RightTrigger;
                    let v = cloned.buttons[GamepadKey.RT].value;
                    v = v > to ? 1 : (v < from ? 0 : v);
                    if (v !== cloned.buttons[GamepadKey.RT].value) {
                        cloned.buttons[GamepadKey.RT] = { pressed: v > 0.05, touched: v > 0, value: v };
                        modified = true;
                    }
                }

                // Stick deadzones
                if (ranges.LeftThumb && cloned.axes.length >= 2) {
                    PlayXboxGamepad.applyStickRange(cloned.axes, 0, 1, ranges.LeftThumb);
                    modified = true;
                }
                if (ranges.RightThumb && cloned.axes.length >= 4) {
                    PlayXboxGamepad.applyStickRange(cloned.axes, 2, 3, ranges.RightThumb);
                    modified = true;
                }

                // Button & stick remapping
                if (mapping && Object.keys(mapping).length > 0) {
                    const origButtons = cloned.buttons.map(b => ({ ...b }));
                    const origAxes = cloned.axes.slice();

                    for (const srcKey in mapping) {
                        const targetKey = mapping[srcKey as keyof XcloudGamepad];

                        if (srcKey === 'LeftStickAxes' || srcKey === 'RightStickAxes') {
                            const srcX = srcKey === 'LeftStickAxes' ? 0 : 2;
                            const srcY = srcKey === 'LeftStickAxes' ? 1 : 3;
                            const dstX = srcKey === 'LeftStickAxes' ? 2 : 0;
                            const dstY = srcKey === 'LeftStickAxes' ? 3 : 1;

                            cloned.axes[srcX] = 0;
                            cloned.axes[srcY] = 0;
                            if (typeof targetKey === 'string') {
                                const mag = Math.sqrt(origAxes[srcX] ** 2 + origAxes[srcY] ** 2);
                                if (mag >= 0.1) {
                                    cloned.axes[dstX] = origAxes[srcX];
                                    cloned.axes[dstY] = origAxes[srcY];
                                }
                            }
                            modified = true;
                            continue;
                        }

                        const srcIdx = XCLOUD_KEY_TO_GAMEPAD_INDEX[srcKey as keyof XcloudGamepad];
                        if (typeof srcIdx === 'undefined' || !origButtons[srcIdx]) {
                            continue;
                        }

                        if (targetKey === false) {
                            cloned.buttons[srcIdx] = { pressed: false, touched: false, value: 0 };
                            modified = true;
                        } else if (typeof targetKey === 'string') {
                            const dstIdx = XCLOUD_KEY_TO_GAMEPAD_INDEX[targetKey];
                            if (typeof dstIdx !== 'undefined' && cloned.buttons[dstIdx]) {
                                const srcBtn = origButtons[srcIdx];
                                if (srcBtn.pressed || srcBtn.value >= 0.1) {
                                    cloned.buttons[dstIdx] = { ...srcBtn };
                                    cloned.buttons[srcIdx] = { pressed: false, touched: false, value: 0 };
                                    modified = true;
                                }
                            }
                        }
                    }
                }
            }

            result.push(modified ? (cloned as unknown as Gamepad) : gp);
        }

        return result;
    }
}

