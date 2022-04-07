import CONSTANTS from "./constants.js";

const utils = {

  firstGM: () =>{
    return game.users.find(u => u.isGM && u.active);
  },

  isFirstGM: () => {
    return game.user.id === utils.firstGM()?.id;
  },

  resetInjuryTokens: (flags) => {
    flags.injury.tokens = {
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
    return flags;
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
        tokens: utils.resetInjuryTokens(),
        list: [],
      },
      bleeding: false,
    };
    console.warn(flags);
    if (game.combat && game.combat.id !== flags.openWounds.combatId) {
      flags.openWounds.combatId = game.combat.id;
      flags.openWounds.combat = 0;
      flags.woundRisks = 0;
      flags.bleeding = false;
      flags.injury.tokens = utils.resetInjuryTokens();
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

  openWoundCheck: (actor, flags) => {
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

};


export default utils;
