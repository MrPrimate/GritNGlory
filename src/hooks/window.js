import CONSTANTS from "../constants.js";
import utils from "../utils.js";

export function registerWindowFunctions() {
  window[`${CONSTANTS.MODULE_NAME}`] = {
    setFlags: utils.setFlags,
    getFlags: utils.getFlags,
    resetFlags: utils.resetFlags,
  };
}
