// ===== FEEDING SYSTEM =====
// Eucalyptus leaves currency + drag-to-feed mechanic
// Max 15 leaf sets stored. Each set restores ~16 energy.
// 6-7 leaves fills from low to full — focus sessions remain the primary energy source.

import { state, save } from './state.js';

const FEED_REACTIONS = {
  koala: { nom: 'Nom nom nom!', full: 'So full and happy!' },
  bear:  { nom: 'Mmm, honey!',  full: 'So full and cozy!'  },
  bunny: { nom: 'Crunch crunch!', full: 'Tail wiggle!'     },
  dog:   { nom: 'Woof! Tasty!', full: 'Best human ever!'   },
};
import { updateEnergyUI } from './energySystem.js';
import { updateMood } from './moodSystem.js';
import { addBond, updateBondUI } from './bondSystem.js';

const ENERGY_PER_LEAF = 16;  // was 28 — reduced so feeding supplements focus, not replaces it
export const MAX_LEAVES = 15;

// ===== GETTERS =====
export function getLeaves() { return Math.min(MAX_LEAVES, Math.max(0, state.leaves || 0)); }
export function needsFeeding() { return (state.energy || 0) < 100; }

export const LEAF_COST = 5; // coins per leaf set (was 2 — raised so focus sessions are needed to fund feeding)

// ===== BUY LEAVES (called from shop) =====
export function buyLeaves() {
  if ((state.leaves || 0) >= MAX_LEAVES) return false;
  if ((state.coins || 0) < LEAF_COST) return false;
  state.coins -= LEAF_COST;
  state.leaves = Math.min(MAX_LEAVES, (state.leaves || 0) + 1);
  save();
  updateLeavesUI();
  const coinEl = document.getElementById('coinCount');
  if (coinEl) coinEl.textContent = state.coins;
  return true;
}

// ===== ACTUAL FEED =====
export function feedKoala() {
  if (getLeaves() <= 0 || (state.energy || 0) >= 100) return null;

  const today = new Date().toDateString();
  if (state.lastFedDate !== today) {
    state.lastFedDate = today;
    state.todayFeedCount = 0;
  }

  const energyBefore = state.energy || 0;
  state.leaves = Math.max(0, (state.leaves || 0) - 1);
  state.energy = Math.min(100, energyBefore + ENERGY_PER_LEAF);
  state.todayFeedCount = (state.todayFeedCount || 0) + 1;

  // If koala was sick and energy is now > 0, cure it
  if (state.koalaSick && state.energy > 0) {
    state.koalaSick = false;
    if (typeof window.updateSickOverlay === 'function') window.updateSickOverlay();
  }

  // Bond from feeding
  addBond(0.5);

  save();
  updateEnergyUI();
  updateLeavesUI();
  _updateFeedOverlayStats();

  return {
    gainedEnergy: state.energy - energyBefore,
    full: state.energy >= 100,
    leavesLeft: state.leaves,
  };
}

// ===== UI =====
export function updateLeavesUI() {
  const leaves = getLeaves();
  document.querySelectorAll('.leaf-count-el').forEach(el => { el.textContent = leaves; });
}

export function updateFeedBtn() {
  const btn     = document.getElementById('feedKoalaBtn');
  const section = document.getElementById('feedKoalaSection');
  const energy  = state.energy || 0;
  const show    = energy < 100;
  if (btn)     btn.style.display     = show ? 'flex'  : 'none';
  if (section) section.style.padding = show ? '' : '0';
  // Update the energy hint on the button
  const hint = document.getElementById('feedBtnEnergy');
  if (hint) hint.textContent = show ? `(${energy}%)` : '';
}

// ===== OVERLAY =====
export function openFeedOverlay() {
  const leaves = getLeaves();
  if (leaves <= 0) {
    _toast('No leaves! Buy some in the Shop for 2 coins each.', '#7C5C3C');
    return;
  }
  if ((state.energy || 0) >= 100) {
    _toast('Your koala is already full of energy!', '#4A8A4A');
    return;
  }
  const el = document.getElementById('feedOverlay');
  if (!el) return;
  _updateFeedOverlayStats();
  _renderLeafIcons();
  el.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
}

export function closeFeedOverlay() {
  const el = document.getElementById('feedOverlay');
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 350);
}

function _updateFeedOverlayStats() {
  const energy = state.energy || 0;
  const pct = document.getElementById('feedEnergyPct');
  if (pct) pct.textContent = energy + '%';
  const fill = document.getElementById('feedEnergyFill');
  if (fill) {
    fill.style.width = energy + '%';
    fill.className = 'feed-energy-fill' + (energy <= 20 ? ' low' : energy <= 50 ? ' mid' : '');
  }
  const stock = document.getElementById('feedLeafStock');
  if (stock) stock.textContent = getLeaves() + ' / ' + MAX_LEAVES;
}

function _renderLeafIcons() {
  const row = document.getElementById('feedLeavesRow');
  if (!row) return;
  row.innerHTML = '';

  const count = Math.min(getLeaves(), 5);
  if (count === 0) {
    row.innerHTML = '<div class="feed-no-leaves">No leaves left!<br>Buy more in the Shop.</div>';
    return;
  }
  for (let i = 0; i < count; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'feed-leaf-icon';
    leaf.setAttribute('draggable', false);
    leaf.innerHTML = `<svg viewBox="0 0 44 48" width="60" height="60" fill="none">
      <ellipse cx="22" cy="28" rx="15" ry="19" fill="#4CAF50" transform="rotate(-15 22 28)"/>
      <ellipse cx="22" cy="28" rx="11" ry="15" fill="#66BB6A" opacity=".6" transform="rotate(-15 22 28)"/>
      <path d="M22 46 Q18 34 13 20" stroke="#2E7D32" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M22 36 Q27 30 30 22" stroke="#388E3C" stroke-width="1.2" fill="none" opacity=".8" stroke-linecap="round"/>
      <path d="M22 30 Q17 27 15 22" stroke="#388E3C" stroke-width="1.2" fill="none" opacity=".7" stroke-linecap="round"/>
    </svg>`;
    _addDragEvents(leaf);
    row.appendChild(leaf);
  }
}

function _addDragEvents(leaf) {
  let clone = null;
  let startClientX = 0;
  let startClientY = 0;

  const startDrag = (clientX, clientY) => {
    startClientX = clientX;
    startClientY = clientY;
    const rect = leaf.getBoundingClientRect();
    clone = leaf.cloneNode(true);
    clone.style.cssText = `
      position:fixed;left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;height:${rect.height}px;
      z-index:20000;pointer-events:none;transition:none;opacity:1;
    `;
    document.body.appendChild(clone);
    leaf.style.opacity = '0.25';
  };

  const moveDrag = (clientX, clientY) => {
    if (!clone) return;
    const dx = clientX - startClientX;
    const dy = clientY - startClientY;
    const rect = leaf.getBoundingClientRect();
    clone.style.left = (rect.left + dx) + 'px';
    clone.style.top  = (rect.top  + dy) + 'px';
    // Glow when in koala zone (top 45% of screen)
    const inZone = clientY < window.innerHeight * 0.45;
    clone.style.filter    = inZone ? 'drop-shadow(0 0 14px #4CAF50) brightness(1.3)' : '';
    clone.style.transform = inZone ? 'scale(1.25)' : 'scale(1)';
  };

  const endDrag = (clientX, clientY) => {
    if (!clone) return;
    if (clientY < window.innerHeight * 0.45) {
      // Flew to koala — animate into koala position then feed
      const koalaEl = document.getElementById('koalaSitting');
      const kr = koalaEl ? koalaEl.getBoundingClientRect() : { left: window.innerWidth / 2 - 50, top: window.innerHeight * 0.2, width: 100, height: 100 };
      const tx = kr.left + kr.width / 2 - 30;
      const ty = kr.top  + kr.height / 2 - 30;
      clone.style.transition = 'all 0.3s cubic-bezier(.3,.8,.4,1)';
      clone.style.left      = tx + 'px';
      clone.style.top       = ty + 'px';
      clone.style.transform = 'scale(0.15)';
      clone.style.opacity   = '0';
      setTimeout(() => {
        if (clone) { clone.remove(); clone = null; }
        leaf.style.opacity = '1';
        const result = feedKoala();
        if (result) {
          _showFeedReaction(result.full);
          if (result.leavesLeft <= 0 || result.full) {
            _renderLeafIcons(); // refresh icons
          } else {
            leaf.remove(); // remove this leaf icon
            _renderLeafIcons();
          }
        }
      }, 300);
    } else {
      // Snap back
      clone.style.transition = 'all 0.2s ease';
      const rect = leaf.getBoundingClientRect();
      clone.style.left    = rect.left + 'px';
      clone.style.top     = rect.top  + 'px';
      clone.style.opacity = '0';
      setTimeout(() => { if (clone) { clone.remove(); clone = null; } leaf.style.opacity = '1'; }, 200);
    }
  };

  // Touch
  leaf.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, { passive: false });
  leaf.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  }, { passive: false });
  leaf.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    endDrag(t.clientX, t.clientY);
  });

  // Mouse (simulator / desktop)
  leaf.addEventListener('mousedown', e => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
    const mm = ev => moveDrag(ev.clientX, ev.clientY);
    const mu = ev => {
      endDrag(ev.clientX, ev.clientY);
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup',   mu);
    };
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup',   mu);
  });
}

function _showFeedReaction(isFull) {
  const kb = document.getElementById('koalaBody');
  if (kb) {
    kb.classList.remove('idle', 'hurt');
    kb.classList.add('celebrate');
    setTimeout(() => { kb.classList.remove('celebrate'); kb.classList.add('idle'); }, 1200);
  }

  const koalaEl = document.getElementById('koalaSitting');
  if (koalaEl) {
    const r  = koalaEl.getBoundingClientRect();
    const tb = document.createElement('div');
    tb.className   = 'thought-bubble';
    const reactions = FEED_REACTIONS[state.selectedAnimal || 'koala'] || FEED_REACTIONS.koala;
    tb.textContent = isFull ? reactions.full : reactions.nom;
    tb.style.left  = (r.left + r.width / 2 - 30) + 'px';
    tb.style.top   = (r.top - 24) + 'px';
    tb.style.zIndex = '20001';
    document.body.appendChild(tb);
    requestAnimationFrame(() => tb.classList.add('show'));
    setTimeout(() => { tb.classList.remove('show'); setTimeout(() => tb.remove(), 500); }, 2500);
  }

  if (isFull) {
    updateMood();
    updateBondUI();
    setTimeout(() => closeFeedOverlay(), 1600);
    _spawnLeafConfetti();
    _toast('Your koala is happy & full!', '#4A8A4A');
    updateFeedBtn();
  }
}

function _spawnLeafConfetti() {
  for (let i = 0; i < 14; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;left:${15 + Math.random()*70}vw;top:${10 + Math.random()*40}vh;
        font-size:${14 + Math.random()*14}px;z-index:20001;pointer-events:none;
        transition:all ${0.8 + Math.random()*0.7}s ease-out;opacity:1;`;
      el.innerHTML = '<svg viewBox="0 0 16 16" width="1em" height="1em" fill="none"><path d="M8 1C10.2 2.8 14 5.8 14 9.8C14 13 11.3 15 8 15C4.7 15 2 13 2 9.8C2 5.8 5.8 2.8 8 1Z" fill="#4CAF50"/><path d="M8 15 Q7.2 11.5 6.5 8.5" stroke="#1B5E20" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>';
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = `translateY(-${50 + Math.random()*70}px) rotate(${(Math.random()-0.5)*80}deg)`;
        el.style.opacity   = '0';
      });
      setTimeout(() => el.remove(), 1600);
    }, i * 55);
  }
}

function _toast(msg, bg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:110px;left:50%;transform:translateX(-50%) translateY(20px);background:${bg};color:#fff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:20px;z-index:25000;opacity:0;transition:all .3s;pointer-events:none;text-align:center;max-width:80vw`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2800);
}
