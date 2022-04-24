import CONSTANTS from "../constants.js";
import utils from "../utils.js";

export class SettingsViewer extends FormApplication {

  constructor(options, actor) {
    super(options);
    this.actor = game.actors.get(actor.id ? actor.id : actor._id);
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = game.i18n.localize(`${CONSTANTS.MODULE_NAME}.Dialogs.CharacterSettings.Title`);
    options.template = `${CONSTANTS.PATH}/templates/settings-viewer.hbs`;
    options.classes = ["gng", "sheet"];
    options.width = 300;
    return options;
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    // console.warn(this);

    const flags = utils.getFlags(this.actor);

    const tokens = [];
    for (const [key, value] of Object.entries(flags.injury.tokens)) {
      tokens.push({
        name: CONFIG.DND5E.damageTypes[key],
        value,
        type: key,
      });
    }

    return {
      flags,
      injuryTokens: tokens,
      injuryList: flags.injury.list.join("\n"),
      actor: this.actor,
    };
  }

  get id() {
    const actor = this.object;
    let id = `ddb-actor-${actor.id}`;
    return id;
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) {
    event.preventDefault();

    const flags = utils.getFlags(this.actor);

    flags.woundRisks = parseInt(formData["wound-risks"]);
    flags.openWounds.combat = parseInt(formData["open-wounds-combat"]);
    flags.openWounds.total = parseInt(formData["open-wounds-total"]);
    flags.bleeding = formData["bleeding"];

    Object.keys(CONFIG.DND5E.damageTypes).forEach((type) => {
      flags.injury.tokens[type] = parseInt(formData[`token-${type}`]);
    });

    flags.injury.list = formData["injuries"].split("\n");

    await utils.setFlags(this.actor, flags);

  }
}
