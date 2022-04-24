import utils from "../utils.js";
import logger from "../logger.js";
import CONSTANTS from "../constants.js";


function isTurnChange(combat, changed) {
  const isCombat = !!combat.started && (("turn" in changed) || ('round' in changed));
  const hasCombatants = (combat.data.combatants.size ?? 0) !== 0;
  const firstTurn = (((changed.turn ?? undefined) === 0) && (changed.round ?? 0) === 1);

  return isCombat && hasCombatants && !firstTurn;
}

async function confirmationRoll(actor) {
  const dc = 12 + (utils.getFlags(actor).woundRisks * 2);
  const data = {
    name: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.Chat.ConfirmationRoll`),
    type: "feat",
    data: {
      "activation.type": "special",
      "duration.units": "inst",
      "target.type": "self",
      "range.units": "self",
      "actionType": "save",
      save: {
        "ability": "con",
        "dc": dc,
        "scaling": "flat"
      },
    },
  };

  const saveItem = new CONFIG.Item.documentClass(data, { parent: actor });
  const options = { showFullCard: false, createWorkflow: true, configureDialog: true };
  const result = await MidiQOL.completeItemRoll(saveItem, options);

  return result;
}


async function updateCombat(combat, changed) {
  if (!isTurnChange(combat, changed)) return;

  if (utils.setting(CONSTANTS.SETTINGS.ENABLE_WOUNDS)) {
    const charactersToCheck = combat.data.combatants.filter((c) => c.actor.type === "character");

    for (let i = 0; i < charactersToCheck.length; i++) {
      const character = charactersToCheck[i];
      const flags = utils.getFlags(character.actor);
      if (flags.woundRisks > 0) {
        // eslint-disable-next-line no-await-in-loop
        const result = await confirmationRoll(character.actor);

        if (result.failure) {
          flags.openWounds.combat += 1;
          flags.openWounds.total += 1;
          flags.bleeding = true;

          // eslint-disable-next-line max-depth
          if ((result.item.data.data.save.dc - result.saveResults[0]._total) >= 10) {
            flags.injury.tokens.bleeding += 1;
          }
        }

        flags.woundRisks = 0;
        // eslint-disable-next-line no-await-in-loop
        await utils.setFlags(character.actor, flags);
      }

      if (combat.current.combatantId === character.id && flags.bleeding) {
        logger.debug(`Bleeding check for ${character.actor.name}`);
        const i18nData = { actorName: character.actor.name, number: flags.openWounds.combat };
        const content = game.i18n.format(`${CONSTANTS.MODULE_NAME}.Chat.Bleeding.Damage`, i18nData);
        logger.info(content);
        ChatMessage.create({ content });
        let bleedingData = {
          _id: character.actor.id,
          "data.attributes.hp.value": character.actor.data.data.attributes.hp.value - flags.openWounds.combat,
        };
        setProperty(bleedingData, `flags.${CONSTANTS.FLAG_NAME}.bleedingUpdate`, `${game.combat.id}${game.combat.current.round}${game.combat.current.turn}`);
        // eslint-disable-next-line no-await-in-loop
        await character.actor.update(bleedingData);
      }
    }
  }
}

function injuryTokenResolution(actor, flags) {
  let contentBody = "";
  for (const [key, value] of Object.entries(flags.injury.tokens)) {
    const tokenValue = Number.isInteger(value) ? value : parseInt;
    let tableName = "";
    if (Number.isInteger(tokenValue) && tokenValue > 0) {
      switch (tokenValue) {
        case 1:
          tableName = `@Compendium[${CONSTANTS.MODULE_NAME}.gritnglory-tables.Severity 1: One Injury Token]{Severity 1}`;
          break;
        case 2:
          tableName = `@Compendium[${CONSTANTS.MODULE_NAME}.gritnglory-tables.Severity 2: Two Injury Tokens]{Severity 2}`;
          break;
        case 3:
          tableName = `@Compendium[${CONSTANTS.MODULE_NAME}.gritnglory-tables.Severity 3: Three Injury Tokens]{Severity 3}`;
          break;
        default:
          tableName = `@Compendium[${CONSTANTS.MODULE_NAME}.gritnglory-tables.Severity 4: Four or more Injury Tokens]{Severity 4}`;
          break;
      }
      const i18nData = { type: CONFIG.DND5E.damageTypes[key], tableName: tableName, number: tokenValue };
      const i18nResult = game.i18n.format(`${CONSTANTS.MODULE_NAME}.Chat.Injury.TokenResolutionType`, i18nData);
      contentBody += `<li> ${i18nResult}</li>`;
    }
    flags.injury.tokens[key] = 0;
  }
  if (contentBody !== "") {
    const contentHeading = game.i18n.format(`${CONSTANTS.MODULE_NAME}.Chat.Injury.TokenResolutionHeading`, { actorName: actor.name });
    const content = `<h3>${contentHeading}</h3><p><ul>${contentBody}</ul></p>`;
    logger.debug(content);
    ChatMessage.create({ content });
  }

  return flags;
}

async function deleteCombat(combat) {
  if (utils.setting(CONSTANTS.SETTINGS.ENABLE_WOUNDS)) {
    const charactersToCheck = combat.data.combatants.filter((c) => c.actor.type === "character");
    for (let i = 0; i < charactersToCheck.length; i++) {
      const character = charactersToCheck[i];
      let flags = utils.getFlags(character.actor);
      flags.woundRisks = 0;
      flags.openWounds.combat = 0;
      flags = injuryTokenResolution(character.actor, flags);
      // eslint-disable-next-line no-await-in-loop
      await utils.setFlags(character.actor, flags);
    }
  }

}


export function registerTrackerHooks() {
  if (utils.isFirstGM()) {
    Hooks.on('updateCombat', updateCombat);
    Hooks.on('deleteCombat', deleteCombat);

  }
}
