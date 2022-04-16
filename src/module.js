import logger from "./logger.js";
import CONSTANTS from "./constants.js";
import { registerSettings } from "./hooks/settings.js";
import { registerLibwrappers } from "./hooks/libwrapper.js";
import { registerCharacterHooks } from "./hooks/character.js";
import { registerWindowFunctions } from "./hooks/window.js";
import { registerTrackerHooks } from "./hooks/tracker.js";

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM) {
    ui.notifications.error(`Module ${CONSTANTS.MODULE_FULL_NAME} requires the 'libWrapper' module. Please install and activate it.`);
    logger.error(`Module ${CONSTANTS.MODULE_FULL_NAME} requires the 'libWrapper' module. Please install and activate it.`);
  } else {
    logger.debug("Registering libWrapper wrappers");
    registerLibwrappers();

    const woundsEnabled = game.settings.get(CONSTANTS.MODULE_NAME, CONSTANTS.SETTINGS.ENABLE_WOUNDS);
    if (woundsEnabled) {
      registerCharacterHooks();
    }

    if (woundsEnabled) {
      registerTrackerHooks();
    }

    // TODO: hit dice on long rest to remove open wounds

    registerWindowFunctions();
  }
});

// TODO: Tables for injury
