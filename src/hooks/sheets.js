import { SettingsViewer } from "../lib/SettingsViewer.js";

export function registerSheetButton() {

  /**
   * Character sheets
   */
  const pcSheetNames = Object.values(CONFIG.Actor.sheetClasses.character)
    .map((sheetClass) => sheetClass.cls)
    .map((sheet) => sheet.name);

  pcSheetNames.forEach((sheetName) => {
    Hooks.on("render" + sheetName, (app, html, data) => {
      // only for GMs or the owner of this character
      if (!data.owner || !data.actor) return;

      const button = $(`<a class="gng-open" title="Grit & Glory"><i class="fas fa-exclamation"></i> G&G</a>`);

      button.click(() => {
        const settings = new SettingsViewer(SettingsViewer.defaultOptions, data.actor);
        settings.render(true);
      });

      html.closest('.app').find('.gng-open').remove();
      let titleElement = html.closest('.app').find('.window-title');
      if (!app._minimized) button.insertAfter(titleElement);
    });
  });

}
