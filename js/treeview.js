import { App } from "./app.js";
import { Selection } from "./selection.js";

export function initTree(containerId) {
  const tree = document.getElementById(containerId);

  tree.addEventListener("click", e => {
    if (e.target.dataset.id) {
      const el = document.getElementById(e.target.dataset.id);
      if (el) {
        const selection = new Selection(el);
        App.setSelection(selection); // ✅ overlays new system
      }
    }
  });
}
