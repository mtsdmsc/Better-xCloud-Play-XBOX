import { BxIcon } from "@/utils/bx-icon";
import { createButton, ButtonStyle } from "@/utils/html";
import { BaseGameBarAction } from "./base-action";
import { TrueAchievements } from "@/utils/true-achievements";
import { t } from "@/utils/translation";

export class TrueAchievementsAction extends BaseGameBarAction {
    $content: HTMLElement;

    constructor() {
        super();

        this.$content = createButton({
            style: ButtonStyle.GHOST,
            icon: BxIcon.TRUE_ACHIEVEMENTS,
            title: t('true-achievements'),
            onClick: this.onClick,
        });
    }

    onClick = (e: Event) => {
        super.onClick(e);
        TrueAchievements.getInstance().open(false);
    }
}
