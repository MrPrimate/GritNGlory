import CONSTANTS from "../constants.js";
import logger from "../logger.js";
import utils from "../utils.js";


// To represent actual bodily trauma, Grit and Glory uses what is called 'Wound Thresholds' and 'Wound Risks'.

// A creature's Wound Threshold is equal to 12 + their Constitution modifier and represents how tough they are
// to resist physical damage. Should a creature ever take damage equal or greater than their Wound Threshold,
// they suffer what is called a Wound Risk - an injury that very well could lead to something serious!
// DM's and players can use tokens to tally up their characters' Wound Risks.

// Wound Threshold = 12 + CON Modifier

// At the end of each Combat Turn, if you have suffered one or more Wound Risks, make a
// Constitution saving throw at DC 12 + 2 for each Wound Risk you have.
// This saving throw is called a Confirmation Roll. Should you fail, you suffer an
// Open Wound - an injury that is bleeding profusely!

// Regardless of whether you succeeded or failed the Confirmation Roll, remove
// all your Wound Risks, resetting them to 0, ready for another Turn.

// Confirmation DC = 12 + 2 per Wound Risk

// Any time you take damage that is equal or greater than x2 your Wound Threshold, you
// automatically suffer an Open Wound and you take an Injury token (pg. 9).

function getInjuryToken(flags) {

}


async function preUpdateActorHook(actor, update) {
  return new Promise((resolve, reject) => {

    console.warn(actor);
    console.warn(update);
    const currentCombat = game.combat?.current?.round;
    const woundsEnabled = utils.setting(CONSTANTS.SETTINGS.ENABLE_WOUNDS);
    if (Number.isInteger(currentCombat) && woundsEnabled && actor.type === "character" && update.data?.attributes?.hp) {
      logger.debug("Checking wound threshold");
      const removedHitPoints = actor.data.data.attributes.hp.value - update.data.attributes.hp.value;
      const woundThreshold = 12 + actor.data.data.abilities.con.mod;
      logger.debug(`Actor ${actor.name} has ${removedHitPoints} removed hit points and a wound threshold of ${woundThreshold}.`);
      if (removedHitPoints >= woundThreshold) {
        logger.debug(`${actor.name} has suffered a wound risk.`);
        const flags = utils.getFlags(actor);
        flags.woundRisks += 1;
        let content = `${actor.name} gained a Wound Risk.<br> Their total Wound Risks are ${flags.woundRisks}.`;

        if (removedHitPoints >= (woundThreshold * 2)) {
          logger.debug(`${actor.name} has suffered an open wound.`);
          flags.openWounds.combat += 1;
          flags.openWounds.total += 1;
          content += `<br> ${actor.name} has suffered an Open Wound. Their Open Wounds this combat are ${flags.openWounds.combat}.`;
          content += `<br> Their current total Open Wounds are ${flags.openWounds.total}.`;
          content += `<br> They take an injury token for this damage type.`;
          // TODO: handle injury token addition - pop up or chat diaglog?
        }

        utils.setFlags(actor, flags);
        ChatMessage.create({ content });
        utils.wounds.openWoundCheck(actor, flags);
        console.warn("flags", flags);

      }
    }

    resolve(actor);

  });
}


export function registerCharacterHooks() {
  if (utils.isFirstGM()) {
    Hooks.on("preUpdateActor", preUpdateActorHook);
  }
}
