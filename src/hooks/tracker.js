const MINIMUM_OPEN_WOUNDS = 3;


function isTurnChange(combat, changed) {
  const isCombat = !!combat.started && (("turn" in changed) || ('round' in changed));
  const hasCombatants = (combat.data.combatants.size ?? 0) !== 0;
  const firstTurn = (((changed.turn ?? undefined) === 0) && (changed.round ?? 0) === 1);

  return isCombat && hasCombatants && !firstTurn;
}


function updateCombat(combat, changed) {
  if (!isTurnChange(combat, changed)) return;

  const previousId = combat.previous?.combatantId;

  /* run the leg action helper dialog if enabled */
  if (MODULE.setting('legendaryActionHelper')) {

    /* Collect legendary combatants (but not the combatant whose turn just ended) */
    let legendaryCombatants = combat.combatants.filter( combatant => combatant.getFlag(MODULE.data.name, 'hasLegendary') && combatant.id != previousId );

    /* only prompt for actions from alive creatures with leg acts remaining */
    legendaryCombatants = legendaryCombatants.filter( combatant => getProperty(combatant.actor, 'data.data.resources.legact.value') ?? 0 > 0 );
    legendaryCombatants = legendaryCombatants.filter( combatant => getProperty(combatant.actor, 'data.data.attributes.hp.value') ?? 0 > 0 );

    /* send list of combantants to the action dialog subclass */
    if (legendaryCombatants.length > 0) {
      LegendaryActionManagement.showLegendaryActions(legendaryCombatants);
    }

  }

  /* recharge the legendary actions, if enabled */
  if (MODULE.setting('legendaryActionRecharge')) {

    /* once the dialog for the "in-between" turn has been rendered, recharge legendary actions
     * for the creature whose turn just ended. This is not entirely RAW, but due to order
     * of operations it must be done 'late'. Since a creature cannot use a legendary
     * action at the end of its own turn, nor on its own turn, recharging at end of turn
     * rather than beginning of turn is functionally equivalent. */
    if (previousId) {

      /* does the previous combatant have legendary actions? */
      const previousCombatant = combat.combatants.get(previousId);
      if(!!previousCombatant?.getFlag(MODULE.data.name, 'hasLegendary')) {
        LegendaryActionManagement.rechargeLegendaryActions(previousCombatant);
      }
    }

  }
}

export function trackerHooks() {
  Hooks.on('updateCombat', updateCombat);
}
