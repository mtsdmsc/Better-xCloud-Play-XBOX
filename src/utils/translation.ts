import { StorageKey } from "@/enums/pref-keys";
import { NATIVE_FETCH } from "./bx-flags";
import { BxLogger } from "./bx-logger";
import { GhPagesUtils } from "./gh-pages";

export const SUPPORTED_LANGUAGES = {
    'pt-BR': 'Português (Brasil)',
    'en-US': 'English (US)',

    'ca-CA': 'Català',
    'cs-CZ': 'čeština',
    'da-DK': 'dansk',
    'de-DE': 'Deutsch',
    'en-ID': 'Bahasa Indonesia',
    'es-ES': 'español (España)',
    'fr-FR': 'français',
    'it-IT': 'italiano',
    'ja-JP': '日本語',
    'ko-KR': '한국어',
    'pl-PL': 'polski',
    'ru-RU': 'русский',
    'th-TH': 'ภาษาไทย',
    'tr-TR': 'Türkçe',
    'uk-UA': 'українська',
    'vi-VN': 'Tiếng Việt',
    'zh-CN': '中文(简体)',
    'zh-TW': '中文(繁體)',
};

const Texts = {
    "achievements": "Achievements",
    "activate": "Activate",
    "activated": "Activated",
    "active": "Active",
    "advanced": "Advanced",
    "all-games": "All games",
    "always-off": "Always off",
    "always-on": "Always on",
    "amd-fidelity-cas": "AMD FidelityFX CAS",
    "app-settings": "App settings",
    "apply": "Apply",
    "aspect-ratio": "Aspect ratio",
    "aspect-ratio-note": "Don't use with native touch games",
    "audio": "Audio",
    "auto": "Auto",
    "availability": "Availability",
    "back-to-home": "Back to home",
    "back-to-home-confirm": "Do you want to go back to the home page (without disconnecting)?",
    "background-opacity": "Background opacity",
    "battery": "Battery",
    "battery-saving": "Battery saving",
    "better-xcloud": "PlayXbox Enhanced",
    "bitrate-audio-maximum": "Maximum audio bitrate",
    "bitrate-video-maximum": "Maximum video bitrate",
    "bottom": "Bottom",
    "bottom-half": "Bottom half",
    "bottom-left": "Bottom-left",
    "bottom-right": "Bottom-right",
    "brazil": "Brazil",
    "brightness": "Brightness",
    "browser-unsupported-feature": "Your browser doesn't support this feature",
    "button-xbox": "Xbox button",
    "bypass-region-restriction": "Bypass region restriction",
    "cancel": "Cancel",
    "center": "Center",
    "chat": "Chat",
    "clarity-boost": "Clarity boost",
    "clarity-boost-mode": "Clarity boost mode",
    "clarity-boost-warning": "These settings don't work when the Clarity Boost mode is ON",
    "clear": "Clear",
    "clear-data": "Clear data",
    "clear-data-confirm": "Do you want to clear all PlayXbox Enhanced settings and data?",
    "clear-data-success": "Data cleared! Refresh the page to apply the changes.",
    "clock": "Clock",
    "close": "Close",
    "close-app": "Close app",
    "combine-audio-video-streams": "Combine audio & video streams",
    "combine-audio-video-streams-summary": "May fix the laggy audio problem",
    "conditional-formatting": "Conditional formatting text color",
    "confirm-delete-preset": "Do you want to delete this preset?",
    "confirm-reload-stream": "Do you want to refresh the stream?",
    "connected": "Connected",
    "console-connect": "Connect",
    "continent-asia": "Asia",
    "continent-australia": "Australia",
    "continent-europe": "Europe",
    "continent-north-america": "North America",
    "continent-south-america": "South America",
    "contrast": "Contrast",
    "controller": "Controller",
    "controller-customization": "Controller customization",
    "controller-customization-input-latency-note": "May slightly increase input latency",
    "controller-friendly-ui": "Controller-friendly UI",
    "controller-shortcuts": "Controller shortcuts",
    "controller-shortcuts-connect-note": "Connect a controller to use this feature",
    "controller-shortcuts-xbox-note": "Button to open the Guide menu",
    "controller-vibration": "Controller vibration",
    "copy": "Copy",
    "create-shortcut": "Shortcut",
    "custom": "Custom",
    "deadzone-counterweight": "Deadzone counterweight",
    "decrease": "Decrease",
    "default": "Default",
    "default-opacity": "Default opacity",
    "default-preset-note": "You can't modify default presets. Create a new one to customize it.",
    "delete": "Delete",
    "detect-controller-button": "Detect controller button",
    "device": "Device",
    "device-unsupported-touch": "Your device doesn't have touch support",
    "device-vibration": "Device vibration",
    "device-vibration-not-using-gamepad": "On when not using gamepad",
    "disable": "Disable",
    "disable-features": "Disable features",
    "disable-home-context-menu": "Disable context menu in Home page",
    "disable-post-stream-feedback-dialog": "Disable post-stream feedback dialog",
    "disable-social-features": "Disable social features",
    "disable-xcloud-analytics": "Disable xCloud analytics",
    "disabled": "Disabled",
    "disconnected": "Disconnected",
    "download": "Download",
    "downloaded": "Downloaded",
    "edit": "Edit",
    "enable-controller-shortcuts": "Enable controller shortcuts",
    "enable-local-co-op-support": "Enable local co-op support",
    "enable-local-co-op-support-note": "Only works with some games",
    "enable-mic-on-startup": "Enable microphone on game launch",
    "enable-mkb": "Emulate controller with Mouse & Keyboard",
    "enable-quick-glance-mode": "Enable \"Quick Glance\" mode",
    "enable-remote-play-feature": "Enable the \"Remote Play\" feature",
    "enable-volume-control": "Enable volume control feature",
    "enabled": "Enabled",
    "experimental": "Experimental",
    "export": "Export",
    "fast": "Fast",
    "force-native-mkb-games": "Force native Mouse & Keyboard for these games",
    "fortnite-allow-stw-mode": "Allows playing \"Save the World\" mode on mobile",
    "fortnite-force-console-version": "Fortnite: force console version",
    "friends-followers": "Friends and followers",
    "game-bar": "Game Bar",
    "getting-consoles-list": "Getting the list of consoles...",
    "guide": "Guide",
    "help": "Help",
    "hide": "Hide",
    "hide-idle-cursor": "Hide mouse cursor on idle",
    "hide-scrollbar": "Hide web page's scrollbar",
    "hide-sections": "Hide sections",
    "hide-system-menu-icon": "Hide System menu's icon",
    "hide-touch-controller": "Hide touch controller",
    "high-performance": "High performance",
    "highest-quality": "Highest quality",
    "highest-quality-note": "Your device may not be powerful enough to use these settings",
    "horizontal-scroll-sensitivity": "Horizontal scroll sensitivity",
    "horizontal-sensitivity": "Horizontal sensitivity",
    "how-to-fix": "How to fix",
    "how-to-improve-app-performance": "How to improve app's performance",
    "ignore": "Ignore",
    "image-quality": "Website's image quality",
    "import": "Import",
    "in-game-controller-customization": "In-game controller customization",
    "in-game-controller-shortcuts": "In-game controller shortcuts",
    "in-game-keyboard-shortcuts": "In-game keyboard shortcuts",
    "in-game-shortcuts": "In-game shortcuts",
    "increase": "Increase",
    "install-android": "Better xCloud app for Android",
    "invites": "Invites",
    "japan": "Japan",
    "jitter": "Jitter",
    "keyboard-key": "Keyboard key",
    "keyboard-shortcuts": "Keyboard shortcuts",
    "korea": "Korea",
    "language": "Language",
    "large": "Large",
    "layout": "Layout",
    "left-stick": "Left stick",
    "left-stick-deadzone": "Left stick deadzone",
    "left-trigger-range": "Left trigger range",
    "limit-fps": "Limit FPS",
    "load-failed-message": "Failed to run PlayXbox Enhanced",
    "loading-screen": "Loading screen",
    "local-co-op": "Local co-op",
    "lowest-quality": "Lowest quality",
    "manage": "Manage",
    "map-mouse-to": "Map mouse to",
    "may-not-work-properly": "May not work properly!",
    "menu": "Menu",
    "microphone": "Microphone",
    "mkb-adjust-ingame-settings": "You may also need to adjust the in-game sensitivity & deadzone settings",
    "mkb-click-to-activate": "Click to activate",
    "mkb-disclaimer": "This could be viewed as cheating when playing online",
    "modifiers-note": "To use more than one key, include Ctrl, Alt or Shift in your shortcut. Command key is not allowed.",
    "mouse-and-keyboard": "Mouse & Keyboard",
    "mouse-click": "Mouse click",
    "mouse-wheel": "Mouse wheel",
    "muted": "Muted",
    "name": "Name",
    "native-mkb": "Native Mouse & Keyboard",
    "new": "New",
    "new-version-available": [
        (e: any) => `Versão ${e.version} disponível`,
        (e: any) => `Version ${e.version} available`,
        (e: any) => `Versió ${e.version} disponible`,
        (e: any) => `Verze ${e.version} dostupná`,
        ,
        (e: any) => `Version ${e.version} verfügbar`,
        (e: any) => `Versi ${e.version} tersedia`,
        (e: any) => `Versión ${e.version} disponible`,
        (e: any) => `Version ${e.version} disponible`,
        (e: any) => `Disponibile la versione ${e.version}`,
        (e: any) => `Ver ${e.version} が利用可能です`,
        (e: any) => `${e.version} 버전 사용가능`,
        (e: any) => `Dostępna jest nowa wersja ${e.version}`,
        (e: any) => `Версия ${e.version} доступна`,
        (e: any) => `เวอร์ชัน ${e.version} พร้อมใช้งานแล้ว`,
        (e: any) => `${e.version} sayılı yeni sürüm mevcut`,
        (e: any) => `Доступна версія ${e.version}`,
        (e: any) => `Đã có phiên bản ${e.version}`,
        (e: any) => `版本 ${e.version} 可供更新`,
        (e: any) => `已可更新為 ${e.version} 版`,
    ],
    "no-consoles-found": "No consoles found",
    "no-controllers-connected": "No controllers connected",
    "normal": "Normal",
    "notifications": "Notifications",
    "off": "Off",
    "official": "Official",
    "oled": "OLED",
    "on": "On",
    "only-supports-some-games": "Only supports some games",
    "opacity": "Opacity",
    "other": "Other",
    "performance": "Performance",
    "playing": "Playing",
    "playtime": "Playtime",
    "poland": "Poland",
    "polling-rate": "Polling rate",
    "position": "Position",
    "powered-off": "Powered off",
    "powered-on": "Powered on",
    "prefer-ipv6-server": "Prefer IPv6 server",
    "preferred-game-language": "Preferred game's language",
    "preset": "Preset",
    "press": "Press",
    "press-any-button": "Press any button...",
    "press-esc-to-cancel": "Press Esc to cancel",
    "press-key-to-toggle-mkb": [
        (e: any) => `Pressione ${e.key} para alternar este recurso`,
        (e: any) => `Press ${e.key} to toggle this feature`,
        (e: any) => `Premeu ${e.key} per alternar aquesta funció`,
        (e: any) => `Zmáčknete ${e.key} pro přepnutí této funkce`,
        (e: any) => `Tryk på ${e.key} for at slå denne funktion til`,
        (e: any) => `${e.key}: Funktion an-/ausschalten`,
        (e: any) => `Tekan ${e.key} untuk mengaktifkan fitur ini`,
        (e: any) => `Pulsa ${e.key} para alternar esta función`,
        (e: any) => `Appuyez sur ${e.key} pour activer cette fonctionnalité`,
        (e: any) => `Premi ${e.key} per attivare questa funzionalità`,
        (e: any) => `${e.key} でこの機能を切替`,
        (e: any) => `${e.key} 키를 눌러 이 기능을 켜고 끄세요`,
        (e: any) => `Naciśnij ${e.key} aby przełączyć tę funkcję`,
        (e: any) => `Нажмите ${e.key} для переключения этой функции`,
        (e: any) => `กด ${e.key} เพื่อสลับคุณสมบัตินี้`,
        (e: any) => `Etkinleştirmek için ${e.key} tuşuna basın`,
        (e: any) => `Натисніть ${e.key} щоб перемкнути цю функцію`,
        (e: any) => `Nhấn ${e.key} để bật/tắt tính năng này`,
        (e: any) => `按下 ${e.key} 来切换此功能`,
        (e: any) => `按下 ${e.key} 來啟用此功能`,
    ],
    "press-to-bind": "Press a key or do a mouse click to bind...",
    "prevent-resolution-drops": "Prevent resolution drops",
    "prompt-preset-name": "Preset's name:",
    "quality": "Quality",
    "recommended": "Recommended",
    "recommended-settings-for-device": [
        (e: any) => `Configurações recomendadas para ${e.device}`,
        (e: any) => `Recommended settings for ${e.device}`,
        (e: any) => `Configuració recomanada per a ${e.device}`,
        ,
        ,
        (e: any) => `Empfohlene Einstellungen für ${e.device}`,
        (e: any) => `Rekomendasi pengaturan untuk ${e.device}`,
        (e: any) => `Ajustes recomendados para ${e.device}`,
        (e: any) => `Paramètres recommandés pour ${e.device}`,
        (e: any) => `Configurazioni consigliate per ${e.device}`,
        (e: any) => `${e.device} の推奨設定`,
        (e: any) => `다음 기기에서 권장되는 설정: ${e.device}`,
        (e: any) => `Zalecane ustawienia dla ${e.device}`,
        (e: any) => `Рекомендуемые настройки для ${e.device}`,
        (e: any) => `การตั้งค่าที่แนะนำสำหรับ ${e.device}`,
        (e: any) => `${e.device} için önerilen ayarlar`,
        (e: any) => `Рекомендовані налаштування для ${e.device}`,
        (e: any) => `Cấu hình được đề xuất cho ${e.device}`,
        (e: any) => `${e.device} 的推荐设置`,
        (e: any) => `${e.device} 推薦的設定`,
    ],
    "reduce-animations": "Reduce UI animations",
    "region": "Region",
    "reload-page": "Reload page",
    "remote-play": "Remote Play",
    "rename": "Rename",
    "renderer": "Renderer",
    "renderer-configuration": "Renderer configuration",
    "reset-highlighted-setting": "Reset highlighted setting",
    "resolution": "Resolution",
    "right-click-to-unbind": "Right-click on a key to unbind it",
    "right-stick": "Right stick",
    "right-stick-deadzone": "Right stick deadzone",
    "right-trigger-range": "Right trigger range",
    "rocket-always-hide": "Always hide",
    "rocket-always-show": "Always show",
    "rocket-animation": "Rocket animation",
    "rocket-hide-queue": "Hide when queuing",
    "saturation": "Saturation",
    "save": "Save",
    "screen": "Screen",
    "screenshot-apply-filters": "Apply video filters to screenshots",
    "section-all-games": "See all games",
    "section-game-pass": "Play with Game Pass",
    "section-genres": "Genres",
    "section-jump-back-in": "Jump back in",
    "section-leaving-soon": "Leaving soon",
    "section-most-popular": "Most popular",
    "section-native-mkb": "Play with mouse & keyboard",
    "section-news": "News",
    "section-play-with-friends": "Play with friends",
    "section-recently-added": "Recently added",
    "section-touch": "Play with touch",
    "section-ubisoft-classics": "Ubisoft+ Classics",
    "separate-touch-controller": "Separate Touch controller & Controller #1",
    "separate-touch-controller-note": "Touch controller is Player 1, Controller #1 is Player 2",
    "server": "Server",
    "server-list-error": "Can't get the server list",
    "server-locations": "Server locations",
    "settings": "Settings",
    "settings-for": "Settings for",
    "settings-reload": "Reload page to reflect changes",
    "settings-reload-note": "Settings in this tab only go into effect on the next page load",
    "settings-reloading": "Reloading...",
    "sharpness": "Sharpness",
    "shortcut-keys": "Shortcut keys",
    "show": "Show",
    "show-controller-connection-status": "Show controller connection status",
    "show-game-art": "Show game art",
    "show-hide": "Show/hide",
    "show-stats-on-startup": "Show stats when starting the game",
    "show-touch-controller": "Show touch controller",
    "show-wait-time": "Show the estimated wait time",
    "show-wait-time-in-game-card": "Show wait time in game card",
    "simplify-stream-menu": "Simplify Stream's menu",
    "skip-splash-video": "Skip Xbox splash video",
    "slow": "Slow",
    "small": "Small",
    "smart-tv": "Smart TV",
    "sound": "Sound",
    "standard": "Standard",
    "standby": "Standby",
    "stat-bitrate": "Bitrate",
    "stat-decode-time": "Decode time",
    "stat-fps": "FPS",
    "stat-frames-lost": "Frames lost",
    "stat-packets-lost": "Packets lost",
    "stat-ping": "Ping",
    "stats": "Stats",
    "stick-decay-minimum": "Stick decay minimum",
    "stick-decay-strength": "Stick decay strength",
    "stream": "Stream",
    "stream-settings": "Stream settings",
    "stream-stats": "Stream stats",
    "stream-your-own-game": "Stream your own game",
    "stretch": "Stretch",
    "suggest-settings": "Suggest settings",
    "suggest-settings-link": "Suggest recommended settings for this device",
    "support-better-xcloud": "Support Better xCloud",
    "swap-buttons": "Swap buttons",
    "take-screenshot": "Take screenshot",
    "target-resolution": "Target resolution",
    "tc-all-white": "All white",
    "tc-auto-off": "Off when controller found",
    "tc-custom-layout-style": "Custom layout's button style",
    "tc-muted-colors": "Muted colors",
    "tc-standard-layout-style": "Standard layout's button style",
    "test-controller": "Test controller",
    "text-size": "Text size",
    "theme": "Theme",
    "toggle": "Toggle",
    "top": "Top",
    "top-center": "Top-center",
    "top-half": "Top half",
    "top-left": "Top-left",
    "top-right": "Top-right",
    "touch-control-layout": "Touch control layout",
    "touch-control-layout-by": [
        (e: any) => `Layout de controle por toque feito por ${e.name}`,
        (e: any) => `Touch control layout by ${e.name}`,
        (e: any) => `Format del control tàctil per ${e.name}`,
        (e: any) => `Rozložení dotykového ovládání ${e.name}`,
        (e: any) => `Touch-kontrol layout af ${e.name}`,
        (e: any) => `Touch-Steuerungslayout von ${e.name}`,
        (e: any) => `Tata letak Sentuhan layar oleh ${e.name}`,
        (e: any) => `Disposición del control táctil por ${e.nombre}`,
        (e: any) => `Disposition du contrôleur tactile par ${e.name}`,
        (e: any) => `Configurazione dei comandi su schermo creata da ${e.name}`,
        (e: any) => `タッチ操作レイアウト作成者: ${e.name}`,
        (e: any) => `${e.name} 제작, 터치 컨트롤 레이아웃`,
        (e: any) => `Układ sterowania dotykowego stworzony przez ${e.name}`,
        (e: any) => `Сенсорная раскладка по ${e.name}`,
        (e: any) => `รูปแบบการควบคุมแบบสัมผัสโดย ${e.name}`,
        (e: any) => `${e.name} kişisinin dokunmatik kontrolcü tuş şeması`,
        (e: any) => `Розташування сенсорного керування від ${e.name}`,
        (e: any) => `Bố cục điều khiển cảm ứng tạo bởi ${e.name}`,
        (e: any) => `由 ${e.name} 提供的虚拟按键样式`,
        (e: any) => `觸控遊玩佈局由 ${e.name} 提供`,
    ],
    "touch-controller": "Touch controller",
    "true-achievements": "TrueAchievements",
    "ui": "UI",
    "unexpected-behavior": "May cause unexpected behavior",
    "united-states": "United States",
    "unknown": "Unknown",
    "unlimited": "Unlimited",
    "unmuted": "Unmuted",
    "unofficial": "Unofficial",
    "unofficial-game-list": "Unofficial game list",
    "unsharp-masking": "Unsharp masking",
    "upload": "Upload",
    "uploaded": "Uploaded",
    "use-mouse-absolute-position": "Use mouse's absolute position",
    "use-this-at-your-own-risk": "Use this at your own risk",
    "user-agent-profile": "User-Agent profile",
    "vertical-scroll-sensitivity": "Vertical scroll sensitivity",
    "vertical-sensitivity": "Vertical sensitivity",
    "vibration-intensity": "Vibration intensity",
    "vibration-status": "Vibration",
    "video": "Video",
    "virtual-controller": "Virtual controller",
    "virtual-controller-slot": "Virtual controller slot",
    "visual-quality": "Visual quality",
    "visual-quality-high": "High",
    "visual-quality-low": "Low",
    "visual-quality-normal": "Normal",
    "volume": "Volume",
    "wait-time-countdown": "Countdown",
    "wait-time-estimated": "Estimated finish time",
    "waiting-for-input": "Waiting for input...",
    "wallpaper": "Wallpaper",
    "webgl2": "WebGL2",
    "webgpu": "WebGPU",
    "xbox-360-games": "Xbox 360 games",
    "xbox-apps": "Xbox apps",
    "global-shortcut-hint": "Quick shortcut to open/close menu",
    "stats-shortcut-hint": "Quick shortcut to toggle stats",
    "report-bug": "Report bug (Issues)",
    "tooltip-general": "General PlayXbox Enhanced settings. Press Alt + Shift + X at any time to open or close this menu.",
    "tooltip-audio": "Adjust stream volume booster (requires enabling volume control in the General tab).",
    "tooltip-video": "Configure renderer (WebGL2/WebGPU), Clarity Boost, aspect ratio, sharpness, saturation, contrast, and brightness in real time.",
    "tooltip-controller": "Manage local co-op, controller polling rate, shortcuts, button customization, and deadzones.",
    "tooltip-mkb": "Configure emulated Mouse & Keyboard mappings, in-game keyboard shortcuts, and native MKB scroll sensitivity.",
    "tooltip-stats": "Display real-time stream stats bar (FPS, Ping, Bitrate, Decode time, Packet loss) while playing.",
    "playtime-alert-title": "Playtime alert",
    "playtime-today": "Today",
    "playtime-month": "Cycle",
    "playtime-remaining": "Remaining",
    "playtime-reset": "Reset cycle",
    "playtime-reset-confirm": "Reset your monthly/daily playtime counter?",
};

const PtBrTexts: Partial<Record<keyof typeof Texts, string>> = {
    "achievements": "Conquistas",
    "activate": "Ativar",
    "activated": "Ativado",
    "active": "Ativo",
    "advanced": "Avançado",
    "all-games": "Todos os jogos",
    "always-off": "Sempre desligado",
    "always-on": "Sempre ligado",
    "amd-fidelity-cas": "AMD FidelityFX CAS",
    "app-settings": "Configurações do aplicativo",
    "apply": "Aplicar",
    "aspect-ratio": "Proporção da tela",
    "aspect-ratio-note": "Não use em jogos com toque nativo",
    "audio": "Áudio",
    "auto": "Automático",
    "availability": "Disponibilidade",
    "back-to-home": "Voltar ao início",
    "back-to-home-confirm": "Deseja voltar para a página inicial (sem desconectar)?",
    "background-opacity": "Opacidade do fundo",
    "battery": "Bateria",
    "battery-saving": "Economia de bateria",
    "better-xcloud": "PlayXbox Enhanced",
    "bitrate-audio-maximum": "Taxa de bits máxima de áudio",
    "bitrate-video-maximum": "Taxa de bits máxima de vídeo",
    "bottom": "Inferior",
    "bottom-half": "Metade inferior",
    "bottom-left": "Inferior esquerdo",
    "bottom-right": "Inferior direito",
    "brazil": "Brasil",
    "brightness": "Brilho",
    "browser-unsupported-feature": "Seu navegador não suporta este recurso",
    "button-xbox": "Botão Xbox",
    "bypass-region-restriction": "Ignorar restrição de região",
    "cancel": "Cancelar",
    "center": "Centro",
    "chat": "Chat",
    "clarity-boost": "Aumento de nitidez (Clarity Boost)",
    "clarity-boost-mode": "Modo do Clarity Boost",
    "clarity-boost-warning": "Essas configurações não funcionam quando o modo Clarity Boost está ATIVADO",
    "clear": "Limpar",
    "clear-data": "Limpar dados",
    "clear-data-confirm": "Deseja limpar todas as configurações e dados do PlayXbox Enhanced?",
    "clear-data-success": "Dados limpos! Recarregue a página para aplicar as alterações.",
    "clock": "Relógio",
    "close": "Fechar",
    "close-app": "Fechar aplicativo",
    "combine-audio-video-streams": "Combinar streams de áudio e vídeo",
    "combine-audio-video-streams-summary": "Pode corrigir problemas de atraso no áudio",
    "conditional-formatting": "Cor do texto com formatação condicional",
    "confirm-delete-preset": "Deseja excluir esta predefinição?",
    "confirm-reload-stream": "Deseja recarregar a transmissão?",
    "connected": "Conectado",
    "console-connect": "Conectar",
    "continent-asia": "Ásia",
    "continent-australia": "Austrália",
    "continent-europe": "Europa",
    "continent-north-america": "América do Norte",
    "continent-south-america": "América do Sul",
    "contrast": "Contraste",
    "controller": "Controle",
    "controller-customization": "Personalização do controle",
    "controller-customization-input-latency-note": "Pode aumentar ligeiramente a latência de entrada",
    "controller-friendly-ui": "Interface amigável para controle",
    "controller-shortcuts": "Atalhos do controle",
    "controller-shortcuts-connect-note": "Conecte um controle para usar este recurso",
    "controller-shortcuts-xbox-note": "Botão para abrir o menu Guia",
    "controller-vibration": "Vibração do controle",
    "copy": "Copiar",
    "create-shortcut": "Atalho",
    "custom": "Personalizado",
    "deadzone-counterweight": "Contrapeso da zona morta",
    "decrease": "Diminuir",
    "default": "Padrão",
    "default-opacity": "Opacidade padrão",
    "default-preset-note": "Você não pode modificar predefinições padrão. Crie uma nova para personalizar.",
    "delete": "Excluir",
    "detect-controller-button": "Detectar botão do controle",
    "device": "Dispositivo",
    "device-unsupported-touch": "Seu dispositivo não possui suporte a tela sensível ao toque",
    "device-vibration": "Vibração do dispositivo",
    "device-vibration-not-using-gamepad": "Ligada quando não estiver usando controle",
    "disable": "Desativar",
    "disable-features": "Desativar recursos",
    "disable-home-context-menu": "Desativar menu de contexto na página inicial",
    "disable-post-stream-feedback-dialog": "Desativar diálogo de avaliação pós-transmissão",
    "disable-social-features": "Desativar recursos sociais",
    "disable-xcloud-analytics": "Desativar telemetria/análises do xCloud",
    "disabled": "Desativado",
    "disconnected": "Desconectado",
    "download": "Baixar",
    "downloaded": "Baixado",
    "edit": "Editar",
    "enable-controller-shortcuts": "Ativar atalhos do controle",
    "enable-local-co-op-support": "Ativar suporte a co-op local",
    "enable-local-co-op-support-note": "Funciona apenas em alguns jogos",
    "enable-mic-on-startup": "Ativar microfone ao iniciar o jogo",
    "enable-mkb": "Emular controle com Mouse e Teclado",
    "enable-quick-glance-mode": "Ativar modo \"Olhada Rápida\"",
    "enable-remote-play-feature": "Ativar o recurso \"Reprodução Remota (Remote Play)\"",
    "enable-volume-control": "Ativar recurso de controle de volume",
    "enabled": "Ativado",
    "experimental": "Experimental",
    "export": "Exportar",
    "fast": "Rápido",
    "force-native-mkb-games": "Forçar Mouse e Teclado nativos para estes jogos",
    "fortnite-allow-stw-mode": "Permite jogar o modo \"Salve o Mundo\" no celular",
    "fortnite-force-console-version": "Fortnite: forçar versão de console",
    "friends-followers": "Amigos e seguidores",
    "game-bar": "Barra de Jogo (Game Bar)",
    "getting-consoles-list": "Obtendo lista de consoles...",
    "guide": "Guia",
    "help": "Ajuda",
    "hide": "Ocultar",
    "hide-idle-cursor": "Ocultar cursor do mouse quando inativo",
    "hide-scrollbar": "Ocultar barra de rolagem da página",
    "hide-sections": "Ocultar seções",
    "hide-system-menu-icon": "Ocultar ícone do menu do sistema",
    "hide-touch-controller": "Ocultar controle por toque",
    "high-performance": "Alto desempenho",
    "highest-quality": "Qualidade máxima",
    "highest-quality-note": "Seu dispositivo pode não ser potente o suficiente para usar essas configurações",
    "horizontal-scroll-sensitivity": "Sensibilidade de rolagem horizontal",
    "horizontal-sensitivity": "Sensibilidade horizontal",
    "how-to-fix": "Como corrigir",
    "how-to-improve-app-performance": "Como melhorar o desempenho do aplicativo",
    "ignore": "Ignorar",
    "image-quality": "Qualidade das imagens do site",
    "import": "Importar",
    "in-game-controller-customization": "Personalização do controle no jogo",
    "in-game-controller-shortcuts": "Atalhos do controle no jogo",
    "in-game-keyboard-shortcuts": "Atalhos do teclado no jogo",
    "in-game-shortcuts": "Atalhos no jogo",
    "increase": "Aumentar",
    "install-android": "Aplicativo Better xCloud para Android",
    "invites": "Convites",
    "japan": "Japão",
    "jitter": "Jitter (Variação)",
    "keyboard-key": "Tecla do teclado",
    "keyboard-shortcuts": "Atalhos do teclado",
    "korea": "Coreia",
    "language": "Idioma",
    "large": "Grande",
    "layout": "Layout",
    "left-stick": "Analógico esquerdo",
    "left-stick-deadzone": "Zona morta do analógico esquerdo",
    "left-trigger-range": "Alcance do gatilho esquerdo",
    "limit-fps": "Limitar FPS",
    "load-failed-message": "Falha ao executar o PlayXbox Enhanced",
    "loading-screen": "Tela de carregamento",
    "local-co-op": "Co-op local",
    "lowest-quality": "Qualidade mínima",
    "manage": "Gerenciar",
    "map-mouse-to": "Mapear mouse para",
    "may-not-work-properly": "Pode não funcionar corretamente!",
    "menu": "Menu",
    "microphone": "Microfone",
    "mkb-adjust-ingame-settings": " Você também pode precisar ajustar as configurações de sensibilidade e zona morta dentro do jogo",
    "mkb-click-to-activate": "Clique para ativar",
    "mkb-disclaimer": "Isso pode ser considerado trapaça ao jogar online",
    "modifiers-note": "Para usar mais de uma tecla, inclua Ctrl, Alt ou Shift no seu atalho. A tecla Command não é permitida.",
    "mouse-and-keyboard": "Mouse e Teclado",
    "mouse-click": "Clique do mouse",
    "mouse-wheel": "Roda do mouse",
    "muted": "Silenciado",
    "name": "Nome",
    "native-mkb": "Mouse e Teclado nativos",
    "new": "Novo",
    "no-consoles-found": "Nenhum console encontrado",
    "no-controllers-connected": "Nenhum controle conectado",
    "normal": "Normal",
    "notifications": "Notificações",
    "off": "Desligado",
    "official": "Oficial",
    "oled": "OLED",
    "on": "Ligado",
    "only-supports-some-games": "Suporta apenas alguns jogos",
    "opacity": "Opacidade",
    "other": "Outro",
    "performance": "Desempenho",
    "playing": "Jogando",
    "playtime": "Tempo de jogo",
    "poland": "Polônia",
    "polling-rate": "Taxa de atualização (Polling rate)",
    "position": "Posição",
    "powered-off": "Desligado",
    "powered-on": "Ligado",
    "prefer-ipv6-server": "Preferir servidor IPv6",
    "preferred-game-language": "Idioma preferido do jogo",
    "preset": "Predefinição",
    "press": "Pressione",
    "press-any-button": "Pressione qualquer botão...",
    "press-esc-to-cancel": "Pressione Esc para cancelar",
    "press-to-bind": "Pressione uma tecla ou clique com o mouse para vincular...",
    "prevent-resolution-drops": "Evitar quedas de resolução",
    "prompt-preset-name": "Nome da predefinição:",
    "quality": "Qualidade",
    "recommended": "Recomendado",
    "reduce-animations": "Reduzir animações da interface",
    "region": "Região",
    "reload-page": "Recarregar página",
    "remote-play": "Reprodução Remota",
    "rename": "Renomear",
    "renderer": "Renderizador",
    "renderer-configuration": "Configuração do renderizador",
    "reset-highlighted-setting": "Redefinir configuração selecionada",
    "resolution": "Resolução",
    "right-click-to-unbind": "Clique com o botão direito em uma tecla para desvincular",
    "right-stick": "Analógico direito",
    "right-stick-deadzone": "Zona morta do analógico direito",
    "right-trigger-range": "Alcance do gatilho direito",
    "rocket-always-hide": "Sempre ocultar",
    "rocket-always-show": "Sempre mostrar",
    "rocket-animation": "Animação do foguete",
    "rocket-hide-queue": "Ocultar durante a fila",
    "saturation": "Saturação",
    "save": "Salvar",
    "screen": "Tela",
    "screenshot-apply-filters": "Aplicar filtros de vídeo às capturas de tela",
    "section-all-games": "Ver todos os jogos",
    "section-game-pass": "Jogar com o Game Pass",
    "section-genres": "Gêneros",
    "section-jump-back-in": "Voltar a jogar",
    "section-leaving-soon": "Saindo de cena em breve",
    "section-most-popular": "Mais populares na nuvem",
    "section-native-mkb": "Jogar com mouse e teclado",
    "section-news": "Novidades",
    "section-play-with-friends": "Jogue com amigos",
    "section-recently-added": "Adicionados recentemente",
    "section-touch": "Jogue com toque",
    "section-ubisoft-classics": "Ubisoft+ Classics",
    "separate-touch-controller": "Separar Controle por Toque e Controle nº 1",
    "separate-touch-controller-note": "Controle por toque é o Jogador 1, Controle nº 1 é o Jogador 2",
    "server": "Servidor",
    "server-list-error": "Não foi possível obter a lista de servidores",
    "server-locations": "Localizações dos servidores",
    "settings": "Configurações",
    "settings-for": "Configurações para",
    "settings-reload": "Recarregar página para aplicar as alterações",
    "settings-reload-note": "As configurações desta aba só entram em vigor após recarregar a página",
    "settings-reloading": "Recarregando...",
    "sharpness": "Nitidez",
    "shortcut-keys": "Teclas de atalho",
    "show": "Mostrar",
    "show-controller-connection-status": "Mostrar status de conexão do controle",
    "show-game-art": "Mostrar arte do jogo",
    "show-hide": "Mostrar/ocultar",
    "show-stats-on-startup": "Mostrar estatísticas ao iniciar o jogo",
    "show-touch-controller": "Mostrar controle por toque",
    "show-wait-time": "Mostrar tempo estimado de espera",
    "show-wait-time-in-game-card": "Mostrar tempo de espera nos cartões dos jogos",
    "simplify-stream-menu": "Simplificar menu da transmissão",
    "skip-splash-video": "Pular vídeo de abertura do Xbox",
    "slow": "Lento",
    "small": "Pequeno",
    "smart-tv": "Smart TV",
    "sound": "Som",
    "standard": "Padrão",
    "standby": "Em espera",
    "stat-bitrate": "Bitrate",
    "stat-decode-time": "Decodificação",
    "stat-fps": "FPS",
    "stat-frames-lost": "Quadros perdidos",
    "stat-packets-lost": "Pacotes perdidos",
    "stat-ping": "Ping",
    "stats": "Estatísticas",
    "stick-decay-minimum": "Decaimento mínimo do analógico",
    "stick-decay-strength": "Força de decaimento do analógico",
    "stream": "Transmissão",
    "stream-settings": "Configurações de transmissão",
    "stream-stats": "Estatísticas da transmissão",
    "stream-your-own-game": "Transmita seu próprio jogo",
    "stretch": "Esticar",
    "suggest-settings": "Sugerir configurações",
    "suggest-settings-link": "Sugerir configurações recomendadas para este dispositivo",
    "support-better-xcloud": "Apoie o Better xCloud",
    "swap-buttons": "Inverter botões",
    "take-screenshot": "Capturar tela",
    "target-resolution": "Resolução alvo",
    "tc-all-white": "Todo branco",
    "tc-auto-off": "Desligar ao detectar controle",
    "tc-custom-layout-style": "Estilo dos botões do layout personalizado",
    "tc-muted-colors": "Cores suaves",
    "tc-standard-layout-style": "Estilo dos botões do layout padrão",
    "test-controller": "Testar controle",
    "text-size": "Tamanho do texto",
    "theme": "Tema",
    "toggle": "Alternar",
    "top": "Superior",
    "top-center": "Superior central",
    "top-half": "Metade superior",
    "top-left": "Superior esquerdo",
    "top-right": "Superior direito",
    "touch-control-layout": "Layout do controle por toque",
    "touch-controller": "Controle por toque",
    "true-achievements": "TrueAchievements",
    "ui": "Interface",
    "unexpected-behavior": "Pode causar comportamento inesperado",
    "united-states": "Estados Unidos",
    "unknown": "Desconhecido",
    "unlimited": "Ilimitado",
    "unmuted": "Com som",
    "unofficial": "Não oficial",
    "unofficial-game-list": "Lista não oficial de jogos",
    "unsharp-masking": "Máscara de nitidez (Unsharp masking)",
    "upload": "Enviar",
    "uploaded": "Enviado",
    "use-mouse-absolute-position": "Usar posição absoluta do mouse",
    "use-this-at-your-own-risk": "Use por sua própria conta e risco",
    "user-agent-profile": "Perfil de User-Agent",
    "vertical-scroll-sensitivity": "Sensibilidade de rolagem vertical",
    "vertical-sensitivity": "Sensibilidade vertical",
    "vibration-intensity": "Intensidade da vibração",
    "vibration-status": "Vibração",
    "video": "Vídeo",
    "virtual-controller": "Controle virtual",
    "virtual-controller-slot": "Slot do controle virtual",
    "visual-quality": "Qualidade visual",
    "visual-quality-high": "Alta",
    "visual-quality-low": "Baixa",
    "visual-quality-normal": "Normal",
    "volume": "Volume",
    "wait-time-countdown": "Contagem regressiva",
    "wait-time-estimated": "Horário estimado de término",
    "waiting-for-input": "Aguardando comando...",
    "wallpaper": "Papel de parede",
    "webgl2": "WebGL2",
    "webgpu": "WebGPU",
    "xbox-360-games": "Jogos de Xbox 360",
    "xbox-apps": "Aplicativos do Xbox",
    "global-shortcut-hint": "Atalho rápido para abrir/fechar o menu",
    "stats-shortcut-hint": "Atalho rápido para mostrar/ocultar estatísticas",
    "report-bug": "Reportar bug (Issues)",
    "tooltip-general": "Configurações gerais do PlayXbox Enhanced. Pressione Alt + Shift + X a qualquer momento para abrir ou fechar este menu.",
    "tooltip-audio": "Ajuste o amplificador de volume da transmissão (requer o controle de volume ativado na aba Geral).",
    "tooltip-video": "Configure o renderizador (WebGL2/WebGPU), Clarity Boost, proporção de tela, nitidez, saturação, contraste e brilho em tempo real.",
    "tooltip-controller": "Gerencie co-op local, taxa de atualização (polling rate), atalhos e personalização de botões/zonas mortas do controle.",
    "tooltip-mkb": "Configure mapeamentos de Mouse e Teclado emulado, atalhos de teclado no jogo e sensibilidade de rolagem do MKB nativo.",
    "tooltip-stats": "Exibe barra de estatísticas em tempo real (FPS, Ping, Bitrate, Decodificação, Perda de Pacotes) durante a transmissão.",
    "playtime-alert-title": "Aviso de tempo de jogo",
    "playtime-today": "Hoje",
    "playtime-month": "Ciclo",
    "playtime-remaining": "Restante",
    "playtime-reset": "Zerar ciclo",
    "playtime-reset-confirm": "Deseja zerar o contador de horas jogadas (hoje e ciclo mensal)?",
};

export class Translations {
    private static readonly EN_US = 'en-US';
    private static readonly PT_BR = 'pt-BR';
    private static readonly KEY_LOCALE = StorageKey.LOCALE;
    private static readonly KEY_TRANSLATIONS = StorageKey.LOCALE_TRANSLATIONS;

    private static selectedLocaleIndex = -1;
    private static selectedLocale: keyof typeof SUPPORTED_LANGUAGES = 'pt-BR';

    private static supportedLocales = Object.keys(SUPPORTED_LANGUAGES);
    private static foreignTranslations: any = {};

    private static enUsIndex = Translations.supportedLocales.indexOf(Translations.EN_US);

    static async init() {
        Translations.refreshLocale();
        await Translations.loadTranslations();
    }

    static refreshLocale(newLocale?: string) {
        let locale;
        if (newLocale) {
            localStorage.setItem(Translations.KEY_LOCALE, newLocale);
            locale = newLocale;
        } else {
            locale = localStorage.getItem(Translations.KEY_LOCALE);
        }
        const supportedLocales = Translations.supportedLocales;

        if (!locale) {
            // Get browser's locale
            locale = window.navigator.language || Translations.PT_BR;
            if (locale.toLowerCase().startsWith('pt')) {
                locale = Translations.PT_BR;
            } else if (locale.toLowerCase().startsWith('en')) {
                locale = Translations.EN_US;
            } else if (supportedLocales.indexOf(locale) === -1) {
                locale = Translations.PT_BR;
            }
            localStorage.setItem(Translations.KEY_LOCALE, locale);
        }

        // Synchronize global setting storage with active locale
        try {
            const globalSettings = JSON.parse(localStorage.getItem(StorageKey.GLOBAL) || '{}');
            if (globalSettings['bx.locale'] !== locale) {
                globalSettings['bx.locale'] = locale;
                localStorage.setItem(StorageKey.GLOBAL, JSON.stringify(globalSettings));
            }
        } catch (e) {}

        Translations.selectedLocale = locale as keyof typeof SUPPORTED_LANGUAGES;
        Translations.selectedLocaleIndex = supportedLocales.indexOf(locale);
    }

    static get<T=string>(key: keyof typeof Texts, values?: any): T {
        let text = null;

        if (Translations.selectedLocale === Translations.PT_BR && PtBrTexts[key]) {
            text = PtBrTexts[key];
        } else if (Translations.foreignTranslations && Translations.selectedLocale !== Translations.EN_US) {
            text = Translations.foreignTranslations[key];
        }

        if (!text) {
            text = Texts[key] || alert(`Missing translation key: ${key}`);
        }

        let translation: unknown;
        if (Array.isArray(text)) {
            translation = text[Translations.selectedLocaleIndex] || text[Translations.enUsIndex];
            return (translation as any)(values);
        }

        translation = text;
        return translation as T;
    }

    private static async loadTranslations() {
        if (Translations.selectedLocale === Translations.EN_US) {
            return;
        }

        if (Translations.selectedLocale === Translations.PT_BR) {
            Translations.foreignTranslations = PtBrTexts;
            try {
                window.localStorage.setItem(Translations.KEY_TRANSLATIONS, JSON.stringify(PtBrTexts));
            } catch (e) {}
            return;
        }

        try {
            Translations.foreignTranslations = JSON.parse(window.localStorage.getItem(Translations.KEY_TRANSLATIONS)!);
        } catch(e) {}

        if (!Translations.foreignTranslations) {
            await this.downloadTranslations(Translations.selectedLocale);
        }
    }

    static async updateTranslations(async=false) {
        // Don't have to download en-US
        if (Translations.selectedLocale === Translations.EN_US) {
            localStorage.removeItem(Translations.KEY_TRANSLATIONS);
            return;
        }

        if (Translations.selectedLocale === Translations.PT_BR) {
            Translations.foreignTranslations = PtBrTexts;
            try {
                window.localStorage.setItem(Translations.KEY_TRANSLATIONS, JSON.stringify(PtBrTexts));
            } catch (e) {}
            return;
        }

        if (async) {
            Translations.downloadTranslationsAsync(Translations.selectedLocale);
        } else {
            await Translations.downloadTranslations(Translations.selectedLocale);
        }
    }

    static async downloadTranslations(locale: string) {
        if (locale === Translations.PT_BR) {
            Translations.foreignTranslations = PtBrTexts;
            try {
                window.localStorage.setItem(Translations.KEY_TRANSLATIONS, JSON.stringify(PtBrTexts));
            } catch (e) {}
            return true;
        }

        if (window.location.hostname === 'play.xbox.com') {
            return false;
        }
        try {
            const resp = await NATIVE_FETCH(GhPagesUtils.getUrl(`translations/${locale}.json`));
            const translations = await resp.json();

            // Prevent saving incorrect translations
            let currentLocale = localStorage.getItem(Translations.KEY_LOCALE);
            if (currentLocale === locale) {
                window.localStorage.setItem(Translations.KEY_TRANSLATIONS, JSON.stringify(translations));
                Translations.foreignTranslations = translations;
            }
            return true;
        } catch (e) {
            debugger;
        }

        return false;
    }

    static downloadTranslationsAsync(locale: string) {
        if (locale === Translations.PT_BR) {
            Translations.foreignTranslations = PtBrTexts;
            try {
                window.localStorage.setItem(Translations.KEY_TRANSLATIONS, JSON.stringify(PtBrTexts));
            } catch (e) {}
            return;
        }

        if (window.location.hostname === 'play.xbox.com') {
            return;
        }
        NATIVE_FETCH(GhPagesUtils.getUrl(`translations/${locale}.json`))
            .then(resp => resp.json())
            .then(translations => {
                window.localStorage.setItem(Translations.KEY_TRANSLATIONS, JSON.stringify(translations));
                Translations.foreignTranslations = translations;
            });
    }

    static switchLocale(locale: string) {
        localStorage.setItem(Translations.KEY_LOCALE, locale);
    }
}

export const t = Translations.get;
export const ut = (text: string): string => {
    BxLogger.warning('Untranslated text', text);
    return text;
}

Translations.init();
