// ===== MOOD SYSTEM =====
// Manages mood: happy, tired, bored, sad, proud
// Driven by health, energy, activity. Stores last-day memory.

import { state, save } from './state.js';
import { getModifiers } from './modifierSystem.js';
import { getRichMemoryMessage, getPersonalityThoughts } from './personalitySystem.js';
import { emojiSVG } from './emojiSVG.js';

const MOODS = ['happy', 'tired', 'bored', 'sad', 'proud'];

// Calculate current mood based on state
export function calculateMood() {
  const health = state.health || 100;
  const energy = state.energy || 0;
  const streak = state.streak || 0;
  const { moodBoost } = getModifiers();

  // Base mood score factors
  let happyScore = 0;
  let tiredScore = 0;
  let boredScore = 0;
  let sadScore = 0;
  let proudScore = 0;

  // Health influence
  if (health >= 80) happyScore += 3;
  else if (health >= 50) happyScore += 1;
  else if (health < 30) sadScore += 3;
  else sadScore += 1;

  // Energy influence
  if (energy >= 70) happyScore += 2;
  else if (energy <= 20) tiredScore += 3;
  else if (energy <= 40) tiredScore += 1;

  // Streak influence
  if (streak >= 7) proudScore += 3;
  else if (streak >= 3) proudScore += 2;
  else if (streak === 0 && (state.checkins || []).length > 0) sadScore += 1;

  // Activity (time since last interaction)
  const lastCheckin = state.todayCheckedIn ? 1 : 0;
  const idleHours = _hoursSinceLastActivity();
  if (idleHours > 12) boredScore += 2;
  else if (idleHours > 6) boredScore += 1;

  // Mood boost from items
  happyScore += Math.round(moodBoost * 10);

  // Last day memory \u{2014} if yesterday was good, slight mood boost
  if (state.lastDayResult === 'win') happyScore += 1;
  else if (state.lastDayResult === 'fail') sadScore += 1;

  // Pick highest scoring mood
  const scores = { happy: happyScore, tired: tiredScore, bored: boredScore, sad: sadScore, proud: proudScore };
  let best = 'happy';
  let bestScore = -1;
  for (const [mood, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = mood; }
  }

  return best;
}

function _hoursSinceLastActivity() {
  const last = state.lastActiveTimestamp;
  if (!last) return 0;
  return (Date.now() - last) / (1000 * 60 * 60);
}

// Update mood in state and UI
export function updateMood() {
  const newMood = calculateMood();
  state.mood = newMood;
  save();
  updateMoodUI();
  return newMood;
}

// UI
export function updateMoodUI() {
  const mood = state.mood || 'happy';
  const el = document.getElementById('moodIndicator');
  if (!el) return;

  const moodEmoji = { happy: emojiSVG('happy',16), tired: emojiSVG('tired',16), bored: emojiSVG('bored',16), sad: emojiSVG('sad',16), proud: emojiSVG('proud',16) };
  const moodLabel = { happy: 'Happy', tired: 'Tired', bored: 'Bored', sad: 'Sad', proud: 'Proud' };

  el.innerHTML = `<span class="mood-emoji">${moodEmoji[mood]}</span><span class="mood-text">${moodLabel[mood]}</span>`;
  el.className = 'mood-indicator mood-' + mood;
}

// Store yesterday's result for memory messages
export function storeLastDayResult(win) {
  state.lastDayResult = win ? 'win' : 'fail';
  save();
}

// Get memory message \u{2014} uses personalitySystem for rich, contextual messages
export function getMemoryMessage() {
  // Prefer rich personality-aware message, fall back to simple one
  const rich = getRichMemoryMessage();
  if (rich) return rich;
  if (!state.lastDayResult) return null;
  return state.lastDayResult === 'win' ? 'You did great yesterday!' : 'Today is a fresh start!';
}

// Get mood-specific thoughts for koala \u{2014} enriched with personality thoughts
export function getMoodThoughts() {
  const mood   = state.mood || 'happy';
  const energy = state.energy || 0;
  const base = {
    happy:  ['Life is good!', 'So happy!', 'Great day!', 'Feeling great!', 'Wonderful!'],
    tired:  ['Sleepy...', 'Need rest...', 'So tired...', 'Yawn...', '*nods off*'],
    bored:  ['Hmm...', 'Nothing to do...', 'Bored...', '*sighs*', 'Play with me?'],
    sad:    ['Feeling down...', 'Miss you...', 'Not great...', '...', 'Come back soon...'],
    proud:  ['On a roll!', 'So proud!', 'Streak going!', 'Champion!', 'Unstoppable!'],
  };
  // Hunger thoughts override when energy is low
  const hungerThoughts = [
    'I\'m hungry...', 'Feed me!', 'Eucalyptus please!',
    'My tummy is grumbling...', 'So hungry!', 'I need leaves!',
    'Can I have a snack?', 'Starving here!', 'Got any leaves?',
  ];
  const personalityThoughts = getPersonalityThoughts();
  const moodBase = base[mood] || base.happy;
  // When energy is low, weight heavily toward hunger thoughts
  if (energy <= 30) return [...hungerThoughts, ...hungerThoughts, ...moodBase];
  if (energy <= 60) return [...hungerThoughts, ...personalityThoughts, ...moodBase];
  // Normal mix: 60% personality, 40% mood
  return [...personalityThoughts, ...moodBase];
}
