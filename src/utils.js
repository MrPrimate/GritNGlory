import CONSTANTS from "./constants.js";
import logger from "./logger.js";

const utils = {

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
    return {
      piercing: 0,
      bludgeoning: 0,
      slashing: 0,
      fire: 0,
      cold: 0,
      acid: 0,
      lightning: 0,
      necrotic: 0,
      poison: 0,
      radiant: 0,
      thunder: 0,
      force: 0,
      psychic: 0,
    };
  },

  getFlags: (actor) => {
    const flags = actor.data.flags[CONSTANTS.FLAG_NAME] || {
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
    return utils.setFlags(actor, undefined);
  },

  wounds: {
    openWoundCheck: (actor, flags) => {
      logger.debug(`${actor.name} has checking open wounds.`);
      const maxOpenWounds = Math.max(actor.data.data.abilities.con.mod + Math.floor(actor.data.data.details.level / 2), 3);
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


};


export default utils;
