import { MODULE_ID } from "./main.js";
import { ImportApp } from "./app/ImportApp.js";

export function registerSettings() {
    game.settings.registerMenu(MODULE_ID, "importMenu", {
        name: `${MODULE_ID}.settings.importMenu.name`,
        label: `${MODULE_ID}.settings.importMenu.label`,
        hint: `${MODULE_ID}.settings.importMenu.hint`,
        icon: "fa-solid fa-file-import",
        type: ImportApp,
        restricted: true,
    });

    const settings = {
        "showImportOnStartup": {
            scope: "world",
            config: false,
            type: Boolean,
            default: true,
        },
        "offeredContentVersion": {
            scope: "world",
            config: false,
            type: String,
            default: "",
        },
    };

    registerSettingsArray(settings);
}

export async function migrateLegacySettings() {
    const legacy = game.settings.storage.get("world").getSetting(`${MODULE_ID}.booksImported`);
    if (!legacy) return;
    await setSetting("showImportOnStartup", JSON.parse(legacy._source.value));
    await legacy.delete();
}

export function getSetting(key) {
    return game.settings.get(MODULE_ID, key);
}

export async function setSetting(key, value) {
    return await game.settings.set(MODULE_ID, key, value);
}

function registerSettingsArray(settings) {
    for (const [key, value] of Object.entries(settings)) {
        if (!value.name) value.name = `${MODULE_ID}.settings.${key}.name`
        if (!value.hint) value.hint = `${MODULE_ID}.settings.${key}.hint`
        game.settings.register(MODULE_ID, key, value);
    }
}
