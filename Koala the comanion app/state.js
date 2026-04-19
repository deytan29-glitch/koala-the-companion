// ===== STATE MANAGER =====
// Shared application state persisted to localStorage

import { loadState, saveState } from './storage.js';
import { calculateHealthDecay, calculatePassiveRegen } from './modifierSystem.js';

export const STATE_KEY = 'koalaCalm8';

export const DEFAULTS = {
  coins: 40,
  streak: 0,
  streakPaused: false,        // Premium: streak paused instead of broken on missed day
  goalHours: 2,
  goalMinutes: 30,
  checkins: [],           // Array of check-in records
  ownedItems: [],         // Array of owned shop item IDs
  todayCheckedIn: null,   // DateString of last check-in date
  goalLog: [],            // History of goal changes
  usedBonuses: [],        // Focus bonuses used today [{id, date}]
  extraMinutes: 0,        // Bonus minutes added to today's goal
  focusSessions: 0,       // Total focus sessions completed
  longestStreak: 0,       // All-time longest streak
  health: 100,            // Koala health 0-100
  lastHealthDate: null,   // DateString of last health update
  settings: {
    notifications: false,
    weatherLocation: 'phoenix',
  },

  // === NEW FIELDS ===
  energy: 50,                   // Energy 0-100
  energyGainedToday: 0,        // Daily energy gain tracking
  energyGainedToday_date: null, // Date for daily reset
  mood: 'happy',                // Current mood
  lastDayResult: null,          // 'win' or 'fail' from yesterday
  lastActiveTimestamp: null,    // For offline progression + boredom
  consecutiveMissedDays: 0,    // For escalating health decay
  dailyEventCount: 0,          // Events triggered today
  dailyEventCoins: 0,          // Coins from events today
  dailyEventDate: null,        // Date for daily event reset
  dailyFocusSessions: 0,       // Focus sessions today
  dailyFocusCoins: 0,          // Focus coins today
  focusSessionDate: null,       // Date for daily focus reset
  dailyRewardCoins: 0,         // Total coins earned today (all sources)
  dailyRewardDate: null,       // Date for daily reward reset
  lastReminderTimestamp: 0,    // Last notification time
  offlineMessage: null,         // Message shown on return from offline

  // === PROGRESSION ===
  xp: 0,                        // Total XP earned
  bond: 0,                      // Bond with koala 0-100
  unlockedThemes: ['default'],  // Unlocked room themes
  currentTheme: 'default',

  // === FOCUS STREAK ===
  focusDayStreak: 0,            // Consecutive days with at least 1 focus session
  lastFocusDayDate: null,       // Date of last focus session (for streak check)

  // === PERSONALITY ===
  personalityTrait: 'balanced', // Cached personality trait

  // === SICK STATE ===
  koalaSick: false,     // True when energy hits 0 — disables most features

  // === FEEDING ===
  leaves: 0,            // Eucalyptus leaf sets owned (max 15)
  lastFedDate: null,    // Date of last feeding session
  todayFeedCount: 0,    // Times fed today (goal: 2)

  // === PREMIUM ===
  premium: {
    isSubscribed: false,            // Is user currently subscribed?
    subscriptionExpiresAt: null,    // Timestamp when subscription expires
    subscriptionRenewsAt: null,     // Timestamp of next renewal
    productId: 'com.dylaneyan.koalacalm.premium.monthly',
  },
  selectedAnimal: 'koala',          // 'koala' | 'bear' | 'bunny' | 'dog'

  // === ADVENTURE ===
  adventureStart: 0,                // Timestamp when adventure started (0 = inactive)
  adventureDuration: 12,            // hours (1 | 2 | 4 | 8 | 12)

  // === ROOMS ===
  currentRoom: 'living',            // 'living' | 'kitchen' | 'bedroom'
  scenery: 'default',               // 'default' | 'desert' | 'snow' | 'beach' | 'city'

  // === ONBOARDING ===
  onboardingComplete: false,        // True after first-launch flow is finished
  onboardingData: null,             // { referral, hoursPerDay, age, completedAt }
};

export const state = loadState(STATE_KEY, DEFAULTS);

// === DATA MIGRATION ===
// Ensure all defaults are present (for upgrades from older versions)
Object.keys(DEFAULTS).forEach(key => {
  if (state[key] === undefined) {
    if (typeof DEFAULTS[key] === 'object' && DEFAULTS[key] !== null && !Array.isArray(DEFAULTS[key])) {
      state[key] = Object.assign({}, DEFAULTS[key]);
    } else {
      state[key] = DEFAULTS[key];
    }
  }
});
if (!state.settings) state.settings = Object.assign({}, DEFAULTS.settings);

// Migrate: if energy was never set, give starter energy
if (state.energy === undefined || state.energy === null) state.energy = 50;

// ONE-TIME TEST GRANT: 999 coins (runs once, never again)
if (!state._testCoinBoost999) {
  state.coins = 999;
  state._testCoinBoost999 = true;
}

// MIGRATION: Ensure sofa is always owned (it's the free starter item)
if (!state.ownedItems.includes('sofa')) {
  state.ownedItems.unshift('sofa');
}

// MIGRATION: Unlock all items for testing
if (!state._allItemsUnlocked) {
  const allIds = ['sofa','sidetable','succulent','plant','rug','lamp','frame','shelf','floorplant','cat','curtains','nightlamp','weather','fireplace','premium_gold_bed','premium_fireplace_deluxe','premium_crystal_lamp'];
  allIds.forEach(id => { if (!state.ownedItems.includes(id)) state.ownedItems.push(id); });
  state._allItemsUnlocked = true;
  if (!state.premium || !state.premium.isSubscribed) {
    state.premium = { isSubscribed:true, subscriptionExpiresAt: Date.now() + 365*24*60*60*1000, subscriptionRenewsAt: Date.now() + 30*24*60*60*1000, productId:'com.dylaneyan.koalacalm.premium.monthly' };
  }
}

export function save() {
  // Update longest streak when saving
  if (state.streak > (state.longestStreak || 0)) {
    state.longestStreak = state.streak;
  }
  // Track last active
  state.lastActiveTimestamp = Date.now();
  saveState(STATE_KEY, state);
}

// Check if today's check-in is already complete
export function isTodayDone() {
  return state.todayCheckedIn === new Date().toDateString();
}

// Reset daily state if it's a new day
export function checkDayReset() {
  const today = new Date().toDateString();
  if (state.todayCheckedIn && state.todayCheckedIn !== today) {
    // Calculate missed days for health decay using improved system
    const lastDate = state.lastHealthDate ? new Date(state.lastHealthDate) : null;
    if (lastDate) {
      const now = new Date();
      now.setHours(0,0,0,0);
      const last = new Date(lastDate);
      last.setHours(0,0,0,0);
      const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        const missedDays = diffDays - 1;
        // Use improved escalating decay with item modifiers
        const decay = calculateHealthDecay(missedDays);
        state.health = Math.max(0, (state.health || 100) - decay);
        state.consecutiveMissedDays = (state.consecutiveMissedDays || 0) + missedDays;
      } else {
        state.consecutiveMissedDays = 0;
      }
    }
    state.lastHealthDate = today;
    state.todayCheckedIn = null;
    state.extraMinutes = 0;
    state.usedBonuses = (state.usedBonuses || []).filter(b => b.date === today);
    save();
    return true;
  }
  // Handle health decay if no check-in was done (app opened after missing days)
  if (!state.lastHealthDate) {
    state.lastHealthDate = today;
    save();
  } else if (state.lastHealthDate !== today) {
    const lastDate = new Date(state.lastHealthDate);
    const now = new Date();
    now.setHours(0,0,0,0);
    lastDate.setHours(0,0,0,0);
    const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) {
      // Use improved escalating decay
      const decay = calculateHealthDecay(diffDays);
      state.health = Math.max(0, (state.health || 100) - decay);
      state.consecutiveMissedDays = (state.consecutiveMissedDays || 0) + diffDays;
      state.lastHealthDate = today;
      save();
    }
  }
  return false;
}

// === OFFLINE PROGRESSION ===
export function processOfflineProgression() {
  const lastActive = state.lastActiveTimestamp;
  if (!lastActive) {
    state.lastActiveTimestamp = Date.now();
    save();
    return null;
  }

  const now = Date.now();
  const hoursAway = (now - lastActive) / (1000 * 60 * 60);

  // Only process if away > 1 hour
  if (hoursAway < 1) return null;

  const results = { hoursAway: Math.round(hoursAway * 10) / 10, healthChange: 0, energyChange: 0, activity: '' };

  // Passive health regen from items
  const regenGain = calculatePassiveRegen(hoursAway);
  if (regenGain > 0) {
    const before = state.health || 0;
    state.health = Math.min(100, before + regenGain);
    results.healthChange = state.health - before;
  }

  // Energy drain while away (5/hr — needs feeding!)
  const energyDrain = Math.round(hoursAway * 5);
  const energyBefore = state.energy || 0;
  state.energy = Math.max(0, energyBefore - energyDrain);
  results.energyChange = state.energy - energyBefore;

  // Generate activity message
  const animalActivities = {
    koala: ['napping on the couch','reading a book','watching the clouds','playing with toys','sitting by the window','snacking on eucalyptus'],
    bear:  ['napping in a cozy den','fishing for snacks','watching the clouds','playing with toys','sitting by the window','snacking on honey'],
    bunny: ['hopping around the room','twitching tiny whiskers','watching the clouds','playing with toys','sitting by the window','munching on carrots'],
    dog:   ['chasing its tail','napping in a sunny spot','watching the clouds','playing with toys','sitting by the window','gnawing on a bone'],
  };
  const animal = state.selectedAnimal || 'koala';
  const activities = [...(animalActivities[animal] || animalActivities.koala)];
  if (state.ownedItems.includes('cat')) activities.push(animal === 'dog' ? 'chasing the cat around' : 'cuddling with the cat');
  if (state.ownedItems.includes('fireplace')) activities.push('warming by the fireplace');
  if (state.ownedItems.includes('shelf')) activities.push('browsing the bookshelf');

  results.activity = activities[Math.floor(Math.random() * activities.length)];

  state.lastActiveTimestamp = now;
  state.offlineMessage = results;
  save();

  return results;
}
