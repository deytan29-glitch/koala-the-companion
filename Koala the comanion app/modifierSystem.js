// ===== MODIFIER SYSTEM =====
// Central system to calculate health decay rate, energy gain multiplier,
// passive regen, and mood boosts. All items + systems feed into this.

import { state } from './state.js';
import { getToD } from './environmentSystem.js';

// ===== SUBSCRIPTION HELPER =====
function isSubscriptionActive() {
  if (!state.premium?.isSubscribed) return false;
  const exp = state.premium?.subscriptionExpiresAt;
  // expiresAt === 0 or null means no tracked expiry (sandbox / local test) — treat as active
  if (!exp || exp === 0) return true;
  return exp > Date.now();
}

// Bond level → tiered coin/XP multiplier bonus
function _bondBonus() {
  const bond = Math.min(100, Math.max(0, state.bond || 0));
  if (bond >= 95) return 0.30;
  if (bond >= 75) return 0.20;
  if (bond >= 50) return 0.12;
  if (bond >= 25) return 0.06;
  return 0;
}

// Item effect definitions
const ITEM_EFFECTS = {
  plant:      { decayReduction: 0.15, passiveRegen: 0 },
  succulent:  { decayReduction: 0.08, passiveRegen: 0 },
  floorplant: { decayReduction: 0.20, passiveRegen: 0 },
  lamp:       { energyBoost: 0.10, passiveRegen: 0 },
  nightlamp:  { energyBoost: 0.15, passiveRegen: 0 },
  rug:        { passiveRegen: 0.3, moodBoost: 0.05 },
  shelf:      { energyBoost: 0.05, moodBoost: 0.10 },
  frame:      { moodBoost: 0.08 },
  cat:        { randomRewardChance: 0.12, moodBoost: 0.10 },
  fireplace:  { moodBoost: 0.20, passiveRegen: 0.5, nightOnly: true },
  curtains:   { decayReduction: 0.05, moodBoost: 0.05 },
  sidetable:  { passiveRegen: 0.1 },
  couch:      { passiveRegen: 0.4, moodBoost: 0.08 },
  bed:        { passiveRegen: 0.6, moodBoost: 0.05 },
};

// Get all active modifiers based on owned items and time of day
export function getModifiers() {
  const tod = getToD();
  const isNight = tod === 'night' || tod === 'evening';

  let decayReduction = 0;    // % reduction in health decay (0-1)
  let energyMultiplier = 1;  // multiplier for energy gains
  let passiveRegen = 0;      // health regen per hour (passive)
  let moodBoost = 0;         // mood improvement factor
  let randomRewardChance = 0;

  (state.ownedItems || []).forEach(id => {
    const fx = ITEM_EFFECTS[id];
    if (!fx) return;
    if (fx.nightOnly && !isNight) return;

    if (fx.decayReduction)    decayReduction += fx.decayReduction;
    if (fx.energyBoost)       energyMultiplier += fx.energyBoost;
    if (fx.passiveRegen)      passiveRegen += fx.passiveRegen;
    if (fx.moodBoost)         moodBoost += fx.moodBoost;
    if (fx.randomRewardChance) randomRewardChance += fx.randomRewardChance;
  });

  // Cap decay reduction at 60%
  decayReduction = Math.min(decayReduction, 0.60);
  // Cap energy multiplier at 1.5x
  energyMultiplier = Math.min(energyMultiplier, 1.50);

  // Bond-based coin & XP bonus (stacks with premium)
  const bondBonus = _bondBonus();

  // Premium subscription boosts (1.5x coin & XP), plus bond bonus on top
  let coinMultiplier = 1.0 + bondBonus;
  let xpMultiplier = 1.0 + bondBonus;
  if (isSubscriptionActive()) {
    coinMultiplier += 0.5;
    xpMultiplier += 0.5;
  }

  return {
    decayReduction,
    energyMultiplier,
    passiveRegen,
    moodBoost,
    randomRewardChance,
    coinMultiplier,
    xpMultiplier,
  };
}

// Calculate health decay for missed days, factoring in item decay reduction
export function calculateHealthDecay(missedDays) {
  if (missedDays <= 0) return 0;
  const { decayReduction } = getModifiers();
  let totalDecay = 0;

  for (let d = 1; d <= missedDays; d++) {
    let dayDecay;
    if (d === 1)      dayDecay = 5;
    else if (d === 2) dayDecay = 10;
    else              dayDecay = 15;

    // Apply decay reduction from items
    dayDecay = dayDecay * (1 - decayReduction);
    totalDecay += dayDecay;
  }

  return Math.round(totalDecay);
}

// Calculate passive health regen for offline time (in hours)
export function calculatePassiveRegen(hours) {
  const { passiveRegen } = getModifiers();
  return Math.round(passiveRegen * hours);
}

// Calculate energy gain with multiplier
export function calculateEnergyGain(baseGain) {
  const { energyMultiplier } = getModifiers();
  return Math.round(baseGain * energyMultiplier);
}

// Get effective item info for shop display
export function getItemEffectDescription(itemId) {
  const fx = ITEM_EFFECTS[itemId];
  if (!fx) return '';

  const parts = [];
  if (fx.decayReduction)     parts.push(`-${Math.round(fx.decayReduction * 100)}% health decay`);
  if (fx.energyBoost)        parts.push(`+${Math.round(fx.energyBoost * 100)}% energy gain`);
  if (fx.passiveRegen)       parts.push(`+${fx.passiveRegen}/hr passive regen`);
  if (fx.moodBoost)          parts.push(`+mood boost`);
  if (fx.randomRewardChance) parts.push(`random coin rewards`);
  if (fx.nightOnly)          parts.push(`(night only)`);

  return parts.join(' \u{B7} ');
}

export { ITEM_EFFECTS, isSubscriptionActive };
