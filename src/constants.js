const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 100);



const CONSTANTS = {
  MODULE_NAME: "GritNGlory",
  MODULE_FULL_NAME: "GritNGlory.ModuleName",
  FLAG_NAME: "GritNGlory",
  SETTINGS: {
    // Enable options
    ENABLE_WOUNDS: "enable-wounds",
    LOG_LEVEL: "log-level",
  },

  GET_DEFAULT_SETTINGS() {
    return foundry.utils.deepClone(CONSTANTS.DEFAULT_SETTINGS);
  },

  WOUNDS: {
    MINIMUM_OPEN_WOUNDS: 3,
  },

};

CONSTANTS.DEFAULT_SETTINGS = {
  // Enable options
  [CONSTANTS.SETTINGS.ENABLE_WOUNDS]: {
    name: "GritNGlory.Settings.EnableWounds.Name",
    hint: "GritNGlory.Settings.EnableWounds.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: debouncedReload,
  },

  // debug
  [CONSTANTS.SETTINGS.LOG_LEVEL]: {
    name: "GritNGlory.Settings.LogLevel.Name",
    hint: "GritNGlory.Settings.LogLevel.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      DEBUG: "GritNGlory.Settings.LogLevel.debug",
      INFO: "GritNGlory.Settings.LogLevel.info",
      WARN: "GritNGlory.Settings.LogLevel.warn",
      ERR: "GritNGlory.Settings.LogLevel.error",
      OFF: "GritNGlory.Settings.LogLevel.off",
    },
    default: "WARN",
  }

};

CONSTANTS.PATH = `modules/${CONSTANTS.MODULE_NAME}/`;

export default CONSTANTS;
