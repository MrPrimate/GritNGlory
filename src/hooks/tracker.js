import utils from "../utils.js";
import CONSTANTS from "../constants.js";


function isTurnChange(combat, changed) {
  const isCombat = !!combat.started && (("turn" in changed) || ('round' in changed));
  const hasCombatants = (combat.data.combatants.size ?? 0) !== 0;
  const firstTurn = (((changed.turn ?? undefined) === 0) && (changed.round ?? 0) === 1);

  return isCombat && hasCombatants && !firstTurn;
}

async function confirmationRoll(actor) {
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
        "dc": 12 + utils.getFlags(actor).woundRisks,
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
  if (!isTurnChange(combat, changed)) return;

  if (utils.setting(CONSTANTS.SETTINGS.ENABLE_WOUNDS)) {
    const charactersToCheck = combat.data.combatants.filter((c) =>
      c.actor.type === "character" && utils.getFlags(c.actor).woundRisks > 0
    );

    // confirmation roll
    for (let i = 0; i < charactersToCheck.length; i++) {
      const character = charactersToCheck[i];
      const flags = utils.getFlags(character.actor);
      // eslint-disable-next-line no-await-in-loop
      const result = await confirmationRoll(character.actor);

      if (result.failure) {
        flags.openWounds.combat += 1;
        flags.openWounds.total += 1;
        flags.bleeding = true;
      }

      flags.woundRisks = 0;
      // eslint-disable-next-line no-await-in-loop
      await utils.setFlags(character.actor, flags);
    }

    // TODO: bleeding check/damage


    flags.turnDamage = [];

  }
}


function deleteCombat(combat, changed) {
  // TODO: injuries

}


export function registerTrackerHooks() {
  if (utils.isFirstGM()) {
    Hooks.on('updateCombat', updateCombat);
    Hooks.on('deleteCombat', deleteCombat);

  }
}
