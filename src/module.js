import logger from "./logger.js";
import CONSTANTS from "./constants.js";
import { registerSettings } from "./hooks/settings.js";
import { registerLibwrappers } from "./hooks/libwrapper.js";
import { registerCharacterHooks } from "./hooks/character.js";
import { registerWindowFunctions } from "./hooks/window.js";
import { registerTrackerHooks } from "./hooks/tracker.js";
import { registerSheetButton } from "./hooks/sheets.js";

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM) {
    ui.notifications.error(`Module ${game.i18n.localize("GritNGlory.ModuleName")} requires the 'libWrapper' module. Please install and activate it.`);
    logger.error(`Module ${game.i18n.localize("GritNGlory.ModuleName")} requires the 'libWrapper' module. Please install and activate it.`);
  } else {
    logger.debug("Registering libWrapper wrappers");
    registerLibwrappers();

    const woundsEnabled = game.settings.get(CONSTANTS.MODULE_NAME, CONSTANTS.SETTINGS.ENABLE_WOUNDS);
    if (woundsEnabled) {
      registerCharacterHooks();
      registerTrackerHooks();
      registerSheetButton();
    }

    // TO DO: hit dice on long rest to remove open wounds

    registerWindowFunctions();
  }
});
