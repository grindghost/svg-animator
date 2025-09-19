import { EventBus } from "./eventBus.js";

export const App = {
  svgDoc: null,
  selection: null,

  setSVG(svgElement) {
    this.svgDoc = svgElement;
    console.log("[App] SVG loaded:", svgElement); // ✅ debug log
    EventBus.publish("app:svgLoaded", { svg: svgElement });
  },

  setSelection(selection) {
    this.selection = selection;
    console.log("[App] Selection set:", selection); // ✅ debug log
    EventBus.publish("app:selectionChanged", selection);
  },

  clearSelection() {
    this.selection = null;
    console.log("[App] Selection cleared"); // ✅ debug log
    EventBus.publish("app:selectionCleared");
  }
};
