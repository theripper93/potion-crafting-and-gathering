import { initConfig } from "./config.js";
import { registerSettings } from "./settings.js";

export const MODULE_ID = "potion-crafting-and-gathering";

const CONSTANTS = {
    MODULE_ID: "potion-crafting-and-gathering",
    PATH: `modules/potion-crafting-and-gathering/`,
    PACK_UUID_ROLLTABLES: "potion-crafting-and-gathering.potion-crafting-and-gathering-tables",
    PACK_UUID_JOURNALS: "potion-crafting-and-gathering.potion-crafting-and-gathering-journal",
    PACK_UUID_RECIPES: "potion-crafting-and-gathering.potion-crafting-and-gathering-recipes",
    GATHERER_MODULE_ID: "gatherer",
};

Hooks.on("init", () => {
    initConfig();
    registerSettings();
});

Hooks.once("ready", async () => {
    if (!game.user.isGM || !game.settings.get(MODULE_ID, "booksImported")) {
        return;
    }

    Dialog.confirm({
        title: game.modules.get(MODULE_ID).title,
        content: "Do you want to import all tables, journals and recipes?",
        yes: () => {
            importAll();
        },
        no: () => {
            game.settings.set(MODULE_ID, "booksImported", false);
        },
        defaultYes: true,
    });
});

async function importAll() {
    debugger
    ui.notifications.success(`${MODULE_ID} | Recipe Books Imported. The Potion Crafting & Gathering module needs to stay enabled as the items are stored in it's compendium packs.`, { permanent: true });
    await game.packs.get(CONSTANTS.PACK_UUID_ROLLTABLES).importAll({ keepId: true });
    await game.packs.get(CONSTANTS.PACK_UUID_JOURNALS).importAll({ keepId: true });
    await game.packs.get(CONSTANTS.PACK_UUID_RECIPES).importAll({ keepId: true });
    new (game.modules.get("mastercrafted").API.RecipeBookApplication)().render({ force: true });
    await game.settings.set(MODULE_ID, "booksImported", false);
}
