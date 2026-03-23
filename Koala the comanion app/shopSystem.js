// ===== SHOP SYSTEM =====
// Manages shop rendering, item purchasing, and focus bonuses
// Now with progression tiers and functional effect display

import { state, save } from './state.js';
import { SHOP_ITEMS, FOCUS_REWARDS, shopSVG } from './data.js';
import { isSubscriptionActive } from './modifierSystem.js';
import { koalaReact, renderDecor } from './koalaSystem.js';
import { fetchWeather, updateWeatherBadge } from './environmentSystem.js';
import { addInteractionEnergy } from './energySystem.js';
import { getLevel } from './xpSystem.js';
import { emojiSVG } from './emojiSVG.js';
import { buyLeaves, getLeaves, MAX_LEAVES, LEAF_COST, updateLeavesUI } from './feedingSystem.js';

// Callback injected from app.js to break potential circular dep
let _onGoalUIUpdate = null;
export function registerGoalUICallback(fn) { _onGoalUIUpdate = fn; }

const TIER_LABELS = { 1: 'Starter', 2: 'Growing', 3: 'Premium' };
const ROOM_TABS = [
  { key: 'all',     label: 'All' },
  { key: 'living',  label: 'Living Room' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'bedroom', label: 'Bedroom' },
];
let _activeRoomTab = 'all';

// ===== RENDER SHOP =====
export function renderShop() {
  _renderLeavesSection();
  _renderRoomTabs();
  _renderRoomItems();
  _renderFocusRewards();
}

function _renderRoomTabs() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;
  let wrap = document.getElementById('shopRoomTabs');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'shopRoomTabs';
    wrap.style.cssText = 'display:flex;gap:8px;padding:0 2px 12px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch';
    grid.parentNode.insertBefore(wrap, grid);
  }
  wrap.innerHTML = ROOM_TABS.map(t => {
    const active = _activeRoomTab === t.key;
    return `<button onclick="window._shopRoomTab('${t.key}')" style="flex-shrink:0;padding:7px 16px;border-radius:20px;border:2px solid ${active ? '#9B6FDB' : 'rgba(0,0,0,0.12)'};background:${active ? '#9B6FDB' : 'rgba(255,255,255,0.8)'};color:${active ? '#fff' : '#666'};font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s">${t.label}</button>`;
  }).join('');
}

if (typeof window !== 'undefined') {
  window._shopRoomTab = (key) => { _activeRoomTab = key; renderShop(); };
}

function _renderLeavesSection() {
  const container = document.getElementById('leavesBuySection');
  if (!container) return;
  const leaves    = getLeaves();
  const isFull    = leaves >= MAX_LEAVES;
  const canAfford = (state.coins || 0) >= LEAF_COST;

  container.innerHTML = `
    <div class="leaves-shop-card ${isFull ? 'leaves-full' : ''} ${!canAfford && !isFull ? 'leaves-cant-afford' : ''}">
      <div class="leaves-shop-icon">
        <svg viewBox="0 0 44 48" width="36" height="36" fill="none">
          <ellipse cx="22" cy="28" rx="15" ry="19" fill="#4CAF50" transform="rotate(-15 22 28)"/>
          <ellipse cx="22" cy="28" rx="11" ry="15" fill="#66BB6A" opacity=".6" transform="rotate(-15 22 28)"/>
          <path d="M22 46 Q18 34 13 20" stroke="#2E7D32" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="leaves-shop-info">
        <div class="leaves-shop-name">Eucalyptus Leaves</div>
        <div class="leaves-shop-desc">Feed your koala to restore energy. +16 energy each — do focus sessions to earn coins!</div>
        <div class="leaves-shop-stock">Stock: <strong class="leaf-count-el">${leaves}</strong> / ${MAX_LEAVES}</div>
      </div>
      <div class="leaves-shop-right">
        ${isFull
          ? '<div class="leaves-full-badge">Full!</div>'
          : `<button class="leaves-buy-btn ${!canAfford ? 'cant-afford' : ''}" onclick="window.buyLeavesShop()" ${!canAfford ? 'disabled' : ''}>
               <span class="mini-coin"></span>${LEAF_COST}
             </button>`
        }
      </div>
    </div>
  `;
}

function _renderRoomItems() {
  const g = document.getElementById('shopGrid');
  if (!g) return;
  g.innerHTML = '';

  // Filter by active room tab (skip premium items — they have their own section)
  const tabFilter = (item) => {
    if (item.tier === 'premium') return false;
    if (_activeRoomTab === 'all') return true;
    return (item.room || 'living') === _activeRoomTab;
  };

  // Group by tier
  const tiers = [1, 2, 3];
  tiers.forEach(tier => {
    const tierItems = SHOP_ITEMS.filter(i => i.tier === tier && tabFilter(i));
    if (!tierItems.length) return;

    // Tier header
    const header = document.createElement('div');
    header.className = 'shop-tier-header';
    header.innerHTML = `<span class="tier-label">${TIER_LABELS[tier]}</span><span class="tier-line"></span>`;
    g.appendChild(header);

    tierItems.forEach(item => {
      const owned      = state.ownedItems.includes(item.id);
      const reqLocked  = item.requires && !state.ownedItems.includes(item.requires);
      const curLevel   = getLevel();
      const lvlLocked  = item.minLevel && curLevel < item.minLevel;
      const locked     = reqLocked || lvlLocked;
      const canAfford  = state.coins >= item.cost;

      const c = document.createElement('div');
      c.className = 'shop-card' + (owned ? ' owned' : '') + (locked ? ' locked' : '');

      let badgeHTML = '';
      if (owned)        badgeHTML = '<div class="shop-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>';
      else if (locked)  badgeHTML = '<div class="shop-badge" style="background:#999;font-size:20px">' + emojiSVG('lock',20) + '</div>';

      let footerHTML = '';
      if (owned)           footerHTML = '<div style="font-size:11px;color:var(--green-dark);font-weight:700">Owned</div>';
      else if (lvlLocked)  footerHTML = `<div class="shop-level-req">Level ${item.minLevel} required</div>`;
      else if (reqLocked)  footerHTML = '<div style="font-size:11px;color:#999;font-weight:700">Unlock Side Table first</div>';
      else                 footerHTML = `<div class="shop-item-cost"><span class="mini-coin"></span>${item.cost}</div>`;

      c.innerHTML = badgeHTML +
        `<div class="shop-icon-wrap">${shopSVG(item.icon)}</div>` +
        `<div class="shop-item-name">${item.name}</div>` +
        `<div class="shop-item-desc">${item.desc}</div>` +
        (item.effect ? `<div class="shop-item-effect">${item.effect}</div>` : '') +
        footerHTML;

      if (!owned && !locked && canAfford) c.onclick = () => buyItem(item);
      g.appendChild(c);
    });
  });

  // Premium subscription items
  const premiumItems = SHOP_ITEMS.filter(i => i.requiresPremium);
  if (premiumItems.length) {
    const isPremium = isSubscriptionActive();
    const header = document.createElement('div');
    header.className = 'shop-tier-header';
    // Use inline SVG star instead of ✨ emoji (WKWebView can't render emoji chars)
    const starSVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="#FFD700" stroke="#FFD700" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    header.innerHTML = `<span class="tier-label" style="color:#9B6FDB">${starSVG} Premium Exclusive</span><span class="tier-line"></span>`;
    g.appendChild(header);

    premiumItems.forEach(item => {
      const owned     = state.ownedItems.includes(item.id);
      const canAfford = state.coins >= item.cost;

      const c = document.createElement('div');
      c.className = 'shop-card premium-item-card' + (owned ? ' owned' : '') + (!isPremium ? ' locked' : '');

      // SVG lock icon for premium-locked items
      const lockSVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
      let badgeHTML = '';
      if (owned)           badgeHTML = '<div class="shop-badge" style="background:#9B6FDB"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>';
      else if (!isPremium) badgeHTML = `<div class="shop-badge" style="background:#9B6FDB">${lockSVG}</div>`;

      let footerHTML = '';
      if (owned)       footerHTML = '<div style="font-size:11px;color:#9B6FDB;font-weight:700">Owned</div>';
      else if (!isPremium) footerHTML = `<button class="shop-premium-lock-btn" onclick="window.navigate('screenPremium')">Unlock with Premium</button>`;
      else             footerHTML = `<div class="shop-item-cost"><span class="mini-coin"></span>${item.cost.toLocaleString()}</div>`;

      c.innerHTML = badgeHTML +
        `<div class="shop-icon-wrap">${shopSVG(item.icon)}</div>` +
        `<div class="shop-item-name">${item.name}</div>` +
        `<div class="shop-item-desc">${item.desc}</div>` +
        (item.effect ? `<div class="shop-item-effect">${item.effect}</div>` : '') +
        footerHTML;

      if (isPremium && !owned && canAfford) c.onclick = () => buyItem(item);
      g.appendChild(c);
    });
  }
}

function _renderFocusRewards() {
  const fl = document.getElementById('focusRewardsList');
  if (!fl) return;
  fl.innerHTML = '';

  const today = new Date().toDateString();
  FOCUS_REWARDS.forEach(fr => {
    const used = (state.usedBonuses || []).some(b => b.id === fr.id && b.date === today);
    const canAfford = state.coins >= fr.cost;

    const card = document.createElement('div');
    card.className = 'focus-reward-card' + (used ? ' owned' : '') + (!used && !canAfford ? ' cant-afford' : '');
    card.innerHTML = `
      <div class="focus-reward-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="20" height="20">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <div class="focus-reward-info">
        <div class="focus-reward-name">${fr.name}</div>
        <div class="focus-reward-desc">${fr.desc}</div>
        <div class="focus-reward-cost">
          <span class="mini-coin"></span>${fr.cost}${used ? ' \u{B7} Used today' : ''}
        </div>
      </div>`;

    if (!used && canAfford) card.onclick = () => buyBonus(fr);
    fl.appendChild(card);
  });
}

// ===== BUY ITEM =====
export function buyItem(item) {
  if (state.coins < item.cost || state.ownedItems.includes(item.id)) return;
  state.coins -= item.cost;
  state.ownedItems.push(item.id);

  // Small energy gain from shopping interaction
  addInteractionEnergy();
  save();

  document.getElementById('coinCount').textContent = state.coins;
  renderShop();
  renderDecor();
  updateShopNotif();
  koalaReact(item.id);

  if (item.id === 'weather') {
    fetchWeather();
    updateWeatherBadge();
  }
}

// ===== BUY FOCUS BONUS =====
export function buyBonus(fr) {
  const today = new Date().toDateString();
  const used = (state.usedBonuses || []).some(b => b.id === fr.id && b.date === today);
  if (used || state.coins < fr.cost) return;

  state.coins -= fr.cost;
  if (!state.usedBonuses) state.usedBonuses = [];
  state.usedBonuses.push({ id: fr.id, date: today });
  state.extraMinutes = (state.extraMinutes || 0) + fr.minutes;
  save();

  document.getElementById('coinCount').textContent = state.coins;
  renderShop();
  updateShopNotif();

  if (_onGoalUIUpdate) _onGoalUIUpdate();

  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);background:#4A7ED4;color:#fff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:20px;z-index:200;opacity:0;transition:all .3s;pointer-events:none';
  toast.textContent = `+${fr.minutes} min added to goal!`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
}

// ===== SHOP NOTIFICATION DOT =====
export function updateShopNotif() {
  const today = new Date().toDateString();
  const roomAffordable = SHOP_ITEMS.some(i => !state.ownedItems.includes(i.id) && state.coins >= i.cost);
  const bonusAffordable = FOCUS_REWARDS.some(fr => {
    const used = (state.usedBonuses || []).some(b => b.id === fr.id && b.date === today);
    return !used && state.coins >= fr.cost;
  });
  document.getElementById('shopNotif')?.classList.toggle('show', roomAffordable || bonusAffordable);
}
