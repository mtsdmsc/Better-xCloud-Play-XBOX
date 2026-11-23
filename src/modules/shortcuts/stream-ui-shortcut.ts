import { NavigationDialogManager } from "@/modules/ui/dialog/navigation-dialog";
import { SettingsDialog } from "@/modules/ui/dialog/settings-dialog";

export class StreamUiShortcut {
    static showHideStreamMenu() {
        // Show menu
        if (window.BX_EXPOSED.showStreamMenu) {
            window.BX_EXPOSED.showStreamMenu();
            return;
        }

        // On play.xbox.com, toggle Better xCloud's stream settings dialog
        const dialogManager = NavigationDialogManager.getInstance();
        if (dialogManager.isShowing()) {
            dialogManager.hide();
        } else {
            SettingsDialog.getInstance().show();
        }
    }
}
