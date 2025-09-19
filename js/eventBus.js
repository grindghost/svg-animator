export const EventBus = {
  events: {},
  subscribe(event, cb) {
    (this.events[event] = this.events[event] || []).push(cb);
  },
  publish(event, data) {
    console.log("[EventBus] publish:", event, data); // ✅ debug log
    (this.events[event] || []).forEach(cb => cb(data));
  }
};
