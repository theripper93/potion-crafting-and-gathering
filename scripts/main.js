import { initConfig } from "./config.js";
import { registerSettings, migrateLegacySettings, getSetting } from "./settings.js";
import { notifyModuleStatus } from "./versionCheck.js";
import { ImportApp } from "./app/ImportApp.js";

export const MODULE_ID = "potion-crafting-and-gathering";

Hooks.on("init", () => {
    initConfig();
    registerSettings();
    game.modules.get(MODULE_ID).api = { ImportApp };
});

Hooks.once("ready", async () => {
    if (!game.user.isGM) return;
    await migrateLegacySettings();
    notifyModuleStatus();
    if (getSetting("showImportOnStartup")) new ImportApp().render({ force: true });
});
