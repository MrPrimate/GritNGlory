import CONSTANTS from "./constants.js";
import logger from "./logger.js";

const utils = {

  wait: async (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },

  setting: (key) => {
    return game.settings.get(CONSTANTS.MODULE_NAME, key);
  },

  updateSetting: async (key, value) => {
    return game.settings.set(CONSTANTS.MODULE_NAME, key, value);
  },

  firstGM: () => {
    return game.users.find((user) => user.isGM && user.active);
  },

  isFirstGM: () => {
    return game.user.id === utils.firstGM()?.id;
  },

  getDefaultInjuryTokens: () => {
    const tokens = {};
    Object.keys(CONFIG.DND5E.damageTypes).forEach((type) => {
      tokens[type] = 0;
    });
    return tokens;
  },

  getFlags: (actor) => {
    const flags = actor.data.flags[CONSTANTS.FLAG_NAME]
      ? actor.data.flags[CONSTANTS.FLAG_NAME]
      : {
        woundRisks: 0,
        openWounds: {
          combatId: game.combat?.id,
          combat: 0,
          total: 0,
        },
        injury: {
          tokens: utils.getDefaultInjuryTokens(),
          list: [],
        },
        bleeding: false,
      };
    if (game.combat && game.combat.id !== flags.openWounds.combatId) {
      flags.openWounds.combatId = game.combat.id;
      flags.openWounds.combat = 0;
      flags.woundRisks = 0;
      flags.bleeding = false;
      flags.injury.tokens = utils.getDefaultInjuryTokens();
    } else if (!game.combat?.current?.round) {
      flags.openWounds.combatId = null;
    }
    return flags;
  },

  setFlags: async (actor, flags) => {
    let updateData = {};
    setProperty(updateData, `flags.${CONSTANTS.FLAG_NAME}`, flags);
    await actor.update(updateData);
    return actor;
  },

  resetFlags: async (actor) => {
    return utils.setFlags(actor, null);
  },

  wounds: {
    // why are we passing in conMod and level here?
    // well some kind of weird bug where when the actor is passed in it doesn't work right,
    openWoundCheck: (actor, conMod, level, flags) => {
      logger.debug(`${actor.name} has checking open wounds.`);
      const actorWounds = conMod + Math.floor(level / 2);

      const maxOpenWounds = Math.max(actorWounds, CONSTANTS.WOUNDS.MINIMUM_OPEN_WOUNDS);
      logger.debug("maxOpenWounds", maxOpenWounds);
      if (flags.openWounds.total >= maxOpenWounds) {
        const content = `${actor.name} has now suffered ${flags.openWounds.total} Open Wounds. They are now unconscious.`;
        ChatMessage.create({ content });
        if (game.modules.get("dfreds-convenient-effects")?.active) {
          game.dfreds.effectInterface.addEffect({ effectName: "Unconscious", uuid: actor.uuid });
        }
      }
    },
  },

  injury: {
    selectInjuryType: async (actor) => {
      const contentOptions = Object.entries(CONFIG.DND5E.damageTypes).map(([key, value]) => {
        return `<option value=${key}>${value}</option>`;
      }).join();

      const content = `
<div class="form-group">
  <label>Weapons : </label>
  <select name="damageTypes">
  ${contentOptions}
  </select>
</div>
`;
      new Dialog({
        title: "Unable to detect damage type, please select one",
        content,
        buttons: {
          Ok: {
            label: "Ok",
            callback: async (html) => {
              const type = html.find("[name=damageTypes]")[0].value;
              const flags = utils.getFlags(actor);
              flags.injury.tokens[type] += 1;
              utils.setFlags(actor, flags);
            },
          },
          Cancel: {
            label: "Cancel",
          },
        },
      }).render(true);

    },

    tokenCheck: async (actor, diValues, update) => {
      logger.debug("injury.tokenCheck", update);
      let tokens = {};
      if (update.damageItem?.appliedDamage) {
        for (const damage of update.damageItem.damageDetail[0]) {
          // immune?
          if (!diValues.includes(damage.type)) {
            tokens[damage.type] += 1;
          }
        }
      } else {
        logger.debug("Unable to parse damage type");
        await utils.selectInjuryType(actor);
      }

      return tokens;
    },
  },

};


export default utils;
