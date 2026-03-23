// ===== PERSONALITY / MEMORY SYSTEM =====
// Gives the koala a consistent personality that evolves with the user.
// Uses recent check-in patterns, bond, health, and level to generate
// contextual messages and thoughts that feel personal over time.

import { state } from './state.js';
import { getLevel } from './xpSystem.js';
import { getBond } from './bondSystem.js';

// \u{2500}\u{2500}\u{2500} Personality Trait \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

export function getPersonalityTrait() {
  const checkins   = state.checkins || [];
  const recent7    = checkins.slice(-7);
  const wins       = recent7.filter(c => c.success).length;
  const total      = recent7.length;
  const streak     = state.streak || 0;
  const health     = state.health || 100;
  const focus      = state.focusSessions || 0;
  const lastResult = state.lastDayResult;

  if (streak >= 10)                                    return 'thriving';
  if (streak >= 5 && wins / Math.max(total, 1) >= 0.7) return 'consistent';
  if (focus >= 10 && health >= 70)                     return 'focused';
  if (health < 40 || (total >= 4 && wins / total < 0.35)) return 'struggling';
  if (lastResult === 'fail' && streak === 0 && wins > 0)   return 'recovering';
  return 'balanced';
}

// \u{2500}\u{2500}\u{2500} Rich Memory Messages \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

export function getRichMemoryMessage() {
  const checkins = state.checkins || [];
  if (!checkins.length) return null;

  const trait   = getPersonalityTrait();
  const streak  = state.streak || 0;
  const bond    = getBond();
  const level   = getLevel();
  const recent7 = checkins.slice(-7);
  const wins    = recent7.filter(c => c.success).length;
  const last    = state.lastDayResult;

  const prefix = bond >= 75 ? 'I love having you here. '
               : bond >= 50 ? 'Good to see you. '
               : '';

  const pools = {
    thriving: [
      `${streak} days strong \u{2014} you're genuinely on a roll.`,
      `Your streak is real and it shows. Keep protecting it.`,
      `You've been at this for ${streak} days. That's not luck, that's you.`,
    ],
    consistent: [
      `${wins} out of ${recent7.length} this week. Solid and steady.`,
      `You're building a real habit here. The consistency is showing.`,
      `Day by day, you're making this part of who you are.`,
    ],
    focused: [
      `All those focus sessions are adding up to something real.`,
      `${state.focusSessions} focus sessions total. That's dedication.`,
      `Your focus habit is one of your best ones right now.`,
    ],
    struggling: [
      last === 'fail'
        ? `Yesterday was rough. But you came back. That matters.`
        : `It's been a hard stretch. Today is a fresh page.`,
      `Even on tough days, showing up is the whole thing.`,
      `You're still here. That's not nothing \u{2014} that's everything.`,
    ],
    recovering: [
      `You stumbled but you came back. That takes real strength.`,
      `Streaks break. What you do after defines you.`,
      `Yesterday didn't win. You came back \u{2014} that means you did.`,
    ],
    balanced: [
      last === 'win'
        ? `You did great yesterday. Let's make today count too.`
        : `Fresh start today. Your koala is in your corner.`,
      level >= 3
        ? `Level ${level} and still showing up. You're growing.`
        : `Every check-in builds something. This one counts.`,
      `Small steps forward are still steps forward.`,
    ],
  };

  const pool = pools[trait] || pools.balanced;
  const msg  = pool[Math.floor(Math.random() * pool.length)];
  return prefix + msg;
}

// \u{2500}\u{2500}\u{2500} Personality-driven Koala Thoughts \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

export function getPersonalityThoughts() {
  const trait  = getPersonalityTrait();
  const bond   = getBond();
  const health = state.health || 100;

  const traitThoughts = {
    thriving:   ['Unstoppable!', 'On top of the world!', 'So proud!', 'Can\'t stop us!'],
    consistent: ['Steady wins!', 'Day by day!', 'Keeping it up!', 'Consistent!'],
    focused:    ['In the zone!', 'Work mode: on!', 'Focus is everything.', 'Deep work!'],
    struggling: ['Hanging in there...', 'Tomorrow\'s better.', 'One step...', 'Still here.'],
    recovering: ['Bounce back!', 'Getting back up!', 'Back on track!', 'Fresh start!'],
    balanced:   ['Life is good!', 'Just vibing.', 'Feeling okay!', 'Here we go!'],
  };

  const bondThoughts = bond >= 75
    ? ['You\'re my favorite!', 'Best human ever!', 'I missed you!']
    : bond >= 50
    ? ['We\'re a good team!', 'Glad you\'re here!']
    : [];

  const healthThoughts = health >= 85
    ? ['Feeling amazing!', 'So healthy!', 'Tip-top shape!']
    : health < 35
    ? ['Need some care...', 'Not feeling great...', 'Could use TLC...']
    : [];

  return [
    ...(traitThoughts[trait] || traitThoughts.balanced),
    ...bondThoughts,
    ...healthThoughts,
  ];
}
