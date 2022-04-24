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


async function preUpdateActorHook(actor, update) {
  // is pc and is a hp update?
  if (actor.type !== "character" || !update.data?.attributes?.hp) return;
  // are we in combat?
  if (!Number.isInteger(game.combat?.current?.round)) return;
  // is wounds enabled?
  const woundsEnabled = utils.setting(CONSTANTS.SETTINGS.ENABLE_WOUNDS);
  if (!woundsEnabled) return;

  // is bleeding damage?
  const bleedingFlag = update.flags && update.flags[CONSTANTS.FLAG_NAME]?.bleedingUpdate;
  const bleedingUpdateValue = `${game.combat.id}${game.combat.current.round}${game.combat.current.turn}`;
  const isBleedingDamage = bleedingFlag === bleedingUpdateValue;
  if (isBleedingDamage) return;

  const conMod = actor.data.data.abilities.con.mod;
  const level = actor.data.data.details.level;

  // token check for unconscious
  const unconsciousInjuryToken = update.data.attributes.hp.value <= 0;
  if (unconsciousInjuryToken) {
    const content = `${actor.name} is unconscious and takes a injury token`;
    logger.debug(content);
  }

  logger.debug("Checking wound threshold");
  const removedHitPoints = actor.data.data.attributes.hp.value - update.data.attributes.hp.value;
  const woundThreshold = 12 + actor.data.data.abilities.con.mod;
  logger.debug(`Actor ${actor.name} has ${removedHitPoints} removed hit points and a wound threshold of ${woundThreshold}.`);
  if (removedHitPoints >= woundThreshold) {
    logger.debug(`${actor.name} has suffered a wound risk.`);
    const flags = utils.getFlags(actor);
    flags.woundRisks += 1;

    const i18nData = { actorName: actor.name, number: flags.woundRisks };
    let content = game.i18n.format(`${CONSTANTS.MODULE_NAME}.Chat.Wounds.GainRisk`, i18nData);

    if (removedHitPoints >= (woundThreshold * 2)) {
      logger.debug(`${actor.name} has suffered an open wound.`);
      flags.openWounds.combat += 1;
      flags.openWounds.total += 1;

      content += game.i18n.format(`${CONSTANTS.MODULE_NAME}.Chat.Wounds.GainWound`, { actorName: actor.name, number: flags.openWounds.combat });
      content += "<br> ";
      content += game.i18n.format(`${CONSTANTS.MODULE_NAME}.Chat.Wounds.TotalWounds`, { number: flags.openWounds.total });

      // check for injury tokens - if damage comes via midi we know a lot of things about the damage
      const newTokens = await utils.injury.tokenCheck(actor, actor.data.data.traits.di.value, update);
      content += "<br> ";
      if (newTokens.length > 0) {
        const damageTypes = Object.keys(newTokens).join(", ");
        content += game.i18n.format(`${CONSTANTS.MODULE_NAME}.Chat.Injury.TokensKnown`, { damageTypes });
      } else {
        content += game.i18n.localize(`${CONSTANTS.MODULE_NAME}.Chat.Injury.TokensUnknown`);
      }
      flags.injury.tokens = [flags.injury.tokens, newTokens].reduce((totals, current) => {
        for (const [key, value] of Object.entries(current)) {
          if (!totals[key]) {
            totals[key] = 0;
          }
          totals[key] += value;
        }
        return totals;
      }, {});
    }

    utils.setFlags(actor, flags);
    ChatMessage.create({ content });
    // Check for Open wounds - maybe we are unconcious?
    utils.wounds.openWoundCheck(actor, conMod, level, flags);
  }

}

export function registerCharacterHooks() {
  Hooks.on("preUpdateActor", preUpdateActorHook);
}
