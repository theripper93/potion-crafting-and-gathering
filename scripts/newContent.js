import { MODULE_ID } from "./main.js";
import { getSetting, setSetting } from "./settings.js";
import { ImportApp } from "./app/ImportApp.js";

const CONTENT_VERSION = "5.0.0";

export function offerNewContent() {
    const offered = getSetting("offeredContentVersion");
    if (offered && !foundry.utils.isNewerVersion(CONTENT_VERSION, offered)) return;
    const remember = () => setSetting("offeredContentVersion", game.modules.get(MODULE_ID).version);
    const items = ["tables", "harvesting", "smithing"].map((key) => `<li>${game.i18n.localize(`${MODULE_ID}.newContent.items.${key}`)}</li>`).join("");
    new foundry.applications.api.DialogV2({
        window: { title: `${MODULE_ID}.newContent.title`, icon: "fa-solid fa-flask" },
        position: { width: 480 },
        content: `<p>${game.i18n.localize(`${MODULE_ID}.newContent.intro`)}</p><ul>${items}</ul><p>${game.i18n.localize(`${MODULE_ID}.newContent.hint`)}</p>`,
        buttons: [
            {
                action: "import",
                label: `${MODULE_ID}.newContent.open`,
                icon: "fa-solid fa-file-import",
                default: true,
                callback: async () => {
                    await remember();
                    new ImportApp().render({ force: true });
                },
            },
            {
                action: "dismiss",
                label: `${MODULE_ID}.newContent.dismiss`,
                icon: "fa-solid fa-xmark",
                callback: () => remember(),
            },
        ],
    }).render({ force: true });
}
