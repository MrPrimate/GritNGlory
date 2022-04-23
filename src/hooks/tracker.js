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
  const dc = 12 + utils.getFlags(actor).woundRisks;
  const data = {
    name: "Confirmation Roll",
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
  // const item = new Item(data, { temp: true });

  const saveItem = new CONFIG.Item.documentClass(data, { parent: actor });
  const options = { showFullCard: false, createWorkflow: true, configureDialog: true };
  const result = await MidiQOL.completeItemRoll(saveItem, options);

  // const failedSaves = [...result.failedSaves];
  // if (failedSaves.length > 0) {
  //   await game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: failedSaves[0].document.uuid });
  // }
  console.warn("result", result);
  return result;
}


async function updateCombat(combat, changed) {
  console.warn("updateCombat", combat, changed);
  if (!isTurnChange(combat, changed)) return;

  if (utils.setting(CONSTANTS.SETTINGS.ENABLE_WOUNDS)) {
    const charactersToCheck = combat.data.combatants.filter((c) => c.actor.type === "character");

    for (let i = 0; i < charactersToCheck.length; i++) {
      const character = charactersToCheck[i];
      const flags = utils.getFlags(character.actor);
      if (flags.woundRisks > 0) {
        // eslint-disable-next-line no-await-in-loop
        const result = await confirmationRoll(character.actor);

        console.warn(result);
        if (result.failure) {
          flags.openWounds.combat += 1;
          flags.openWounds.total += 1;
          flags.bleeding = true;
          // TODO: injury token (if failed confirmation roll by 10 or more)
        }

        flags.woundRisks = 0;
        // eslint-disable-next-line no-await-in-loop
        await utils.setFlags(character.actor, flags);
      }
      console.warn(`Bleeding check for ${character.actor.name}`);
      console.warn(flags)
      if (combat.current.combatantId === character.id && flags.bleeding) {
        const content = `${character.actor.name} has suffered ${flags.openWounds.combat} bleeding damage.`;
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


async function deleteCombat(combat, changed) {
  if (utils.setting(CONSTANTS.SETTINGS.ENABLE_WOUNDS)) {
    const charactersToCheck = combat.data.combatants.filter((c) => c.actor.type === "character");
    for (let i = 0; i < charactersToCheck.length; i++) {
      const character = charactersToCheck[i];
      const flags = utils.getFlags(character.actor);
      flags.woundRisks = 0;
      flags.openWounds.combat = 0;
      // eslint-disable-next-line no-await-in-loop
      await utils.setFlags(character.actor, flags);
    }
    // TODO: injuries
    // check injury tokens and present roll dialog
  }

}


export function registerTrackerHooks() {
  if (utils.isFirstGM()) {
    Hooks.on('updateCombat', updateCombat);
    Hooks.on('deleteCombat', deleteCombat);

  }
}
