import { MODULE_ID } from "../main.js";

export function getImportGroups() {
    return ["tables", "journal", "recipes"].map((key) => ({ key, pack: game.packs.get(`${MODULE_ID}.${MODULE_ID}-${key}`) }));
}

const HARVESTING_JOURNAL = "qsk83Qye10ZWQxPb";
const HARVEST_DRAWS = 1;
const EMBEDDED = { JournalEntry: "pages", RollTable: "results" };
const PRESERVED_PAGE_SYSTEM = { "gatherer.gatherer": ["state", "discovered"] };

export function getPackStatus(pack) {
    const collection = game.collections.get(pack.documentName);
    const imported = pack.index.filter((entry) => collection.has(entry._id)).length;
    return { total: pack.index.size, imported, missing: pack.index.size - imported };
}

export async function importPack(pack, { update = false, ids = null } = {}) {
    const collection = game.collections.get(pack.documentName);
    const documents = await pack.getDocuments(ids ? { _id__in: ids } : {});
    const missing = documents.filter((doc) => !collection.has(doc.id));
    const existing = update ? documents.filter((doc) => collection.has(doc.id)) : [];

    if (missing.length) {
        const rootFolder = await getRootFolder(pack);
        const folderData = pack.folders.filter((f) => !game.folders.has(f.id)).map((f) => ({ ...f.toObject(), folder: f.folder?.id ?? rootFolder.id }));
        await Folder.implementation.createDocuments(folderData, { keepId: true });
        const createData = missing.map((doc) => {
            const data = localizeTables(collection.fromCompendium(doc, { keepId: true }));
            data.folder ??= rootFolder.id;
            return data;
        });
        await pack.documentClass.createDocuments(createData, { keepId: true });
    }

    if (existing.length) {
        const updateData = existing.map((doc) => mergeWorldData(localizeTables(collection.fromCompendium(doc, { keepId: true })), collection.get(doc.id), pack.documentName));
        await pack.documentClass.updateDocuments(updateData, { diff: false, recursive: false });
    }

    return { created: missing.length, updated: existing.length };
}

export async function applyCreatureHarvesting({ update = false } = {}) {
    const [tables, journal] = ["tables", "journal"].map((key) => game.packs.get(`${MODULE_ID}.${MODULE_ID}-${key}`));
    const source = await journal.getDocument(HARVESTING_JOURNAL);
    const tableIds = source.pages.map((page) => foundry.utils.parseUuid(page.system.table).id);
    const results = [await importPack(tables, { update, ids: tableIds }), await importPack(journal, { update, ids: [HARVESTING_JOURNAL] })];
    const mapping = {};
    for (const page of game.journal.get(HARVESTING_JOURNAL).pages) {
        const type = page.getFlag(MODULE_ID, "creatureType");
        if (type) mapping[type] = { pages: [{ page: page.uuid, weight: 1 }], draws: HARVEST_DRAWS };
    }
    await game.settings.set("gatherer", "creatureTypes", mapping);
    return results.reduce((acc, r) => ({ created: acc.created + r.created, updated: acc.updated + r.updated }), { created: 0, updated: 0 });
}

function localizeTables(data) {
    for (const page of data.pages ?? []) {
        const uuid = page.type === "gatherer.gatherer" ? page.system?.table : null;
        if (!uuid?.startsWith("Compendium.")) continue;
        const { id } = foundry.utils.parseUuid(uuid);
        if (game.tables.has(id)) page.system.table = `RollTable.${id}`;
    }
    return data;
}

function mergeWorldData(data, worldDoc, documentName) {
    const world = worldDoc.toObject();
    data.ownership = world.ownership;
    data.folder = world.folder;
    data.sort = world.sort;

    const field = EMBEDDED[documentName];
    if (!field) return data;
    const worldEmbedded = new Map(world[field].map((e) => [e._id, e]));
    for (const entry of data[field]) {
        const worldEntry = worldEmbedded.get(entry._id);
        if (!worldEntry) continue;
        worldEmbedded.delete(entry._id);
        if ("ownership" in worldEntry) entry.ownership = worldEntry.ownership;
        for (const key of PRESERVED_PAGE_SYSTEM[entry.type] ?? []) {
            if (worldEntry.system && key in worldEntry.system) entry.system[key] = worldEntry.system[key];
        }
    }
    data[field].push(...worldEmbedded.values());
    return data;
}

async function getRootFolder(pack) {
    const existing = game.folders.find((f) => f.type === pack.documentName && f.getFlag(MODULE_ID, "pack") === pack.collection);
    if (existing) return existing;
    const legacy = game.folders.find((f) => f.type === pack.documentName && !f.folder && f.name === pack.title && !f.getFlag(MODULE_ID, "pack"));
    if (legacy) return legacy.setFlag(MODULE_ID, "pack", pack.collection);
    return Folder.implementation.create({
        name: pack.title,
        type: pack.documentName,
        color: pack.folder?.color ?? null,
        flags: { [MODULE_ID]: { pack: pack.collection } },
    });
}
