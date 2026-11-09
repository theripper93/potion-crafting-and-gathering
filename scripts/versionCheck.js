import { MODULE_ID } from "./main.js";

export const REQUIREMENTS = {
    mastercrafted: "7.0.0",
    gatherer: "6.0.0",
};

export function getModuleStatus() {
    return Object.entries(REQUIREMENTS).map(([id, required]) => {
        const module = game.modules.get(id);
        const version = module?.version ?? null;
        const active = !!module?.active;
        const outdated = !!version && foundry.utils.isNewerVersion(required, version);
        let state = "ok";
        if (!module) state = "missing";
        else if (outdated) state = "outdated";
        else if (!active) state = "inactive";
        return {
            id,
            title: module?.title ?? id,
            version,
            required,
            active,
            state,
            ok: state === "ok",
            label: game.i18n.format(`${MODULE_ID}.versionCheck.state.${state}`, { version, required }),
        };
    });
}

export function notifyModuleStatus() {
    for (const status of getModuleStatus()) {
        if (status.state === "outdated") ui.notifications.warn(game.i18n.format(`${MODULE_ID}.versionCheck.outdated`, status), { permanent: true });
        else if (!status.ok) ui.notifications.info(game.i18n.format(`${MODULE_ID}.versionCheck.unavailable`, status));
    }
}
