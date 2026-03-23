// ===== XP / LEVEL SYSTEM =====
// User earns XP through check-ins, streaks, and focus sessions.
// Level formula: level = floor(sqrt(xp / 100))
// L1=100xp, L2=400xp, L5=2500xp, L10=10000xp

import { state, save } from './state.js';
import { emojiSVG } from './emojiSVG.js';

const XP_SCALE = 100;

export function getLevel() {
  return Math.floor(Math.sqrt((state.xp || 0) / XP_SCALE));
}

export function getXPForLevel(level) {
  return level * level * XP_SCALE;
}

export function getLevelProgress() {
  const xp            = state.xp || 0;
  const level         = getLevel();
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP   = getXPForLevel(level + 1);
  const range         = nextLevelXP - currentLevelXP;
  const progress      = range > 0 ? (xp - currentLevelXP) / range : 0;
  return {
    level,
    xp,
    progress:  Math.min(1, Math.max(0, progress)),
    xpInLevel: xp - currentLevelXP,
    xpNeeded:  nextLevelXP - currentLevelXP,
    nextLevel: level + 1,
  };
}

// Add XP \u{2014} returns { levelUp, newLevel, prevLevel, xpGained }
export function addXP(amount) {
  const prevLevel = getLevel();
  state.xp = (state.xp || 0) + Math.max(0, amount);
  const newLevel = getLevel();
  save();

  if (newLevel > prevLevel) {
    _onLevelUp(newLevel);
    return { levelUp: true, newLevel, prevLevel, xpGained: amount };
  }
  return { levelUp: false, newLevel, prevLevel, xpGained: amount };
}

// Check for streak XP bonuses (call after updating streak)
export function checkStreakXP(streak) {
  const milestones = { 3: 50, 7: 100, 14: 150, 30: 250 };
  const bonus = milestones[streak];
  if (bonus) addXP(bonus);
}

function _onLevelUp(level) {
  // Unlock themes at key levels
  if (!state.unlockedThemes) state.unlockedThemes = ['default'];
  if (level >= 5  && !state.unlockedThemes.includes('forest')) {
    state.unlockedThemes.push('forest');
  }
  if (level >= 10 && !state.unlockedThemes.includes('cabin')) {
    state.unlockedThemes.push('cabin');
  }

  // Coin bonus: level \u{D7} 5 coins
  const coinBonus = level * 5;
  state.coins = (state.coins || 0) + coinBonus;

  save();

  // Spawn particles immediately, overlay slightly after
  _spawnLevelUpParticles();
  setTimeout(() => _showLevelUpOverlay(level, coinBonus), 900);
}

const PARTICLE_EMOJIS = [emojiSVG('star',18), emojiSVG('sparkle',18), emojiSVG('proud',18), emojiSVG('sparkle',18), emojiSVG('trophy',18), emojiSVG('party',18), emojiSVG('gem',18), emojiSVG('fire',18)];

function _spawnLevelUpParticles() {
  const count = 18;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className   = 'levelup-particle';
      el.innerHTML = PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)];
      // Random position across the viewport
      el.style.left  = (10 + Math.random() * 80) + 'vw';
      el.style.top   = (20 + Math.random() * 50) + 'vh';
      el.style.setProperty('--dx', (Math.random() - 0.5) * 120 + 'px');
      el.style.setProperty('--dy', -(60 + Math.random() * 120) + 'px');
      el.style.animationDelay    = (Math.random() * 0.3) + 's';
      el.style.animationDuration = (0.9 + Math.random() * 0.6) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }, i * 40);
  }
}

function _showLevelUpOverlay(level, coinBonus) {
  document.querySelector('.levelup-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'levelup-overlay';
  overlay.innerHTML = `
    <div class="levelup-card">
      <div class="levelup-burst">
        ${Array.from({length:12},(_,i)=>`<span style="--a:${i*30}deg"></span>`).join('')}
      </div>
      <div class="levelup-koala">${emojiSVG('koala',48)}</div>
      <div class="levelup-eyebrow">Level Up!</div>
      <div class="levelup-num">${level}</div>
      <div class="levelup-coins">+${coinBonus} coins</div>
      <div class="levelup-msg">${_getLevelMessage(level)}</div>
      <button class="levelup-btn" onclick="this.closest('.levelup-overlay').remove()">Keep Going!</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function _getLevelMessage(level) {
  if (level === 1)  return 'Your koala is getting to know you!';
  if (level <= 3)   return 'You\'re building something real here.';
  if (level <= 5)   return 'Real progress. Your habits are forming.';
  if (level <= 8)   return 'Your koala is so proud of you.';
  if (level <= 12)  return 'Exceptional dedication. Keep going.';
  if (level <= 18)  return 'You\'re becoming a true champion!';
  return 'Legendary. This koala is yours forever.';
}

export function updateXPUI() {
  const { level, xp, progress, xpInLevel, xpNeeded } = getLevelProgress();

  // Top-bar XP counter
  const xpCount = document.getElementById('xpCount');
  if (xpCount) xpCount.textContent = (xp || 0) + ' XP';

  const fill = document.getElementById('xpBarFill');
  if (fill) fill.style.width = (progress * 100) + '%';

  const text = document.getElementById('xpProgressText');
  if (text) text.textContent = `${xpInLevel} / ${xpNeeded} XP to Level ${level + 1}`;
}
