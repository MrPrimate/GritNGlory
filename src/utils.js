import CONSTANTS from "./constants.js";
import logger from "./logger.js";


async function selectInjuryType() {

  const contentOptions = CONSTANTS.INJURY.TYPES.map((t) => `<option value=${t}>${t}</option>`).join("");
  const content = `
<div class="form-group">
 <label>Weapons : </label>
 <select name="types">
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
          const type = html.find("[name=type]")[0].value;
          console.warn(`Detected damage type: ${type}`);
        },
      },
      Cancel: {
        label: "Cancel",
      },
    },
  }).render(true);

}



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
    CONSTANTS.INJURY.TYPES.forEach((type) => {
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
        turnDamage: [],
      };
    if (game.combat && game.combat.id !== flags.openWounds.combatId) {
      flags.openWounds.combatId = game.combat.id;
      flags.openWounds.combat = 0;
      flags.woundRisks = 0;
      flags.bleeding = false;
      flags.injury.tokens = utils.getDefaultInjuryTokens();
      flags.turnDamage = [];
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
    openWoundCheck: (actor, flags) => {
      logger.debug(`${actor.name} has checking open wounds.`);
      console.warn(actor);
      console.warn(actor.name);
      console.warn(actor.data.data);
      console.warn(actor.data.data.abilities.con.mod);
      console.warn(actor.data.data.details.level);
      console.warn(Math.floor(actor.data.data.details.level / 2))
      console.warn(actor.data.data.abilities.con.mod + Math.floor(actor.data.data.details.level / 2))
      const actorWounds = actor.data.data.abilities.con.mod + Math.floor(actor.data.data.details.level / 2);
      console.warn("actorWounds", actorWounds);
      console.warn("CONSTANTS.WOUNDS.MINIMUM_OPEN_WOUNDS", CONSTANTS.WOUNDS.MINIMUM_OPEN_WOUNDS);
      const maxOpenWounds = Math.max(actorWounds, CONSTANTS.WOUNDS.MINIMUM_OPEN_WOUNDS);
      console.warn("maxOpenWounds", maxOpenWounds);
      if (flags.openWounds.total >= maxOpenWounds) {
        let content = `${actor.name} has now suffered ${flags.openWounds.total} Open Wounds. The are now unconscious.`;
        ChatMessage.create({ content });
        if (game.modules.get("dfreds-convenient-effects")?.active) {
          game.dfreds.effectInterface.addEffect({ effectName: "Unconscious", uuid: actor.uuid });
        }
      }
    },
  },

  injury: {
    tokenCheck: async (actor, update) => {
      console.warn(update);
      let tokens = {};
      if (update.damageItem?.appliedDamage) {
        for (const damage of update.damageItem.damageDetail[0]) {
          // immune?
          if (!actor.data.data.traits.di.value.includes(damage.type)) {
            tokens[damage.type] += 1;
          }
        }
      } else {
        // TO DO : dialog to add injury
        await selectInjuryType(actor);
      }

      return tokens;
    },
  },

};


export default utils;
