// Global Selection class - non-module version for early loading
class Selection {
  constructor(element) {
    this.el = element;
    this.id = element.id || null;
    this.type = element.tagName;
  }

  isGroup() {
    return this.type === "g";
  }

  canAnimate() {
    return !this.isGroup();
  }
}

// Make it available globally
window.Selection = Selection;
