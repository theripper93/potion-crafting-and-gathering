import { initConfig } from "./config.js";
import { registerSettings } from "./settings.js";

export const MODULE_ID = "potion-crafting-gathering";

const CONSTANTS = {
    MODULE_ID: "potion-crafting-and-gathering",
    PATH: `modules/potion-crafting-and-gathering/`,
    PACK_UUID_ROLLTABLES: "potion-crafting-and-gathering.potion-crafting-and-gathering-tables",
    PACK_UUID_JOURNALS: "potion-crafting-and-gathering.potion-crafting-and-gathering-journal",
    MODULE_FOLDER: `modules/potion-crafting-and-gathering/assets/recipes`,
    GATHERER_MODULE_ID: "gatherer",
    PACK_UUID_ALCHEMY: "potion-crafting-and-gathering.potion-crafting-and-gathering-alchemy",
    PACK_UUID_HERBALISM: "potion-crafting-and-gathering.potion-crafting-and-gathering-herbalism",
    PACK_UUID_INGREDIENTS: "potion-crafting-and-gathering.potion-crafting-and-gathering-ingredients",
    PACK_UUID_POISONS: "potion-crafting-and-gathering.potion-crafting-and-gathering-poisons",
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
            game.settings.set(CONSTANTS.MODULE_ID, SETTINGS.booksImported, false);
        },
        defaultYes: true,
    });
});

async function importAll() {
    const ROOT = CONSTANTS.MODULE_FOLDER;
    const BOOKS = (await FilePicker.browse("user", ROOT)).files.filter((f) => f.endsWith(".json"));
    for (let book of BOOKS) {
        const bookData = await fetch(book).then((r) => r.json());
        const bookObj = new ui.RecipeApp.RecipeBook(bookData);
        await bookObj.saveData();
    }
    ui.notifications.notify(`${CONSTANTS.MODULE_ID} | Recipe Books Imported`);
    await game.packs.get(CONSTANTS.PACK_UUID_ROLLTABLES).importAll({ keepId: true });
    await game.packs.get(CONSTANTS.PACK_UUID_JOURNALS).importAll({ keepId: true });
    new ui.RecipeApp().render(true);
    await game.settings.set(CONSTANTS.MODULE_ID, SETTINGS.booksImported, false);
}
