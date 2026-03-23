// ===== STORAGE SYSTEM =====
// Abstracts localStorage read/write with error handling

export function loadState(key, defaults) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return Object.assign({}, defaults, JSON.parse(stored));
  } catch (e) {
    console.warn('[Storage] Failed to load state:', e);
  }
  return Object.assign({}, defaults);
}

export function saveState(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[Storage] Failed to save state:', e);
  }
}

export function clearState(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}
