import CONSTANTS from "../../constants.js";
import logger from "../../logger.js";


async function patchShortRest(wrapped, ...args) {
  logger.info("Patching short rest");
  console.warn("shortRestWrapped", wrapped);
  console.warn("shortRestArgs", args);
  console.warn("this", this);
  return wrapped(args);
}

function patchLongRest(wrapped, ...args) {
  logger.info("Patching long rest");
  console.warn("longRestWrapped", wrapped);
  console.warn("longRestArgs", args);
  console.warn("this", this);
  return wrapped(args);
}


export function registerLibwrappers() {
  libWrapper.register(CONSTANTS.MODULE_NAME, "CONFIG.Actor.documentClass.prototype.shortRest", patchShortRest, "WRAPPER");
  libWrapper.register(CONSTANTS.MODULE_NAME, "CONFIG.Actor.documentClass.prototype.longRest", patchLongRest, "WRAPPER");
}
