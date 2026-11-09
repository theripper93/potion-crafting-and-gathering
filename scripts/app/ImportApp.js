import { MODULE_ID } from "../main.js";
import { getSetting, setSetting } from "../settings.js";
import { getModuleStatus } from "../versionCheck.js";
import { applyCreatureHarvesting, getImportGroups, getPackStatus, importPack } from "./importer.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ImportApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static get DEFAULT_OPTIONS() {
        return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
            id: `${MODULE_ID}-import`,
            tag: "form",
            classes: [MODULE_ID],
            window: {
                title: `${MODULE_ID}.importApp.title`,
                icon: "fa-solid fa-flask",
                contentClasses: ["standard-form"],
            },
            position: { width: 480, height: "auto" },
            form: {
                handler: this.#onSubmit,
                closeOnSubmit: false,
            },
        }, { inplace: false });
    }

    static get PARTS() {
        return {
            content: { template: `modules/${MODULE_ID}/templates/import-app.hbs` },
            footer: { template: "templates/generic/form-footer.hbs" },
        };
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.modules = getModuleStatus();
        context.packs = getImportGroups().map(({ key, pack }) => ({ key, label: `${MODULE_ID}.importApp.packs.${key}`, ...getPackStatus(pack), checked: true }));
        context.update = false;
        context.harvesting = { available: !!game.modules.get("gatherer")?.active };
        context.showOnStartup = getSetting("showImportOnStartup");
        context.buttons = [{ type: "submit", icon: "fa-solid fa-file-import", label: `${MODULE_ID}.importApp.import` }];
        return context;
    }

    static async #onSubmit(event, form, formData) {
        const data = formData.object;
        await setSetting("showImportOnStartup", data.showOnStartup);
        const selected = getImportGroups().filter(({ key }) => data[`packs.${key}`]);
        if (!selected.length && !data.harvesting) return;

        let created = 0;
        let updated = 0;
        for (const { pack } of selected) {
            const result = await importPack(pack, { update: data.update });
            created += result.created;
            updated += result.updated;
        }
        if (data.harvesting) {
            const result = await applyCreatureHarvesting({ update: data.update && !selected.some(({ key }) => ["tables", "journal"].includes(key)) });
            created += result.created;
            updated += result.updated;
            ui.notifications.info(`${MODULE_ID}.importApp.harvesting.done`, { localize: true });
        }
        ui.notifications.success(game.i18n.format(`${MODULE_ID}.importApp.done`, { created, updated }));
        await this.render();

        const mastercrafted = game.modules.get("mastercrafted");
        if (mastercrafted?.active && selected.some(({ key }) => key === "recipes")) mastercrafted.API?.RecipeBookApplication?.open?.();
    }
}
