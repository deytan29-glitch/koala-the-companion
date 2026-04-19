// ===== KOALA CALM \u{2014} MAIN APP =====
// Wires all systems together and exposes globals for HTML onclick handlers

import { state, save, checkDayReset, processOfflineProgression } from './state.js';
import { registerSleepCallback, genClouds, genStars, genFloor, genRain, genSnow,
         startShootingStars, startAmbientParticles, applyToD, fetchWeather,
         updateWeatherBadge } from './environmentSystem.js';
import { showSleepState, startBlinking, startEarTwitches, startTailWag,
         startIdleBehaviors, initKoalaEvents, renderDecor,
         applyAnimalSkin, setSelectedAnimal, ANIMAL_FOOD, ANIMAL_NAMES,
         switchRoomDir } from './koalaSystem.js';
import { renderShop, updateShopNotif, registerGoalUICallback } from './shopSystem.js';
import { renderProgress }  from './progressSystem.js';
import { updateUI, updateGoalUI, updateHealthUI, openGoalSheet, closeGoalSheet, saveGoal,
         openCheckin, closeCheckin, submitCheckin, validateCheckin, closeFail,
         openPanic, closePanic, showOfflineMessage,
         startAdventure, startMiniGame, closeMiniGame, _refreshAdvBanner,
         openAdvFullView, closeAdvFullView } from './goalSystem.js';
import { updateEnergyUI, activeEnergyDrain } from './energySystem.js';
import { updateMood, updateMoodUI } from './moodSystem.js';
import { tryRandomEvent, showEventToast } from './eventSystem.js';
import { runSplash } from './splashSystem.js';
import { runOnboarding, shouldShowOnboarding } from './onboardingSystem.js';
import { initNotifications } from './notificationSystem.js';
import { updateXPUI } from './xpSystem.js';
import { updateBondUI } from './bondSystem.js';
import { openUrgeInterrupt, closeUrgeInterrupt } from './goalSystem.js';
import { openFeedOverlay, closeFeedOverlay, updateLeavesUI, updateFeedBtn, buyLeaves } from './feedingSystem.js';

// ===== NAVIGATION =====
let _activeScreen = 'screenHome';

export function navigate(screenId) {
  _activeScreen = screenId;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === screenId);
  });
  if (screenId === 'screenShop')     renderShop();
  if (screenId === 'screenProgress') { renderProgress(); updateAnalyticsLock(); }
}

// ===== EXPOSE GLOBALS FOR HTML ONCLICK HANDLERS =====
window.navigate      = navigate;
window.openGoalSheet = openGoalSheet;
window.closeGoalSheet = closeGoalSheet;
window.saveGoal      = saveGoal;
window.openCheckin     = openCheckin;
window.closeCheckin    = closeCheckin;
window.submitCheckin   = () => { submitCheckin(); };
window.validateCheckin = validateCheckin;
window.closeFail     = closeFail;
window.openPanic      = openPanic;
window.closePanic     = closePanic;
window.startAdventure   = startAdventure;
window.startMiniGame    = startMiniGame;
window.closeMiniGame    = closeMiniGame;
window.openAdvFullView  = openAdvFullView;
window.closeAdvFullView = closeAdvFullView;
window.openUrgeInterrupt  = openUrgeInterrupt;
window.closeUrgeInterrupt = closeUrgeInterrupt;
window.openFeedOverlay    = openFeedOverlay;
window.closeFeedOverlay   = closeFeedOverlay;
// Leaves shop buy — exposed for shop onclick
window.buyLeavesShop = function() {
  if (buyLeaves()) {
    renderShop();
    updateUI();
  }
};

window.setSelectedAnimal = setSelectedAnimal;
window.switchRoomDir     = switchRoomDir;

// ===== ANIMAL FOOD LABEL ADAPTATION =====
const ANIMAL_TOPBAR_ICONS = {
  koala: `<svg width="30" height="30" viewBox="0 0 32 32" fill="none"><circle cx="8" cy="10" r="6" fill="#9E9E9E"/><circle cx="8" cy="10" r="3.5" fill="#C4A882"/><circle cx="24" cy="10" r="6" fill="#9E9E9E"/><circle cx="24" cy="10" r="3.5" fill="#C4A882"/><ellipse cx="16" cy="16" rx="11" ry="10" fill="#9E9E9E"/><ellipse cx="16" cy="18" rx="7" ry="6" fill="#E8E0D8"/><circle cx="12.5" cy="15" r="2" fill="#3D3229"/><circle cx="11.5" cy="14" r=".7" fill="#fff"/><circle cx="19.5" cy="15" r="2" fill="#3D3229"/><circle cx="18.5" cy="14" r=".7" fill="#fff"/><ellipse cx="16" cy="19" rx="2.5" ry="1.8" fill="#5C4A3A"/></svg>`,
  bear:  `<svg width="30" height="30" viewBox="0 0 32 32" fill="none"><circle cx="8" cy="10" r="6" fill="#6B4B2A"/><circle cx="8" cy="10" r="3.5" fill="#C4A882"/><circle cx="24" cy="10" r="6" fill="#6B4B2A"/><circle cx="24" cy="10" r="3.5" fill="#C4A882"/><ellipse cx="16" cy="16" rx="11" ry="10" fill="#7B5B3A"/><ellipse cx="16" cy="18" rx="7" ry="6" fill="#D4B896"/><circle cx="12.5" cy="15" r="2" fill="#1A0800"/><circle cx="11.5" cy="14" r=".7" fill="#fff"/><circle cx="19.5" cy="15" r="2" fill="#1A0800"/><circle cx="18.5" cy="14" r=".7" fill="#fff"/><ellipse cx="16" cy="19" rx="2.5" ry="1.8" fill="#3A1A00"/></svg>`,
  bunny: `<svg width="30" height="30" viewBox="0 0 36 32" fill="none"><ellipse cx="11" cy="7" rx="4" ry="8" fill="#D0D0D0"/><ellipse cx="25" cy="7" rx="4" ry="8" fill="#D0D0D0"/><ellipse cx="11" cy="7" rx="2.2" ry="6" fill="#F8B8C8"/><ellipse cx="25" cy="7" rx="2.2" ry="6" fill="#F8B8C8"/><ellipse cx="18" cy="20" rx="11" ry="10" fill="#E0E0E0"/><ellipse cx="18" cy="22" rx="7" ry="6" fill="#F8F8F8"/><circle cx="14.5" cy="19" r="2" fill="#4A1A4A"/><circle cx="13.5" cy="18" r=".7" fill="#fff"/><circle cx="21.5" cy="19" r="2" fill="#4A1A4A"/><circle cx="20.5" cy="18" r=".7" fill="#fff"/><ellipse cx="18" cy="23" rx="2" ry="1.5" fill="#D05070"/></svg>`,
  dog:   `<svg width="30" height="30" viewBox="0 0 32 32" fill="none"><ellipse cx="5" cy="14" rx="4" ry="7" fill="#B8904A" transform="rotate(-15 5 14)"/><ellipse cx="27" cy="14" rx="4" ry="7" fill="#B8904A" transform="rotate(15 27 14)"/><ellipse cx="16" cy="16" rx="11" ry="10" fill="#C8A06A"/><ellipse cx="16" cy="18" rx="7" ry="6" fill="#F0E0C0"/><circle cx="12.5" cy="15" r="2" fill="#2A1800"/><circle cx="11.5" cy="14" r=".7" fill="#fff"/><circle cx="19.5" cy="15" r="2" fill="#2A1800"/><circle cx="18.5" cy="14" r=".7" fill="#fff"/><ellipse cx="16" cy="20" rx="3" ry="2" fill="#1A0A00"/></svg>`,
};

const ANIMAL_DEFAULT_NAMES = {
  koala: 'Koala Calm', bear: 'Bear Calm', bunny: 'Bunny Calm', dog: 'Dog Calm',
};

const ANIMAL_FOOD_ICONS = {
  koala: `<svg viewBox="0 0 44 48" width="22" height="22" fill="none" style="flex-shrink:0"><ellipse cx="22" cy="28" rx="15" ry="19" fill="#4CAF50" transform="rotate(-15 22 28)"/><path d="M22 46 Q18 34 13 20" stroke="#2E7D32" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`,
  bear:  `<svg viewBox="0 0 32 32" width="22" height="22" fill="none" style="flex-shrink:0"><ellipse cx="16" cy="18" rx="10" ry="12" fill="#F9A825"/><ellipse cx="16" cy="17" rx="7" ry="9" fill="#FFC107" opacity=".7"/><ellipse cx="16" cy="12" rx="5" ry="3" fill="#E65100" opacity=".8"/></svg>`,
  bunny: `<svg viewBox="0 0 32 32" width="22" height="22" fill="none" style="flex-shrink:0"><ellipse cx="16" cy="20" rx="6" ry="10" fill="#FF7043"/><ellipse cx="11" cy="9" rx="3" ry="6" fill="#4CAF50" transform="rotate(-15 11 9)"/><ellipse cx="21" cy="9" rx="3" ry="6" fill="#4CAF50" transform="rotate(15 21 9)"/></svg>`,
  dog:   `<svg viewBox="0 0 36 24" width="28" height="18" fill="none" style="flex-shrink:0"><rect x="2" y="8" width="32" height="8" rx="4" fill="#D4A574"/><rect x="2" y="8" width="32" height="8" rx="4" fill="none" stroke="#A07040" stroke-width="1.5"/><ellipse cx="4" cy="12" rx="3" ry="5" fill="#D4A574" stroke="#A07040" stroke-width="1.5"/><ellipse cx="32" cy="12" rx="3" ry="5" fill="#D4A574" stroke="#A07040" stroke-width="1.5"/></svg>`,
};
const ANIMAL_FEED_SUBS = {
  koala: 'Drag a leaf up to your koala to feed them!',
  bear:  'Drag a honey jar up to your bear to feed them!',
  bunny: 'Drag a carrot up to your bunny to feed them!',
  dog:   'Drag a treat up to your dog to feed them!',
};
const ANIMAL_FEED_BTNS = {
  koala: 'Feed Koala', bear: 'Feed Bear', bunny: 'Feed Bunny', dog: 'Feed Dog',
};

function updateAnimalFoodUI() {
  const animal = state.selectedAnimal || 'koala';
  const foodName = ANIMAL_FOOD[animal] || 'Eucalyptus Leaves';

  // Shop label
  const shopLbl = document.getElementById('shopFoodLabel');
  if (shopLbl) shopLbl.textContent = foodName;

  // Feed overlay
  const titleIcon = document.getElementById('feedOverlayIcon');
  if (titleIcon) titleIcon.outerHTML = ANIMAL_FOOD_ICONS[animal] || ANIMAL_FOOD_ICONS.koala;
  const titleText = document.getElementById('feedOverlayTitleText');
  if (titleText) titleText.textContent = 'Feed Your ' + ANIMAL_NAMES[animal];
  const sub = document.getElementById('feedOverlaySub');
  if (sub) sub.textContent = ANIMAL_FEED_SUBS[animal] || ANIMAL_FEED_SUBS.koala;

  // Feed button
  const feedBtn = document.getElementById('feedBtnLabel');
  if (feedBtn) feedBtn.textContent = ANIMAL_FEED_BTNS[animal] || 'Feed Koala';

  // Top bar icon
  const topBarIcon = document.getElementById('topBarAnimalIcon');
  if (topBarIcon) topBarIcon.innerHTML = ANIMAL_TOPBAR_ICONS[animal] || ANIMAL_TOPBAR_ICONS.koala;

  // App name: update default if user hasn't set a custom name
  const nameEl = document.getElementById('koalaName');
  if (nameEl && !state.koalaName) {
    nameEl.textContent = ANIMAL_DEFAULT_NAMES[animal] || 'Koala Calm';
  }

  // Re-render shop (it may have the old food name)
  renderShop();
}

// Called by koalaSystem after animal confirmation
window._onAnimalChanged = function(animal) {
  updateAnimalFoodUI();
  // Toast confirmation
  const names = { koala:'Koala', bear:'Bear', bunny:'Bunny', dog:'Dog' };
  _toast('Switched to ' + (names[animal] || animal) + '!', '#7CB97A');
};

// ===== KOALA NAMING =====
window.promptKoalaName = function() {
  const overlay = document.getElementById('nameModalOverlay');
  const input   = document.getElementById('nameModalInput');
  if (!overlay || !input) return;
  input.value = state.koalaName || '';
  overlay.style.display = 'flex';
  setTimeout(() => input.focus(), 100);
};
window.closeNameModal = function() {
  const overlay = document.getElementById('nameModalOverlay');
  if (overlay) overlay.style.display = 'none';
};
window.saveKoalaName = function() {
  const input = document.getElementById('nameModalInput');
  const name  = input ? input.value.trim() : '';
  if (name) {
    state.koalaName = name;
    save();
    applyKoalaName();
  }
  window.closeNameModal();
};
function applyKoalaName() {
  const el = document.getElementById('koalaName');
  if (el) {
    const animal = state.selectedAnimal || 'koala';
    el.textContent = state.koalaName || ANIMAL_DEFAULT_NAMES[animal] || 'Koala Calm';
  }
}

// ===== SETTINGS =====
window.openSettings = function() {
  const overlay = document.getElementById('settingsOverlay');
  const sheet   = document.getElementById('settingsSheet');
  if (overlay) overlay.classList.add('open');
  if (sheet)   { sheet.classList.add('open'); sheet.scrollTop = 0; }
  const toggle = document.getElementById('darkModeToggle');
  if (toggle) toggle.checked = !!state.settings?.darkMode;
  // Update rename sub-text
  const nameSub = document.getElementById('settingsKoalaNameSub');
  if (nameSub) nameSub.textContent = state.petName ? `Currently: "${state.petName}"` : "Tap to change your koala's name";
  // Update scenery buttons
  const sc = state.scenery || 'default';
  document.querySelectorAll('.scenery-pill').forEach(b => b.classList.remove('active-scenery'));
  const scBtn = document.getElementById('sceneryBtn_' + sc);
  if (scBtn) scBtn.classList.add('active-scenery');
};
window.closeSettings = function() {
  const overlay = document.getElementById('settingsOverlay');
  const sheet   = document.getElementById('settingsSheet');
  if (overlay) overlay.classList.remove('open');
  if (sheet)   sheet.classList.remove('open');
};
window.setScenery = function(name) {
  if (!state.scenery) state.scenery = 'default';
  state.scenery = name;
  save();
  document.querySelectorAll('.scenery-pill').forEach(b => b.classList.remove('active-scenery'));
  const btn = document.getElementById('sceneryBtn_' + name);
  if (btn) btn.classList.add('active-scenery');
  const filters = { default:'none', desert:'hue-rotate(28deg) saturate(1.3) brightness(1.04)', snow:'hue-rotate(195deg) saturate(.45) brightness(1.18)', beach:'hue-rotate(-18deg) saturate(1.35) brightness(1.07)', city:'hue-rotate(220deg) saturate(.6) brightness(.93)' };
  const f = filters[name] || 'none';
  ['sceneFar','sceneMid','sceneNear'].forEach(id => { const el = document.getElementById(id); if (el) el.style.filter = f; });
  const floor = document.getElementById('roomFloor');
  if (floor) { const fc = { default:'', desert:'filter:sepia(.4) hue-rotate(10deg)', snow:'filter:brightness(1.3) hue-rotate(195deg) saturate(.3)', beach:'filter:sepia(.2) brightness(1.1)', city:'filter:brightness(.85) saturate(.7)' }; floor.style.cssText = fc[name] || ''; }
};
window.toggleDarkMode = function(enabled) {
  document.body.classList.toggle('dark', enabled);
  if (!state.settings) state.settings = {};
  state.settings.darkMode = enabled;
  save();
};
window.openHelp = function() {
  const el = document.getElementById('helpOverlay');
  if (!el) return;
  el.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
};
window.closeHelp = function() {
  const el = document.getElementById('helpOverlay');
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 350);
};

// ===== SICK STATE MANAGEMENT =====
window.updateSickOverlay = function() {
  const sick = !!state.koalaSick;
  const overlay = document.getElementById('sickOverlay');
  if (overlay) overlay.style.display = sick ? 'flex' : 'none';
  document.body.classList.toggle('koala-sick', sick);

  // Update coin count inside sick overlay
  const sickCoins = document.getElementById('sickCoinsDisplay');
  if (sickCoins) sickCoins.textContent = state.coins;
};

window.healKoala = function() {
  if (state.coins < 30) {
    _toast('Need 30 coins to heal! Check in to earn more.', '#FF6B6B');
    return;
  }
  state.coins -= 30;
  state.koalaSick = false;
  state.energy = Math.max(state.energy || 0, 25); // restore to at least 25%
  save();
  window.updateSickOverlay();
  updateUI();
  _toast('Your koala is feeling better!', '#7CB97A');
};

// ===== TOAST NOTIFICATION HELPER =====
function _toast(msg, bgColor) {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${bgColor||'#333'};color:white;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;max-width:300px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);animation:fadeInUp .3s ease-out;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOutDown .3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== PREMIUM SUBSCRIPTION =====
window.purchasePremium = function() {
  try { window.webkit?.messageHandlers?.purchasePremium?.postMessage({}); }
  catch(e) { console.warn('[Premium] Not in WKWebView'); }
};

window.checkPremiumStatus = function() {
  try { window.webkit?.messageHandlers?.checkPremiumStatus?.postMessage({}); }
  catch(e) { console.warn('[Premium] Not in WKWebView'); }
};

window.restorePurchases = function() {
  try { window.webkit?.messageHandlers?.restorePurchases?.postMessage({}); }
  catch(e) { console.warn('[Premium] Not in WKWebView'); }
};

window.manageSubscription = function() {
  try { window.webkit?.messageHandlers?.manageSubscription?.postMessage({}); }
  catch(e) { console.warn('[Premium] manageSubscription: not in WKWebView'); }
};

// Called FROM iOS if purchase fails (product not found, payment error, etc.)
window.onPremiumPurchaseFailed = function(error) {
  console.warn('[Premium] Purchase failed:', error);
  if (String(error).includes('not found') || String(error).includes('invalid')) {
    _toast('Purchase unavailable right now. Try again later.', '#FF6B6B');
  } else {
    _toast('Purchase failed: ' + error, '#FF6B6B');
  }
};

// Called FROM iOS after successful subscription
window.onSubscriptionStarted = function(data) {
  state.premium.isSubscribed = true;
  state.premium.subscriptionExpiresAt = data.expiresAt;  // iOS provides timestamp
  state.premium.subscriptionRenewsAt = data.renewsAt;
  state.premium.productId = data.productId;
  save();
  updatePremiumUI();
  _toast('Welcome to Premium!', '#FFD700');
};

// Called FROM iOS after checking status
window.onPremiumStatusChecked = function(data) {
  const wasSubscribed = !!state.premium?.isSubscribed;
  if (data.isSubscribed) {
    state.premium.isSubscribed = true;
    state.premium.subscriptionExpiresAt = data.expiresAt || 0;
    state.premium.subscriptionRenewsAt = data.renewsAt || 0;
    if (!wasSubscribed) _toast('Welcome to Premium! Enjoy all the perks!', '#FFD700');
  } else {
    state.premium.isSubscribed = false;
  }
  save();
  updatePremiumUI();
};

// Called FROM iOS when subscription is cancelled
window.onSubscriptionCancelled = function() {
  state.premium.isSubscribed = false;
  save();
  updatePremiumUI();
  _toast('Premium subscription cancelled', '#FF6B6B');
};

// Check subscription expiry periodically
function checkSubscriptionStatus() {
  if (!state.premium?.isSubscribed) return;
  const exp = state.premium.subscriptionExpiresAt;
  if (exp && Date.now() > exp) {
    state.premium.isSubscribed = false;
    save();
    updatePremiumUI();
  }
}

// Update premium UI (show/hide the correct view on the Premium screen)
function updatePremiumUI() {
  const isSubscribed = !!state.premium?.isSubscribed;
  const activeView  = document.getElementById('premiumActiveView');
  const upsellView  = document.getElementById('premiumUpsellView');
  if (activeView) activeView.style.display = isSubscribed ? 'block' : 'none';
  if (upsellView) upsellView.style.display = isSubscribed ? 'none'  : 'block';

  // Hide/show the settings subscribe button
  const premiumBtn = document.getElementById('premiumBtn');
  if (premiumBtn) premiumBtn.style.display = isSubscribed ? 'none' : '';

  // Update renews text
  if (isSubscribed && state.premium?.subscriptionExpiresAt) {
    const d = new Date(state.premium.subscriptionExpiresAt);
    const txt = document.getElementById('premiumRenewsText');
    if (txt) txt.textContent = 'Renews ' + d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  // Sync animal selector selection state
  const selectedAnimal = state.selectedAnimal || 'koala';
  document.querySelectorAll('.animal-selector-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.animal === selectedAnimal);
  });

  // Sync skin card selected state + badges
  const currentSkin = state.settings?.koalaSkin || 'default';
  _updateSkinBadges(currentSkin);

  updateAnalyticsLock();
}

function updateAnalyticsLock() {
  const isSubscribed = !!state.premium?.isSubscribed;
  // Find the Analytics prog-card and add/remove overlay
  const analyticsCard = document.querySelector('.prog-card:has(#analyticsSection)') ||
    (() => { const s = document.getElementById('analyticsSection'); return s?.closest('.prog-card'); })();
  const focusCard = document.querySelector('.prog-card:has(#focusStatsSection)') ||
    (() => { const s = document.getElementById('focusStatsSection'); return s?.closest('.prog-card'); })();
  const goalCard = document.querySelector('.prog-card:has(#goalLogList)') ||
    (() => { const s = document.getElementById('goalLogList'); return s?.closest('.prog-card'); })();
  const histCard = document.querySelector('.prog-card:has(#historyList)') ||
    (() => { const s = document.getElementById('historyList'); return s?.closest('.prog-card'); })();

  [analyticsCard, focusCard, goalCard, histCard].forEach(card => {
    if (!card) return;
    card.style.position = 'relative';
    let overlay = card.querySelector('.analytics-lock-overlay');
    if (!isSubscribed) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'analytics-lock-overlay';
        overlay.innerHTML = `
          <div class="analytics-lock-inner">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <div class="analytics-lock-title">Premium Required</div>
            <button class="analytics-lock-btn" onclick="navigate('screenPremium')">Unlock with Premium</button>
          </div>`;
        card.appendChild(overlay);
      }
    } else if (overlay) {
      overlay.remove();
    }
  });
}

// Helper — update all skin card selected state + Equipped / Premium badges
function _updateSkinBadges(activeSkin) {
  const skinNames = { default:'Classic', golden:'Golden', midnight:'Midnight', sakura:'Sakura' };
  document.querySelectorAll('.skin-card').forEach(c => {
    const s = c.dataset.skin || (c.getAttribute('onclick') || '').match(/selectKoalaSkin\('([^']+)'\)/)?.[1];
    if (!s) return;
    c.classList.toggle('selected', s === activeSkin);
    const badge = c.querySelector('.skin-badge');
    if (!badge) return;
    if (s === activeSkin) {
      badge.textContent = 'Equipped';
      badge.className   = 'skin-badge default-badge';
    } else if (s === 'default') {
      badge.textContent = 'Classic';
      badge.className   = 'skin-badge default-badge';
    } else {
      badge.textContent = 'Premium';
      badge.className   = 'skin-badge premium-badge-sm';
    }
  });
}

// Koala skin selection (premium)
window.selectKoalaSkin = function(skin) {
  if (!state.premium?.isSubscribed && skin !== 'default') {
    purchasePremium();
    return;
  }
  if (!state.settings) state.settings = {};
  state.settings.koalaSkin = skin;
  save();
  applyAnimalSkin();
  _updateSkinBadges(skin);
};

// ===== PREMIUM ONBOARDING MODAL =====
function showPremiumOnboarding() {
  if (state.premium?.isSubscribed) return;
  const modal = document.getElementById('premiumOnboardingModal');
  if (!modal) return;
  modal.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const sheet = modal.querySelector('div');
    if (sheet) { sheet.style.transform = 'translateY(100%)'; sheet.style.transition = 'none'; }
    requestAnimationFrame(() => {
      if (sheet) { sheet.style.transition = 'transform .45s cubic-bezier(.32,.72,.36,1)'; sheet.style.transform = 'translateY(0)'; }
    });
  }));
}

window.closePremiumOnboarding = function() {
  const modal = document.getElementById('premiumOnboardingModal');
  if (!modal) return;
  const sheet = modal.querySelector('div');
  if (sheet) {
    sheet.style.transition = 'transform .35s cubic-bezier(.4,0,1,1)';
    sheet.style.transform = 'translateY(100%)';
    setTimeout(() => { modal.style.display = 'none'; }, 360);
  } else {
    modal.style.display = 'none';
  }
};

// Slider live-update
window.updateDiffVal = (val) => {
  const el = document.getElementById('diffVal');
  if (el) el.textContent = val;
};

// ===== FIX SCREEN SIZING FOR DYNAMIC TOP BAR =====
function fixScreens() {
  const tb      = document.querySelector('.top-bar');
  const screens = document.querySelectorAll('.screen');
  const h       = tb ? tb.offsetHeight : 56;
  screens.forEach(s => {
    s.style.top    = h + 'px';
    s.style.height = `calc(100% - ${h}px - var(--nav-h))`;
  });
}

// ===== EVENT SYSTEM LOOP =====
let _eventTimer = null;
function startEventLoop() {
  if (_eventTimer) clearInterval(_eventTimer);
  _eventTimer = setInterval(() => {
    // Only trigger events on home screen, with ~15% chance per check
    if (_activeScreen !== 'screenHome') return;
    if (Math.random() > 0.15) return;

    const event = tryRandomEvent();
    if (event) {
      showEventToast(event);
      // Update coin display if coins changed
      const coinEl = document.getElementById('coinCount');
      if (coinEl) coinEl.textContent = state.coins;
      updateEnergyUI();
      updateHealthUI();
    }
  }, 45000); // check every 45 seconds
}

// ===== MOOD UPDATE LOOP =====
let _moodTimer = null;
function startMoodLoop() {
  if (_moodTimer) clearInterval(_moodTimer);
  _moodTimer = setInterval(() => {
    updateMood();
  }, 120000); // update mood every 2 minutes
}

// ===== BOOT =====
function boot() {
  // 1. Check if we need a day reset
  checkDayReset();

  // 2. Process offline progression
  const offlineResults = processOfflineProgression();

  // 3. Wire up sleep state callback (breaks circular dep)
  registerSleepCallback(showSleepState);

  // 4. Wire up goalUI callback in shopSystem (breaks circular dep)
  registerGoalUICallback(updateGoalUI);

  // 5. Generate environment elements
  genStars();
  genFloor();
  genClouds();
  genRain();
  genSnow();

  // 6. Initial UI render
  updateUI();
  renderShop();
  renderProgress();

  // 6b. Initialize room system
  const _rc = document.getElementById('roomContainer');
  if (_rc) _rc.dataset.room = state.currentRoom || 'living';
  const _roomNameEl = document.getElementById('roomNavName');
  if (_roomNameEl) _roomNameEl.textContent = { living:'Living Room', kitchen:'Kitchen', bedroom:'Bedroom' }[state.currentRoom || 'living'] || 'Living Room';
  document.getElementById('kitchenScene')?.classList.toggle('active', (state.currentRoom || 'living') === 'kitchen');
  document.getElementById('bedroomScene')?.classList.toggle('active', (state.currentRoom || 'living') === 'bedroom');

  // 6c. Restore scenery
  if (state.scenery && state.scenery !== 'default') { window.setScenery(state.scenery); }

  // 7. Start koala life systems
  startBlinking();
  startEarTwitches();
  startTailWag();
  startIdleBehaviors();
  initKoalaEvents();
  applyAnimalSkin();
  updateAnimalFoodUI();

  // 8. Start environment systems
  startShootingStars();
  startAmbientParticles();

  // 9. Weather (if purchased)
  if (state.ownedItems.includes('weather')) fetchWeather();

  // 10. New systems
  updateMood();
  updateXPUI();
  updateBondUI();
  updateLeavesUI();
  updateFeedBtn();
  checkSubscriptionStatus();
  updatePremiumUI();
  window.updateSickOverlay();

  // Handle any Swift callbacks that fired before the module finished loading
  if (window._pendingPremiumStatus) {
    window.onPremiumStatusChecked(window._pendingPremiumStatus);
    delete window._pendingPremiumStatus;
  }
  if (window._pendingSubscriptionStarted) {
    window.onSubscriptionStarted(window._pendingSubscriptionStarted);
    delete window._pendingSubscriptionStarted;
  }
  if (window._pendingPremiumFail) {
    window.onPremiumPurchaseFailed(window._pendingPremiumFail);
    delete window._pendingPremiumFail;
  }
  if (window._pendingSubscriptionCancelled) {
    window.onSubscriptionCancelled();
    delete window._pendingSubscriptionCancelled;
  }

  startEventLoop();
  startMoodLoop();
  initNotifications();

  // 11. Periodic updates
  setInterval(() => { if (state.ownedItems.includes('weather')) fetchWeather(); }, 600000);
  setInterval(applyToD, 60000);
  setInterval(() => { checkDayReset(); updateUI(); }, 60000);
  // Adventure banner refresh every minute
  _refreshAdvBanner();
  setInterval(_refreshAdvBanner, 60000);
  // Active energy drain: 3 per 12 min = 15/hr (from full to 0 in ~6.7 hrs)
  setInterval(() => { activeEnergyDrain(); updateEnergyUI(); updateFeedBtn(); window.updateSickOverlay(); }, 720000);
  // Check subscription status periodically
  setInterval(() => { checkSubscriptionStatus(); }, 300000); // Every 5 min

  // 12. Screen sizing + koala name + dark mode
  fixScreens();
  applyKoalaName();
  if (state.settings?.darkMode) document.body.classList.add('dark');
  window.addEventListener('resize', fixScreens);

  // 13. Show offline message if returning after long absence
  if (offlineResults && offlineResults.hoursAway >= 1) {
    setTimeout(() => showOfflineMessage(offlineResults), 1200);
  }

  // 14. Capacitor app lifecycle (if running in Capacitor)
  _initCapacitorListeners();

  console.log('[KoalaCalm] Boot complete (v2 with energy, mood, events, focus mode)');

  // Premium upsell nudges
  if (!state.premium?.isSubscribed) startPremiumUpsellLoop();
}

// ===== PREMIUM UPSELL NUDGES =====
const _upsellMsgs = [
  'Earn 1.5x XP on every check-in with Premium!',
  'Unlock your full analytics history with Premium!',
  'Protect your streak — miss a day without losing it!',
  'Exclusive Golden, Midnight &amp; Sakura koala skins!',
  'Switch companions — play as a Bear, Bunny, or Dog!',
];
let _upsellIdx = 0;

function showPremiumNudge() {
  if (state.premium?.isSubscribed) return;
  if (_activeScreen !== 'screenHome') return;
  const msg = _upsellMsgs[_upsellIdx % _upsellMsgs.length];
  _upsellIdx++;
  const el = document.createElement('div');
  el.className = 'premium-nudge-banner';
  el.innerHTML = `<div class="premium-nudge-text">${msg}</div><button class="premium-nudge-btn" onclick="navigate('screenPremium');this.closest('.premium-nudge-banner').remove()">Upgrade →</button><button class="premium-nudge-close" onclick="this.closest('.premium-nudge-banner').remove()">✕</button>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
  }, 7000);
}

function startPremiumUpsellLoop() {
  // First nudge after 3 minutes, then every 9 minutes
  setTimeout(() => {
    showPremiumNudge();
    setInterval(() => showPremiumNudge(), 9 * 60 * 1000);
  }, 3 * 60 * 1000);
}

// ===== CAPACITOR INTEGRATION =====
async function _initCapacitorListeners() {
  if (typeof window.Capacitor === 'undefined') return;

  try {
    const { App } = await import('@capacitor/app');
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkDayReset();
        const offlineResults = processOfflineProgression();
        updateUI();
        if (state.ownedItems.includes('weather')) fetchWeather();
        if (offlineResults && offlineResults.hoursAway >= 1) {
          setTimeout(() => showOfflineMessage(offlineResults), 800);
        }
      }
    });

    if (state.settings?.notifications) {
      await _setupNotifications();
    }
  } catch (e) {
    // Not running in Capacitor
  }
}

async function _setupNotifications() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    const now      = new Date();
    const reminder = new Date(now);
    reminder.setHours(20, 0, 0, 0);
    if (reminder <= now) reminder.setDate(reminder.getDate() + 1);

    await LocalNotifications.schedule({
      notifications: [{
        title: '\u{1F428} Koala Calm',
        body: "Time for your nightly check-in! How was today's screen time?",
        id: 1,
        schedule: { at: reminder, repeats: true, every: 'day' },
        sound: null,
        smallIcon: 'ic_stat_koala',
      }]
    });
  } catch (e) {
    console.warn('[Notifications] Could not schedule:', e);
  }
}

// Start when DOM is ready
async function _start() {
  await runSplash();
  if (shouldShowOnboarding()) {
    // New user: run full onboarding, then boot (no premium modal for brand-new users)
    await runOnboarding();
    boot();
  } else {
    // Returning user: boot immediately, show premium modal after short delay
    boot();
    setTimeout(showPremiumOnboarding, 400);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _start);
} else {
  _start();
}
