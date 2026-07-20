const NS = "spotify_analyzer:";

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(NS + key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(NS + key);
  },
  clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => localStorage.removeItem(k));
  },
};
