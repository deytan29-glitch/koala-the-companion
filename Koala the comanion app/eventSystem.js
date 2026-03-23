// ===== EVENT SYSTEM =====
// Random events based on time, mood, owned items, streak, health, and bond.
// Expanded with rare events, recovery events, and combo moments.

import { state, save } from './state.js';
import { getToD } from './environmentSystem.js';
import { getModifiers } from './modifierSystem.js';
import { addXP } from './xpSystem.js';
import { addBond } from './bondSystem.js';
import { emojiSVG } from './emojiSVG.js';

const MAX_DAILY_EVENTS      = 6;
const MAX_DAILY_EVENT_COINS = 35;

const EVENTS = [
  // \u{2500}\u{2500} Common \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'peaceful_moment', weight: 3, condition: () => true,
    message: 'Koala is enjoying a peaceful moment.', emoji: emojiSVG('sparkles',22),
    effect: s => { s.energy = Math.min(100, (s.energy || 0) + 2); return '+2 energy'; },
  },
  {
    id: 'morning_energy', weight: 2, condition: () => getToD() === 'morning',
    message: 'Fresh morning energy!', emoji: emojiSVG('sun',22),
    effect: s => { s.energy = Math.min(100, (s.energy || 0) + 3); return '+3 energy'; },
  },
  {
    id: 'feeling_tired', weight: 2, condition: () => (state.energy || 0) < 30,
    message: 'Koala is feeling tired...', emoji: emojiSVG('tired',22),
    effect: () => null,
  },

  // \u{2500}\u{2500} Item-gated \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'cat_gift', weight: 2, condition: () => state.ownedItems.includes('cat'),
    message: 'The cat is purring happily!', emoji: emojiSVG('cat',22),
    effect: s => { s.health = Math.min(100, (s.health || 0) + 3); return '+3 health'; },
  },
  {
    id: 'bookshelf_wisdom', weight: 2, condition: () => state.ownedItems.includes('shelf'),
    message: 'Koala read something inspiring!', emoji: emojiSVG('books',22),
    effect: s => { s.energy = Math.min(100, (s.energy || 0) + 5); return '+5 energy'; },
  },
  {
    id: 'fireplace_comfort', weight: 2,
    condition: () => state.ownedItems.includes('fireplace') && (getToD() === 'night' || getToD() === 'evening'),
    message: 'The fireplace is extra cozy tonight!', emoji: emojiSVG('fire',22),
    effect: s => { s.health = Math.min(100, (s.health || 0) + 3); return '+3 health'; },
  },
  {
    id: 'plant_bloom', weight: 1,
    condition: () => state.ownedItems.includes('plant') || state.ownedItems.includes('floorplant'),
    message: 'A plant bloomed!', emoji: emojiSVG('blossom',22),
    effect: s => { s.health = Math.min(100, (s.health || 0) + 2); return '+2 health'; },
  },

  // \u{2500}\u{2500} Streak-gated \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'streak_bonus', weight: 2, condition: () => (state.streak || 0) >= 5,
    message: 'Your streak is fueling positive vibes!', emoji: emojiSVG('fire',22),
    effect: s => { s.energy = Math.min(100, (s.energy || 0) + 5); return '+5 energy'; },
  },
  {
    id: 'streak_shield', weight: 1, condition: () => (state.streak || 0) >= 7,
    message: 'Your streak feels unbreakable today.', emoji: emojiSVG('shield',22),
    effect: s => { s.energy = Math.min(100, (s.energy || 0) + 4); return '+4 energy'; },
  },

  // \u{2500}\u{2500} Recovery (low health) \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'recovery_boost', weight: 3,
    condition: () => (state.health || 100) < 40,
    message: 'Your koala got some much-needed rest!', emoji: emojiSVG('pill',22),
    effect: s => { s.health = Math.min(100, (s.health || 0) + 5); return '+5 health'; },
  },

  // \u{2500}\u{2500} Focus-gated \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'focus_spark', weight: 2,
    condition: () => (state.dailyFocusSessions || 0) >= 2,
    message: 'Focus energy is flowing today!', emoji: emojiSVG('lightning',22),
    effect: s => { s.energy = Math.min(100, (s.energy || 0) + 6); return '+6 energy'; },
  },

  // \u{2500}\u{2500} Bonus coin day (rare) \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'lucky_day', weight: 1,
    condition: () => Math.random() < 0.3,
    message: 'It\'s a beautiful day!', emoji: emojiSVG('clover',22),
    effect: s => { s.health = Math.min(100, (s.health || 0) + 4); s.energy = Math.min(100, (s.energy || 0) + 4); return '+4 health, +4 energy'; },
  },

  // \u{2500}\u{2500} Extra playful (bond-gated) \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'extra_playful', weight: 2,
    condition: () => (state.bond || 0) >= 25 && (state.health || 100) >= 70,
    message: 'Koala is feeling extra playful today!', emoji: emojiSVG('party',22),
    effect: s => { s.energy = Math.min(100, (s.energy || 0) + 6); return '+6 energy'; },
  },

  // \u{2500}\u{2500} Rare gem \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'rare_gem', weight: 1,
    condition: () => (state.xp || 0) >= 500 && Math.random() < 0.2,
    message: 'You found something special!', emoji: emojiSVG('gem',22),
    effect: s => { s.health = Math.min(100, (s.health || 0) + 8); s.energy = Math.min(100, (s.energy || 0) + 8); return '+8 health, +8 energy'; },
  },

  // \u{2500}\u{2500} Weather bonus \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
  {
    id: 'cozy_weather', weight: 2,
    condition: () => state.ownedItems.includes('weather') && state.ownedItems.includes('curtains'),
    message: 'Cozy day with the curtains drawn!', emoji: emojiSVG('rain',22),
    effect: s => { s.health = Math.min(100, (s.health || 0) + 2); s.energy = Math.min(100, (s.energy || 0) + 2); return '+2 health, +2 energy'; },
  },
];

export function tryRandomEvent() {
  const today = new Date().toDateString();

  if (state.dailyEventDate !== today) {
    state.dailyEventCount = 0;
    state.dailyEventCoins = 0;
    state.dailyEventDate  = today;
  }

  if ((state.dailyEventCount || 0) >= MAX_DAILY_EVENTS) return null;

  const eligible = EVENTS.filter(e => e.condition());
  if (!eligible.length) return null;

  const totalWeight = eligible.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  let selected = eligible[0];
  for (const e of eligible) {
    roll -= e.weight;
    if (roll <= 0) { selected = e; break; }
  }

  let effectMsg = null;
  if (selected.effect) {
    const coinsBefore = state.coins;
    effectMsg = selected.effect(state);
    const coinsGained = state.coins - coinsBefore;

    if (coinsGained > 0 && (state.dailyEventCoins || 0) + coinsGained > MAX_DAILY_EVENT_COINS) {
      state.coins = coinsBefore;
      return null;
    }
    state.dailyEventCoins = (state.dailyEventCoins || 0) + coinsGained;
  }

  state.dailyEventCount = (state.dailyEventCount || 0) + 1;

  // XP and bond from positive events
  if (effectMsg) {
    addXP(5);
    addBond(0.3);
  }

  save();

  return { id: selected.id, message: selected.message, emoji: selected.emoji, effectMsg };
}

export function showEventToast(event) {
  if (!event) return;
  const toast = document.createElement('div');
  toast.className = 'event-toast';
  toast.innerHTML = `
    <span class="event-emoji">${event.emoji}</span>
    <div class="event-content">
      <div class="event-msg">${event.message}</div>
      ${event.effectMsg ? `<div class="event-effect">${event.effectMsg}</div>` : ''}
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
