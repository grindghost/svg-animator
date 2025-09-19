import { App } from "./app.js";
import { Selection } from "./selection.js";

export function initViewer(containerId) {
  const viewer = document.getElementById(containerId);

  viewer.addEventListener("click", e => {
    if (e.target.id) {
      const selection = new Selection(e.target);
      App.setSelection(selection); // ✅ overlays new system
    }
  });
}
