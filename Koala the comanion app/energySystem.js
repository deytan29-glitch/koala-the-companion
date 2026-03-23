// ===== ENERGY SYSTEM =====
// Manages energy (0-100). Gained from focus sessions, interactions.
// Used for progression unlocks. Persisted in state.

import { state, save } from './state.js';
import { calculateEnergyGain } from './modifierSystem.js';

// Caps
const MAX_ENERGY = 100;
const MAX_DAILY_ENERGY_GAINS = 80; // diminishing returns cap per day

export function getEnergy() {
  return Math.max(0, Math.min(MAX_ENERGY, state.energy || 0));
}

// Add energy from a focus session (base 10-20 depending on duration)
export function addFocusEnergy(sessionMinutes) {
  const base = Math.min(20, Math.max(10, Math.round(sessionMinutes / 2.5)));
  const gained = calculateEnergyGain(base);
  return _addEnergy(gained, 'focus');
}

// Add energy from interactions (petting, etc.) \u{2014} small gain
export function addInteractionEnergy() {
  const gained = calculateEnergyGain(1);
  return _addEnergy(gained, 'interaction');
}

// Add energy from check-in
export function addCheckinEnergy(win) {
  const base = win ? 15 : 5;
  const gained = calculateEnergyGain(base);
  return _addEnergy(gained, 'checkin');
}

// Internal: add energy with daily cap tracking
function _addEnergy(amount, source) {
  const today = new Date().toDateString();
  if (state.energyGainedToday_date !== today) {
    state.energyGainedToday = 0;
    state.energyGainedToday_date = today;
  }

  // Diminishing returns after daily cap
  const remaining = Math.max(0, MAX_DAILY_ENERGY_GAINS - (state.energyGainedToday || 0));
  const effective = Math.min(amount, remaining);

  if (effective <= 0) return 0;

  state.energy = Math.min(MAX_ENERGY, (state.energy || 0) + effective);
  state.energyGainedToday = (state.energyGainedToday || 0) + effective;
  save();

  return effective;
}

// Passive energy drain overnight (called from offline progression)
export function applyOfflineEnergyDrain(hours) {
  // Lose ~15 energy per hour offline (fast — needs feeding!)
  const drain = Math.round(hours * 15);
  state.energy = Math.max(0, (state.energy || 0) - drain);
  if (state.energy <= 0) state.koalaSick = true;
}

// Real-time active drain (called every 12 min from app.js)
// 3 per 12 min = 15/hr → 100 energy lasts ~6.7 hrs
export function activeEnergyDrain() {
  const prev = state.energy || 0;
  if (prev <= 0) {
    if (!state.koalaSick) { state.koalaSick = true; save(); }
    return;
  }
  state.energy = Math.max(0, prev - 3);
  if (state.energy <= 0) state.koalaSick = true;
  save();
}

// Update energy bar UI
export function updateEnergyUI() {
  const energy = getEnergy();
  const fill = document.getElementById('energyBarFill');
  const pct = document.getElementById('energyPct');

  if (fill) {
    fill.style.width = energy + '%';
    fill.classList.remove('low', 'mid');
    if (energy <= 20) fill.classList.add('low');
    else if (energy <= 50) fill.classList.add('mid');
  }
  if (pct) {
    pct.textContent = energy + '%';
    pct.classList.remove('low', 'mid');
    if (energy <= 20) pct.classList.add('low');
    else if (energy <= 50) pct.classList.add('mid');
  }
}
