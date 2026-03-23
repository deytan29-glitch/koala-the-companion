// ===== BOND / FRIENDSHIP SYSTEM =====
// Tracks how connected the user is to their koala.
// Grows from consistency, care, focus, and daily presence.
// Milestones unlock special reactions, thoughts, and moments.

import { state, save } from './state.js';
import { emojiSVG } from './emojiSVG.js';

export const BOND_MILESTONES = [
  { bond: 0,  label: 'Getting Started', emoji: emojiSVG('paw',20) },
  { bond: 10, label: 'New Friends',     emoji: emojiSVG('seedling',20) },
  { bond: 25, label: 'Good Friends',    emoji: emojiSVG('herb',20) },
  { bond: 50, label: 'Best Buds',       emoji: emojiSVG('flower',20) },
  { bond: 75, label: 'Inseparable',     emoji: emojiSVG('greenheart',20) },
  { bond: 95, label: 'Soulmates',       emoji: emojiSVG('sparkle',20) },
];

export function getBond() {
  return Math.min(100, Math.max(0, state.bond || 0));
}

export function getBondMilestone() {
  const bond = getBond();
  let current = BOND_MILESTONES[0];
  for (const m of BOND_MILESTONES) {
    if (bond >= m.bond) current = m;
  }
  return current;
}

export function addBond(amount) {
  if (!amount || amount <= 0) return;
  const prev          = getBond();
  const prevMilestone = getBondMilestone();
  state.bond = Math.min(100, prev + amount);
  save();
  const newMilestone = getBondMilestone();
  if (newMilestone.bond > prevMilestone.bond) {
    _showBondMilestone(newMilestone);
  }
}

function _showBondMilestone(milestone) {
  const toast = document.createElement('div');
  toast.className = 'bond-toast';
  toast.innerHTML = `
    <div class="bond-toast-emoji">${milestone.emoji}</div>
    <div class="bond-toast-content">
      <div class="bond-toast-title">Bond Milestone!</div>
      <div class="bond-toast-label">${milestone.label}</div>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 4500);
}

export function updateBondUI() {
  const bond      = getBond();
  const milestone = getBondMilestone();

  const fill = document.getElementById('bondBarFill');
  if (fill)  fill.style.width = bond + '%';

  const label = document.getElementById('bondLabel');
  if (label) label.textContent = milestone.label;

  const emoji = document.getElementById('bondEmoji');
  if (emoji) emoji.innerHTML = milestone.emoji;

  const pct = document.getElementById('bondPct');
  if (pct)  pct.textContent = bond + '%';
}
