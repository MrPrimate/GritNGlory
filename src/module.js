import { registerSettings } from "./hooks/settings.js";
import { registerLibwrappers } from "./hooks/libwrapper.js";
import logger from "./logger.js";
import CONSTANTS from "./constants.js";

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
  }
});
