// ===== GOAL SYSTEM =====
// Manages goal setting, nightly check-in, rewards, and main UI updates
// Now with improved health, energy, mood, and offline progression

import { state, save, isTodayDone } from './state.js';
import { isSubscriptionActive } from './modifierSystem.js';
import { renderDecor, celebrate }    from './koalaSystem.js';
import { updateShopNotif }           from './shopSystem.js';
import { applyToD, updateWeatherBadge, transitionToNight } from './environmentSystem.js';
import { addCheckinEnergy, updateEnergyUI } from './energySystem.js';
import { updateMood, updateMoodUI, storeLastDayResult, getMemoryMessage } from './moodSystem.js';
import { addXP, checkStreakXP, updateXPUI } from './xpSystem.js';
import { addBond, updateBondUI } from './bondSystem.js';
import { emojiSVG } from './emojiSVG.js';
import { updateFeedBtn, updateLeavesUI } from './feedingSystem.js';

// ===== HEALTH UI =====
export function updateHealthUI() {
  const health = Math.max(0, Math.min(100, state.health || 100));
  const fill = document.getElementById('healthBarFill');
  const pct  = document.getElementById('healthPct');
  const bandaids = document.getElementById('bandaids');
  const koalaScene = document.getElementById('koalaSitting');
  const kb = document.getElementById('koalaBody');

  if (fill) {
    fill.style.width = health + '%';
    fill.classList.remove('low', 'mid');
    if (health <= 30) fill.classList.add('low');
    else if (health <= 60) fill.classList.add('mid');
  }
  if (pct) {
    pct.textContent = health + '%';
    pct.classList.remove('low', 'mid');
    if (health <= 30) pct.classList.add('low');
    else if (health <= 60) pct.classList.add('mid');
  }

  if (bandaids) {
    bandaids.setAttribute('opacity', health < 70 ? '1' : '0');
  }

  if (kb) {
    if (health < 70 && kb.classList.contains('idle')) {
      kb.classList.remove('idle');
      kb.classList.add('hurt');
    } else if (health >= 70 && kb.classList.contains('hurt')) {
      kb.classList.remove('hurt');
      kb.classList.add('idle');
    }
  }

  // Visual effects at low health: dim the koala
  if (koalaScene) {
    koalaScene.classList.toggle('hurt-slow', health < 70);
    if (health <= 30) {
      koalaScene.style.filter = 'brightness(0.7) saturate(0.6)';
    } else if (health <= 50) {
      koalaScene.style.filter = 'brightness(0.85) saturate(0.8)';
    } else {
      koalaScene.style.filter = '';
    }
  }
}

// ===== GOAL UI =====
export function updateGoalUI() {
  const total = state.goalHours * 60 + state.goalMinutes + (state.extraMinutes || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const el = document.getElementById('goalDisplay');
  if (el) el.textContent = h + 'h ' + String(m).padStart(2, '0') + 'm';
}

// ===== MAIN UI UPDATE =====
export function updateUI() {
  if (state.todayCheckedIn && state.todayCheckedIn !== new Date().toDateString()) {
    state.todayCheckedIn  = null;
    state.extraMinutes    = 0;
    save();
  }

  document.getElementById('coinCount').textContent = state.coins;
  updateGoalUI();
  updateShopNotif();
  renderDecor();
  applyToD();
  updateWeatherBadge();
  updateEnergyUI();
  updateMoodUI();
  updateXPUI();
  updateBondUI();
  updateLeavesUI();
  updateFeedBtn();

  // Memory message (yesterday's result)
  const memMsg = getMemoryMessage();
  const memEl = document.getElementById('memoryMessage');
  if (memEl && memMsg && !state.todayCheckedIn) {
    memEl.textContent = memMsg;
    memEl.style.display = 'block';
  } else if (memEl) {
    memEl.style.display = 'none';
  }

  // Streak badge
  if (state.streak >= 2 || state.streakPaused) {
    const sm = document.getElementById('streakMini');
    const st = document.getElementById('streakMiniText');
    if (sm) sm.style.display = 'block';
    if (state.streakPaused) {
      if (sm) sm.classList.add('streak-paused');
      if (st) st.textContent = state.streak + ' day streak ⏸';
    } else {
      if (sm) sm.classList.remove('streak-paused');
      if (st) st.textContent = state.streak + ' day streak!';
    }
  } else {
    const sm = document.getElementById('streakMini');
    if (sm) { sm.style.display = 'none'; sm.classList.remove('streak-paused'); }
  }

  // Check-in button state
  const btn = document.getElementById('checkinBtn');
  if (btn) {
    if (isTodayDone()) {
      btn.disabled = true;
      btn.innerHTML = emojiSVG('checkmark',14) + ' Done for Today';
    } else {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-shine"></span>Check In';
    }
  }
}

// ===== GOAL SHEET =====
export function openGoalSheet() {
  const gh = document.getElementById('goalHours');
  const gm = document.getElementById('goalMinutes');
  if (gh) gh.value = state.goalHours;
  if (gm) gm.value = state.goalMinutes;
  document.getElementById('goalOverlay')?.classList.add('open');
  document.getElementById('goalSheet')?.classList.add('open');
}

export function closeGoalSheet() {
  document.getElementById('goalOverlay')?.classList.remove('open');
  document.getElementById('goalSheet')?.classList.remove('open');
}

export function saveGoal() {
  const h = Math.max(0, Math.min(24, parseInt(document.getElementById('goalHours')?.value) || 0));
  const m = Math.max(0, Math.min(59, parseInt(document.getElementById('goalMinutes')?.value) || 0));

  if (h !== state.goalHours || m !== state.goalMinutes) {
    state.goalLog.push({ date: new Date().toISOString(), hours: h, minutes: m });
    if (state.goalLog.length > 20) state.goalLog = state.goalLog.slice(-20);
  }

  state.goalHours    = h;
  state.goalMinutes  = m;
  state.extraMinutes = 0;
  save();
  updateGoalUI();
  closeGoalSheet();
}

// ===== CHECK-IN SHEET =====
export function openCheckin() {
  if (isTodayDone()) return;
  ['usedHours','usedMinutes','reflectionText'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const slider = document.getElementById('diffSlider');
  const diffVal = document.getElementById('diffVal');
  if (slider) slider.value = 5;
  if (diffVal) diffVal.textContent = '5';
  // Reset submit button to disabled state
  const btn = document.getElementById('checkinSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.45';
    btn.style.pointerEvents = 'none';
    btn.style.cursor = 'not-allowed';
  }
  const hint = document.getElementById('checkinValidHint');
  if (hint) hint.style.display = 'block';
  document.getElementById('checkinOverlay')?.classList.add('open');
  document.getElementById('checkinSheet')?.classList.add('open');
}

export function validateCheckin() {
  const uH = parseInt(document.getElementById('usedHours')?.value) || 0;
  const uM = parseInt(document.getElementById('usedMinutes')?.value) || 0;
  const ref = (document.getElementById('reflectionText')?.value || '').trim();

  const hasTime = uH > 0 || uM > 0;
  const hasReflection = ref.length >= 5;

  const btn = document.getElementById('checkinSubmitBtn');
  const hint = document.getElementById('checkinValidHint');

  if (hasTime && hasReflection) {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      btn.style.cursor = 'pointer';
    }
    if (hint) hint.style.display = 'none';
  } else {
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.45';
      btn.style.pointerEvents = 'none';
      btn.style.cursor = 'not-allowed';
    }
    if (hint) {
      hint.style.display = 'block';
      if (!hasTime && !hasReflection) {
        hint.textContent = 'Enter screen time & write at least 5 characters to continue';
      } else if (!hasTime) {
        hint.textContent = 'Enter your screen time to continue';
      } else {
        hint.textContent = `Reflection needs ${5 - ref.length} more character${5 - ref.length === 1 ? '' : 's'}`;
      }
    }
  }
}

export function closeCheckin() {
  document.getElementById('checkinOverlay')?.classList.remove('open');
  document.getElementById('checkinSheet')?.classList.remove('open');
}

export function submitCheckin() {
  const uH   = parseInt(document.getElementById('usedHours')?.value) || 0;
  const uM   = parseInt(document.getElementById('usedMinutes')?.value) || 0;
  const diff = parseInt(document.getElementById('diffSlider')?.value) || 5;
  const ref  = (document.getElementById('reflectionText')?.value || '').trim();

  const used = uH * 60 + uM;
  const goal = state.goalHours * 60 + state.goalMinutes + (state.extraMinutes || 0);
  const win  = used <= goal;
  let reward = 0;

  const streakPaused = !win && isSubscriptionActive() && state.streak > 0;
  if (win) {
    reward = 10;
    state.streakPaused = false;
    state.streak++;
    if      (state.streak >= 30) reward += 20;
    else if (state.streak >= 14) reward += 15;
    else if (state.streak >= 7)  reward += 10;
    else if (state.streak >= 3)  reward += 5;
  } else if (streakPaused) {
    state.streakPaused = true;
    // Streak preserved — premium benefit
  } else {
    state.streak = 0;
    state.streakPaused = false;
  }

  state.coins       += reward;
  state.todayCheckedIn = new Date().toDateString();
  state.lastHealthDate = new Date().toDateString();
  state.extraMinutes   = 0;
  state.consecutiveMissedDays = 0;

  // Health recovery: checkin +5
  state.health = Math.min(100, (state.health || 0) + 5);

  // Energy gain from check-in
  addCheckinEnergy(win);

  // XP and bond from check-in
  addXP(win ? 30 : 10);
  addBond(win ? 1 : 0);

  // Streak XP milestones
  if (win) checkStreakXP(state.streak);

  // Store result for mood memory
  storeLastDayResult(win);

  // Update mood
  updateMood();

  state.checkins.push({
    date:       new Date().toISOString(),
    usedH:      uH,
    usedM:      uM,
    difficulty: diff,
    reflection: ref,
    success:    win,
    reward:     reward,
  });
  if (state.checkins.length > 30) state.checkins = state.checkins.slice(-30);
  save();
  closeCheckin();

  const now = new Date();
  const hour = now.getHours();
  const shouldSleep = hour >= 20;

  if (win) {
    playReward(reward);
    celebrate(() => { if (shouldSleep) transitionToNight(); });
  } else {
    const failMsg    = document.getElementById('failMsg');
    const failDetail = document.getElementById('failDetail');
    if (failMsg)    failMsg.textContent    = `You used ${uH}h ${uM}m of screen time, which exceeded your ${state.goalHours}h ${String(state.goalMinutes).padStart(2,'0')}m goal. No coins were awarded.`;
    if (failDetail) failDetail.textContent = streakPaused
      ? 'Premium streak shield activated! Your streak is paused, not broken. Check in tomorrow to keep it going!'
      : 'Your streak has been reset. Tomorrow is a fresh start!';
    document.getElementById('failOverlay')?.classList.add('open');
    setTimeout(() => { if (shouldSleep) transitionToNight(); }, 500);
  }

  updateUI();
}

export function closeFail() {
  document.getElementById('failOverlay')?.classList.remove('open');
}

// ===== ADVENTURE HUB =====
const ADV_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

// ── Adventure koala walk state machine ──────────────────────
let _advWalkAF = null;
let _advKoalaX = -70;           // current left position in px
let _advKoalaState = 'walking'; // 'walking' | 'activity'
let _advActivityTimer = null;
let _advFieldWidth = 350;       // updated when overlay opens
const ADV_WALK_SPEED = 52;      // px/s — tuned to match grass animation

function _advStartWalkCycle() {
  if (_advWalkAF) cancelAnimationFrame(_advWalkAF);
  _advKoalaX = -70;
  _advKoalaState = 'walking';
  _advFieldWidth = document.getElementById('advMainCard')?.clientWidth || 350;
  let lastTime = performance.now();

  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;

    if (_advKoalaState === 'walking') {
      _advKoalaX += ADV_WALK_SPEED * dt;
      const koala = document.getElementById('advWalkKoala');
      if (koala) koala.style.left = _advKoalaX + 'px';

      // Trigger activity at a random mid-screen position
      const actX = _advFieldWidth * (0.3 + Math.random() * 0.4);
      if (_advKoalaX > actX && _advKoalaX < actX + ADV_WALK_SPEED * dt + 5 && Math.random() < 0.5) {
        _advDoActivity();
      }

      // Loop back after reaching right edge
      if (_advKoalaX > _advFieldWidth + 60) {
        _advKoalaX = -70;
      }
    }
    _advWalkAF = requestAnimationFrame(tick);
  }
  _advWalkAF = requestAnimationFrame(tick);
}

function _advStopWalkCycle() {
  if (_advWalkAF) { cancelAnimationFrame(_advWalkAF); _advWalkAF = null; }
  if (_advActivityTimer) { clearTimeout(_advActivityTimer); _advActivityTimer = null; }
}

const ADV_ACTIVITIES = [
  { name:'yoga',     thought:'Feeling zen...',    duration:4200, pose:'adv-yoga-pose' },
  { name:'journal',  thought:'Writing thoughts...', duration:5000, pose:'adv-journal-pose' },
  { name:'exercise', thought:'Staying active!',   duration:3500, pose:'adv-exercise-pose' },
  { name:'sit',      thought:'Just enjoying this...', duration:3800, pose:'' },
  { name:'look',     thought:'Wow, so beautiful!', duration:2800, pose:'' },
];

function _advDoActivity() {
  if (_advKoalaState === 'activity') return;
  _advKoalaState = 'activity';
  const act    = ADV_ACTIVITIES[Math.floor(Math.random() * ADV_ACTIVITIES.length)];
  const koala  = document.getElementById('advWalkKoala');
  const thought = document.getElementById('advKoalaThought');
  const journal = document.getElementById('advJournal');
  const eyeL   = document.getElementById('advEyeL');
  const eyeR   = document.getElementById('advEyeR');
  const mouth  = document.getElementById('advMouth');

  if (!koala) { _advKoalaState = 'walking'; return; }

  // Stop walking animations
  koala.className = 'adv-walk-koala stopped';
  if (act.pose) koala.classList.add(act.pose);

  // Show journal prop if journaling
  if (journal) journal.style.opacity = act.name === 'journal' ? '1' : '0';

  // Happy squint for sit/look
  if (act.name === 'sit' || act.name === 'look') {
    if (eyeL) eyeL.setAttribute('ry','1.2');
    if (eyeR) eyeR.setAttribute('ry','1.2');
    if (mouth) mouth.setAttribute('d','M21.5 26 Q25 29 28.5 26');
  }

  // Show thought bubble
  if (thought) {
    thought.textContent = act.thought;
    thought.style.left  = _advKoalaX + 24 + 'px';
    thought.classList.add('show');
  }

  _advActivityTimer = setTimeout(() => {
    // Reset everything
    koala.className = 'adv-walk-koala walking';
    if (journal) journal.style.opacity = '0';
    if (thought) thought.classList.remove('show');
    if (eyeL) eyeL.setAttribute('ry','2.2');
    if (eyeR) eyeR.setAttribute('ry','2.2');
    if (mouth) mouth.setAttribute('d','M22.5 26 Q25 27.5 27.5 26');
    _advKoalaState = 'walking';
  }, act.duration);
}

export function openPanic() {
  const el = document.getElementById('panicFull');
  if (!el) return;
  el.classList.add('open');
  _buildGrass();
  _buildTrees();
  _refreshAdvCard();
  _refreshAdvBanner();
  // Start walk cycle after layout settles
  setTimeout(_advStartWalkCycle, 200);
}

export function closePanic() {
  document.getElementById('panicFull')?.classList.remove('open');
  _advStopWalkCycle();
  // Restore home screen scroll after fixed overlay is dismissed (iOS scroll freeze fix)
  _restoreHomeScroll();
}

function _restoreHomeScroll() {
  const s = document.getElementById('screenHome');
  if (!s) return;
  // Clear any inline style so CSS class takes over, then force iOS scroll repaint
  s.style.overflowY = '';
  void s.offsetHeight; // force reflow
  requestAnimationFrame(() => {
    s.style.overflowY = '';
    // Second frame for stubborn iOS cases
    requestAnimationFrame(() => { s.style.overflowY = ''; });
  });
}

// ── Full-screen adventure view ──────────────────────────────
let _advFullWalkAF = null, _advFullKoalaX = -80, _advFullState = 'walking';
let _advFullActivityTimer = null;

export function openAdvFullView() {
  const el = document.getElementById('advFullView');
  if (!el) return;
  // Only open if adventure is active
  const startMs = state.adventureStart || 0;
  const elapsed = startMs ? Date.now() - startMs : 0;
  if (!startMs || elapsed >= ADV_DURATION_MS) { openPanic(); return; }
  el.classList.add('open');
  _buildFullGrass();
  _buildFullTrees();
  _refreshAdvFullInfo();
  setTimeout(_advFullStartWalk, 150);
}

export function closeAdvFullView() {
  document.getElementById('advFullView')?.classList.remove('open');
  _advFullStopWalk();
  // Restore home screen scroll after fixed overlay is dismissed (iOS scroll freeze fix)
  _restoreHomeScroll();
}

function _buildFullGrass() {
  const strip = document.getElementById('advFullGrass');
  if (!strip || strip.childElementCount > 0) return;
  for (let i = 0; i < 120; i++) {
    const b = document.createElement('div');
    b.className = 'adv-grass-blade'; // reuse same blade style
    const h = 14 + Math.random() * 20, w = 7 + Math.random() * 11;
    b.style.height = h + 'px'; b.style.width = w + 'px';
    b.style.opacity = (0.55 + Math.random() * 0.45).toFixed(2);
    const hue = 100 + Math.random() * 30, sat = 55 + Math.random() * 25;
    b.style.background = `linear-gradient(180deg,hsl(${hue},${sat}%,52%),hsl(${hue+5},${sat-10}%,32%))`;
    strip.appendChild(b);
  }
}

function _buildFullTrees() {
  const layer = document.getElementById('advFullTreeLayer');
  if (!layer || layer.childElementCount > 0) return;
  for (let set = 0; set < 3; set++) {
    for (let i = 0; i < 10; i++) {
      const el = document.createElement('div');
      el.className = 'adv-tree';
      const h = 50 + Math.random() * 50;
      const pine = Math.random() > 0.4;
      el.innerHTML = pine
        ? `<svg viewBox="0 0 28 ${h}" width="28" height="${h}" fill="none"><polygon points="14,2 26,${h} 2,${h}" fill="#2E7D32"/><polygon points="14,${h*.35} 24,${h*.9} 4,${h*.9}" fill="#388E3C"/><rect x="11" y="${h*.9}" width="6" height="${h*.1}" fill="#5D4037"/></svg>`
        : `<svg viewBox="0 0 34 ${h}" width="34" height="${h}" fill="none"><ellipse cx="17" cy="${h*.45}" rx="15" ry="${h*.42}" fill="#43A047"/><ellipse cx="17" cy="${h*.35}" rx="11" ry="${h*.3}" fill="#66BB6A"/><rect x="13.5" y="${h*.82}" width="7" height="${h*.18}" fill="#5D4037"/></svg>`;
      el.style.opacity = (0.5 + Math.random() * 0.45).toFixed(2);
      el.style.marginRight = (15 + Math.random() * 50) + 'px';
      layer.appendChild(el);
    }
  }
}

function _refreshAdvFullInfo() {
  const startMs = state.adventureStart || 0;
  const elapsed = startMs ? Date.now() - startMs : 0;
  const remaining = Math.max(0, ADV_DURATION_MS - elapsed);
  const hrs  = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const pct  = Math.min(100, (elapsed / ADV_DURATION_MS) * 100);
  const timer = document.getElementById('advFullTimer');
  const sub   = document.getElementById('advFullSub');
  const bar   = document.getElementById('advFullBar');
  if (timer) timer.textContent = `${hrs}h ${mins}m remaining`;
  if (sub)   sub.textContent   = `Returns home in ${hrs}h ${mins}m`;
  if (bar)   bar.style.width   = pct + '%';
}

const ADV_FULL_SPEED = 45; // px/s

function _advFullStartWalk() {
  if (_advFullWalkAF) cancelAnimationFrame(_advFullWalkAF);
  _advFullKoalaX = -80; _advFullState = 'walking';
  const scene = document.getElementById('advFullScene');
  const fw = scene?.clientWidth || 400;
  const koala = document.getElementById('advFullKoala');
  if (koala) { koala.className = 'adv-full-koala walking'; }
  let lastT = performance.now(), nextActAt = fw * (0.2 + Math.random() * 0.5);
  function tick(now) {
    const dt = Math.min((now - lastT) / 1000, 0.08); lastT = now;
    if (_advFullState === 'walking') {
      _advFullKoalaX += ADV_FULL_SPEED * dt;
      if (koala) koala.style.left = _advFullKoalaX + 'px';
      if (_advFullKoalaX > nextActAt && _advFullKoalaX < nextActAt + 5) _advFullDoActivity(fw);
      if (_advFullKoalaX > fw + 80) { _advFullKoalaX = -80; nextActAt = fw * (0.2 + Math.random() * 0.5); }
    }
    _advFullWalkAF = requestAnimationFrame(tick);
  }
  _advFullWalkAF = requestAnimationFrame(tick);
}

function _advFullStopWalk() {
  if (_advFullWalkAF) { cancelAnimationFrame(_advFullWalkAF); _advFullWalkAF = null; }
  if (_advFullActivityTimer) { clearTimeout(_advFullActivityTimer); _advFullActivityTimer = null; }
}

function _advFullDoActivity(fw) {
  if (_advFullState === 'activity') return;
  _advFullState = 'activity';
  const acts = [
    { thought:'Feeling zen...', pose:'adv-yoga-pose', j:false, dur:4500, eye:true },
    { thought:'Writing in my journal...', pose:'adv-journal-pose', j:true,  dur:5200, eye:false },
    { thought:'Working out!', pose:'adv-exercise-pose', j:false, dur:3800, eye:false },
    { thought:'What a beautiful day!', pose:'', j:false, dur:3200, eye:true },
    { thought:'Just vibing...', pose:'', j:false, dur:2800, eye:true },
  ];
  const act = acts[Math.floor(Math.random() * acts.length)];
  const koala   = document.getElementById('advFullKoala');
  const thought = document.getElementById('advFullThought');
  const journal = document.getElementById('advFJournal');
  const eyeL    = document.getElementById('advFEyeL');
  const eyeR    = document.getElementById('advFEyeR');
  const mouth   = document.getElementById('advFMouth');
  if (!koala) { _advFullState = 'walking'; return; }
  koala.className = 'adv-full-koala stopped' + (act.pose ? ' ' + act.pose : '');
  if (journal) journal.style.opacity = act.j ? '1' : '0';
  if (act.eye && eyeL) { eyeL.setAttribute('ry','1.2'); eyeR.setAttribute('ry','1.2'); }
  if (act.eye && mouth) mouth.setAttribute('d','M21.5 26 Q25 29 28.5 26');
  if (thought) {
    thought.textContent = act.thought;
    thought.style.left  = _advFullKoalaX + 'px';
    thought.classList.add('show');
  }
  _advFullActivityTimer = setTimeout(() => {
    koala.className = 'adv-full-koala walking';
    if (journal) journal.style.opacity = '0';
    if (thought) thought.classList.remove('show');
    if (eyeL) { eyeL.setAttribute('ry','2.2'); eyeR.setAttribute('ry','2.2'); }
    if (mouth) mouth.setAttribute('d','M22.5 26 Q25 27.5 27.5 26');
    _advFullState = 'walking';
  }, act.dur);
}

function _buildGrass() {
  const strip = document.getElementById('advGrassStrip');
  if (!strip || strip.childElementCount > 0) return;
  // Two full repeats for seamless loop; vary blade sizes for realism
  for (let i = 0; i < 120; i++) {
    const b = document.createElement('div');
    b.className = 'adv-grass-blade';
    const h = 12 + Math.random() * 18;
    const w = 6 + Math.random() * 10;
    b.style.height  = h + 'px';
    b.style.width   = w + 'px';
    b.style.opacity = (0.55 + Math.random() * 0.45).toFixed(2);
    // Slight hue variation: mix of yellow-green and blue-green
    const hue = 100 + Math.random() * 30;
    const sat = 55 + Math.random() * 25;
    b.style.background = `linear-gradient(180deg,hsl(${hue},${sat}%,50%),hsl(${hue+5},${sat-10}%,30%))`;
    strip.appendChild(b);
  }
}

function _buildTrees() {
  const layer = document.getElementById('advTreeLayer');
  if (!layer || layer.childElementCount > 0) return;
  const treeTemplates = [
    // Pine tree
    (h) => `<svg viewBox="0 0 28 ${h}" width="28" height="${h}" fill="none">
      <polygon points="14,2 26,${h} 2,${h}" fill="#2E7D32"/>
      <polygon points="14,${h*0.35} 24,${h*0.9} 4,${h*0.9}" fill="#388E3C"/>
      <rect x="11" y="${h*0.9}" width="6" height="${h*0.12}" fill="#5D4037"/>
    </svg>`,
    // Round tree
    (h) => `<svg viewBox="0 0 32 ${h}" width="32" height="${h}" fill="none">
      <ellipse cx="16" cy="${h*0.45}" rx="14" ry="${h*0.42}" fill="#43A047"/>
      <ellipse cx="16" cy="${h*0.35}" rx="10" ry="${h*0.3}" fill="#66BB6A"/>
      <rect x="13" y="${h*0.82}" width="6" height="${h*0.18}" fill="#5D4037"/>
    </svg>`,
  ];
  // Build 3 sets of trees for seamless loop
  for (let set = 0; set < 3; set++) {
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('div');
      el.className = 'adv-tree';
      const h = 40 + Math.random() * 36;
      const tmpl = treeTemplates[Math.random() > 0.45 ? 0 : 1];
      el.innerHTML = tmpl(Math.round(h));
      el.style.opacity = (0.55 + Math.random() * 0.35).toFixed(2);
      el.style.marginRight = (20 + Math.random() * 40) + 'px';
      layer.appendChild(el);
    }
  }
}

function _refreshAdvCard() {
  const startMs = state.adventureStart || 0;
  const elapsed = startMs ? Date.now() - startMs : 0;
  const active  = startMs && elapsed < ADV_DURATION_MS;
  const titleEl = document.getElementById('advMainTitle');
  const subEl   = document.getElementById('advMainSub');
  if (active) {
    const remaining = ADV_DURATION_MS - elapsed;
    const hrs = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    if (titleEl) titleEl.textContent = 'Adventure In Progress';
    if (subEl)   subEl.textContent   = `Returns in ${hrs}h ${mins}m — tap to explore`;
    const card = document.getElementById('advMainCard');
    if (card) card.onclick = () => { closePanic(); setTimeout(() => openAdvFullView(), 300); };
  } else {
    if (titleEl) titleEl.textContent = 'Adventure Mode';
    if (subEl)   subEl.textContent   = 'Your koala explores the world for 12 hours';
    const card = document.getElementById('advMainCard');
    if (card) card.onclick = startAdventure;
  }
}

export function _refreshAdvBanner() {
  const banner  = document.getElementById('advActiveBanner');
  if (!banner) return;
  const startMs = state.adventureStart || 0;
  const elapsed = startMs ? Date.now() - startMs : 0;
  const active  = startMs && elapsed < ADV_DURATION_MS;
  if (!active) { banner.classList.remove('show'); return; }
  banner.classList.add('show');
  const remaining = ADV_DURATION_MS - elapsed;
  const hrs  = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const pct  = Math.min(100, (elapsed / ADV_DURATION_MS) * 100);
  const title = document.getElementById('advBannerTitle');
  const sub   = document.getElementById('advBannerSub');
  const bar   = document.getElementById('advBannerBar');
  if (title) title.textContent = 'Adventure in progress!';
  if (sub)   sub.textContent   = `${hrs}h ${mins}m remaining`;
  if (bar)   bar.style.width   = pct + '%';
  // Check if adventure just completed
  if (elapsed >= ADV_DURATION_MS) _completeAdventure();
}

export function startAdventure() {
  const startMs = state.adventureStart || 0;
  const elapsed = startMs ? Date.now() - startMs : 0;
  if (startMs && elapsed < ADV_DURATION_MS) {
    // Already active — open full view
    closePanic();
    setTimeout(() => openAdvFullView(), 350);
    return;
  }
  state.adventureStart = Date.now();
  save();
  _refreshAdvCard();
  _refreshAdvBanner();
  closePanic();
  setTimeout(() => openAdvFullView(), 350);
}

function _completeAdventure() {
  if (!state.adventureStart) return;
  state.adventureStart = 0;
  // Rewards
  const xpReward   = 50;
  const coinReward = 15;
  state.coins += coinReward;
  save();
  import('./xpSystem.js').then(({ addXP }) => addXP(xpReward));
  _refreshAdvBanner();
  // Close any open adventure views and restore scroll
  document.getElementById('advFullView')?.classList.remove('open');
  _advFullStopWalk();
  _restoreHomeScroll();
  // Toast
  if (window._toast) window._toast(`Adventure complete! +${coinReward} coins +${xpReward} XP`, '#7CB97A');
}

// ===== MINI GAMES =====
let _mgDifficulty = 'easy';

export function startMiniGame(type, difficulty) {
  _mgDifficulty = difficulty || 'easy';
  closePanic();
  if (type === 'bb') _startBasketball();
  else if (type === 'tt') _startTableTennis();
}

export function closeMiniGame(type) {
  if (type === 'bb') _stopBasketball();
  else if (type === 'tt') _stopTableTennis();
  const id = type === 'bb' ? 'basketballGame' : 'tableTennisGame';
  document.getElementById(id)?.classList.remove('open');
}

// ──── BASKETBALL ────────────────────────────────────────────
let _bbTimer = null, _bbShots = 0, _bbMakes = 0, _bbSecs = 30;
let _bbAnimating = false;
let _bbDragActive = false, _bbDragStartX = 0, _bbDragStartY = 0;
let _bbDragCurX = 0, _bbDragCurY = 0;

// Sweet spot = power range [min,max] out of 100 where shot goes in
const BB_SWEET = { easy: [18, 82], medium: [30, 68], hard: [42, 57] };
const BB_BALL_HOME = { cx: 150, cy: 380 };

function _startBasketball() {
  document.getElementById('basketballGame')?.classList.add('open');
  _bbShots = 0; _bbMakes = 0; _bbSecs = 30; _bbAnimating = false; _bbDragActive = false;
  _bbResetBall();
  _bbUpdateScore();
  _bbUpdateTimer();
  const hint = document.getElementById('bbSwipeHint');
  if (hint) hint.style.opacity = '1';
  _bbTimer = setInterval(() => {
    _bbSecs--;
    _bbUpdateTimer();
    if (_bbSecs <= 0) _bbEnd();
  }, 1000);
}

function _stopBasketball() {
  clearInterval(_bbTimer);
  _bbTimer = null; _bbDragActive = false; _bbAnimating = false;
}

function _bbResetBall() {
  const ball = document.getElementById('bbBall');
  const s1   = document.getElementById('bbBallStripe1');
  const s2   = document.getElementById('bbBallStripe2');
  const bl   = document.getElementById('bbBallLine');
  const sh   = document.getElementById('bbBallShadow');
  const arc  = document.getElementById('bbGuideArc');
  if (ball) { ball.setAttribute('cx', BB_BALL_HOME.cx); ball.setAttribute('cy', BB_BALL_HOME.cy); }
  if (s1)  { s1.setAttribute('d', `M130 378 Q150 370 170 378`); }
  if (s2)  { s2.setAttribute('d', `M129 387 Q150 397 171 387`); }
  if (bl)  { bl.setAttribute('x1','150'); bl.setAttribute('y1','358'); bl.setAttribute('x2','150'); bl.setAttribute('y2','402'); }
  if (sh)  { sh.setAttribute('cx', BB_BALL_HOME.cx); sh.setAttribute('rx','22'); sh.setAttribute('opacity','0.3'); }
  if (arc) { arc.setAttribute('d',''); arc.setAttribute('opacity','0'); }
}

function _bbUpdateScore() {
  const el = document.getElementById('bbScore');
  if (el) el.textContent = `${_bbMakes} / ${_bbShots}`;
}
function _bbUpdateTimer() {
  const el = document.getElementById('bbTimer');
  if (el) el.textContent = `0:${String(_bbSecs).padStart(2,'0')}`;
}

// Swipe mechanic — registered on the arena div
window.bbSwipeStart = function(e) {
  if (_bbAnimating || _bbSecs <= 0) return;
  const touch = e.touches ? e.touches[0] : e;
  // Only start drag if touch is near the ball (lower 40% of arena)
  const arena = document.getElementById('bbArena');
  if (!arena) return;
  const rect = arena.getBoundingClientRect();
  const relY = (touch.clientY - rect.top) / rect.height;
  if (relY < 0.55) return; // ignore taps near hoop
  e.preventDefault();
  _bbDragActive   = true;
  _bbDragStartX   = touch.clientX;
  _bbDragStartY   = touch.clientY;
  _bbDragCurX     = touch.clientX;
  _bbDragCurY     = touch.clientY;
  const hint = document.getElementById('bbSwipeHint');
  if (hint) hint.style.opacity = '0';
};

window.bbSwipeMove = function(e) {
  if (!_bbDragActive) return;
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  _bbDragCurX = touch.clientX;
  _bbDragCurY = touch.clientY;
  // Show guide arc
  const dy = _bbDragStartY - _bbDragCurY;
  if (dy > 10) {
    const svgEl = document.getElementById('bbCourtSvg');
    const arc   = document.getElementById('bbGuideArc');
    if (svgEl && arc) {
      const rect = svgEl.getBoundingClientRect();
      const scaleX = 300 / rect.width;
      const scaleY = 420 / rect.height;
      const bx     = BB_BALL_HOME.cx;
      const by     = BB_BALL_HOME.cy;
      const endX   = 150 + (_bbDragCurX - _bbDragStartX) * scaleX * 0.4;
      const ctrlX  = (bx + endX) / 2;
      const ctrlY  = by - Math.min(dy * scaleY * 0.9, 320);
      arc.setAttribute('d', `M${bx} ${by} Q${ctrlX} ${ctrlY} ${endX} 68`);
      arc.setAttribute('opacity', Math.min(1, dy / 60).toFixed(2));
    }
  }
};

window.bbSwipeEnd = function(e) {
  if (!_bbDragActive || _bbAnimating || _bbSecs <= 0) return;
  e.preventDefault();
  _bbDragActive = false;
  const arc = document.getElementById('bbGuideArc');
  if (arc) arc.setAttribute('opacity','0');

  const dy  = _bbDragStartY - _bbDragCurY;   // positive = swiped up
  const dx  = _bbDragCurX   - _bbDragStartX; // horizontal offset
  if (dy < 25) return; // too short

  const maxSwipe = 220;
  const power    = Math.min(100, Math.round((dy / maxSwipe) * 100));
  const sweet    = BB_SWEET[_mgDifficulty] || BB_SWEET.easy;
  const isMake   = power >= sweet[0] && power <= sweet[1];
  const tooWeak  = power < sweet[0];
  _bbShots++;
  if (isMake) _bbMakes++;
  _bbAnimateBall(isMake, tooWeak, dx);
  _bbUpdateScore();
};

function _bbAnimateBall(made, tooWeak, dx) {
  _bbAnimating = true;
  const ball = document.getElementById('bbBall');
  const shad = document.getElementById('bbBallShadow');
  const fb   = document.getElementById('bbFeedback');
  if (!ball) { _bbAnimating = false; return; }

  const startX = BB_BALL_HOME.cx;  // 150
  const startY = BB_BALL_HOME.cy;  // 380

  // Endpoint and control point for quadratic Bezier
  let endX, endY, ctrlY, feedMsg;
  if (made) {
    endX   = 150;     // center of hoop
    endY   = 62;      // land in hoop
    ctrlY  = 10;      // high arc well above hoop (y=68)
    feedMsg = Math.random() > 0.5 ? 'SWISH!' : 'SCORE!';
  } else if (tooWeak) {
    endX   = 150 + (dx || 0) * 0.3;
    endY   = 220;     // ball falls short, hits below hoop
    ctrlY  = 120;     // lower arc
    feedMsg = 'Too short!';
  } else {
    endX   = 150 + (dx || 0) * 0.4 + (Math.random() > 0.5 ? 40 : -40);
    endY   = -20;     // ball overshoots off screen
    ctrlY  = 15;      // high arc but blows past hoop
    feedMsg = 'Too strong!';
  }

  let t = 0;
  const dur = made ? 0.030 : 0.034;
  const anim = setInterval(() => {
    t += dur;
    if (t >= 1) {
      clearInterval(anim);
      if (fb) {
        fb.textContent = feedMsg;
        fb.classList.add('show');
        setTimeout(() => fb.classList.remove('show'), 900);
      }
      // Flash net on makes
      if (made) {
        const net = document.getElementById('bbNet');
        if (net) { net.setAttribute('opacity','1'); setTimeout(() => net.setAttribute('opacity','0.7'), 250); }
      }
      setTimeout(() => {
        _bbResetBall();
        _bbAnimating = false;
        const hint = document.getElementById('bbSwipeHint');
        if (hint && _bbSecs > 0) hint.style.opacity = '1';
      }, made ? 500 : 400);
      return;
    }
    // Quadratic Bezier: P0=start, P1=ctrl, P2=end
    const cx = (1-t)*(1-t)*startX + 2*(1-t)*t*((startX + endX)/2) + t*t*endX;
    const cy = (1-t)*(1-t)*startY + 2*(1-t)*t*ctrlY + t*t*endY;
    ball.setAttribute('cx', cx);
    ball.setAttribute('cy', cy);
    // Spin stripes
    const angle = t * 360 * (made ? 2 : 1.5);
    const cosA = Math.cos(angle * Math.PI / 180), sinA = Math.sin(angle * Math.PI / 180);
    const bx = document.getElementById('bbBallStripe1');
    const by = document.getElementById('bbBallLine');
    if (bx) bx.setAttribute('d', `M${cx-20} ${cy+sinA*8} Q${cx} ${cy-10} ${cx+20} ${cy+sinA*8}`);
    if (by) { by.setAttribute('x1', cx+cosA*0); by.setAttribute('y1', cy-22); by.setAttribute('x2', cx); by.setAttribute('y2', cy+22); }
    if (shad) {
      const distFrac = Math.max(0, 1 - Math.abs(cy - startY) / 320);
      shad.setAttribute('cx', cx);
      shad.setAttribute('rx', Math.max(4, 22 * distFrac));
      shad.setAttribute('opacity', (0.3 * distFrac).toFixed(2));
    }
  }, 16);
}

function _bbEnd() {
  _stopBasketball();
  const xp    = _bbMakes * (_mgDifficulty === 'hard' ? 8 : _mgDifficulty === 'medium' ? 6 : 4);
  const coins = Math.floor(_bbMakes * (_mgDifficulty === 'hard' ? 3 : 2));
  state.coins += coins; save();
  import('./xpSystem.js').then(({ addXP, updateXPUI }) => { addXP(xp); updateXPUI(); });
  document.getElementById('basketballGame')?.classList.remove('open');
  if (window._toast) window._toast(`Game over! ${_bbMakes}/${_bbShots} shots made — +${coins} coins +${xp} XP`, '#E09040');
}

// ──── TABLE TENNIS ───────────────────────────────────────────
let _ttCtx = null, _ttAF = null, _ttTimer = null;
let _ttSecs = 30, _ttPlayerScore = 0, _ttBotScore = 0;
let _ttBall = { x:150, y:220, vx:0, vy:0 };
let _ttPlayerX = 150, _ttBotX = 150;
let _ttStarted = false, _ttDiff = 'easy';

const TT_BALL_SPEED = { easy: 3.5, medium: 5.5, hard: 8 };
const TT_BOT_SPEED  = { easy: 2.2, medium: 3.8, hard: 6.5 };

function _startTableTennis() {
  document.getElementById('tableTennisGame')?.classList.add('open');
  _ttDiff = _mgDifficulty;
  _ttPlayerScore = 0; _ttBotScore = 0; _ttSecs = 30; _ttStarted = false;
  const canvas = document.getElementById('ttCanvas');
  if (!canvas) return;
  // Fit canvas to arena
  const arena = canvas.parentElement;
  const w = Math.min(arena.clientWidth - 16, 320);
  const h = Math.min(arena.clientHeight - 16, 460);
  canvas.width = w; canvas.height = h;
  _ttCtx = canvas.getContext('2d');
  _ttBall = { x: w/2, y: h/2, vx: 2, vy: -2 };
  _ttPlayerX = w/2; _ttBotX = w/2;
  _ttUpdateScore(); _ttUpdateTimer();
  const startMsg = document.getElementById('ttStart');
  if (startMsg) startMsg.style.display = 'block';
  // Touch/click to start and move paddle
  canvas.ontouchstart = canvas.onmousedown = (e) => {
    if (!_ttStarted) {
      _ttStarted = true;
      if (startMsg) startMsg.style.display = 'none';
      const sp = TT_BALL_SPEED[_ttDiff] || 4;
      _ttBall.vx = (Math.random() > 0.5 ? 1 : -1) * sp * 0.6;
      _ttBall.vy = sp;
      _ttTimer = setInterval(() => {
        _ttSecs--; _ttUpdateTimer();
        if (_ttSecs <= 0) _ttEnd();
      }, 1000);
    }
    _ttMovePaddle(e, canvas);
  };
  canvas.ontouchmove = canvas.onmousemove = (e) => _ttMovePaddle(e, canvas);
  cancelAnimationFrame(_ttAF);
  _ttDraw();
}

function _ttMovePaddle(e, canvas) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  _ttPlayerX = Math.max(30, Math.min(canvas.width - 30, (clientX - rect.left) * (canvas.width / rect.width)));
}

function _ttDraw() {
  const c = _ttCtx;
  const canvas = document.getElementById('ttCanvas');
  if (!c || !canvas) return;
  const W = canvas.width, H = canvas.height;
  // Background: table
  c.fillStyle = '#1a4a80';
  c.fillRect(0, 0, W, H);
  c.strokeStyle = '#ffffff44';
  c.lineWidth = 2;
  c.strokeRect(8, 8, W-16, H-16);
  // Net
  c.strokeStyle = '#ffffff66';
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(8, H/2); c.lineTo(W-8, H/2); c.stroke();
  c.strokeStyle = '#fff'; c.lineWidth = 1;
  for (let x = 12; x < W-8; x += 10) {
    c.beginPath(); c.moveTo(x, H/2-6); c.lineTo(x, H/2+6); c.stroke();
  }
  // Bot paddle (top)
  const botSpeed = TT_BOT_SPEED[_ttDiff] || 3;
  if (_ttStarted) {
    if (_ttBotX < _ttBall.x - 2) _ttBotX = Math.min(_ttBall.x, _ttBotX + botSpeed);
    else if (_ttBotX > _ttBall.x + 2) _ttBotX = Math.max(_ttBall.x, _ttBotX - botSpeed);
  }
  // Bot label
  c.fillStyle = 'rgba(255,107,107,0.6)';
  c.font = 'bold 11px -apple-system,sans-serif';
  c.textAlign = 'left';
  c.fillText('BOT', 12, 12);
  c.fillStyle = '#FF6B6B';
  c.beginPath(); c.roundRect(_ttBotX-28, 14, 56, 12, 6); c.fill();
  // Player paddle (bottom) + label
  c.fillStyle = 'rgba(107,203,119,0.6)';
  c.font = 'bold 11px -apple-system,sans-serif';
  c.textAlign = 'left';
  c.fillText('YOU', 12, H - 8);
  c.fillStyle = '#6BCB77';
  c.beginPath(); c.roundRect(_ttPlayerX-28, H-26, 56, 12, 6); c.fill();
  // Ball
  if (_ttStarted) {
    _ttBall.x += _ttBall.vx;
    _ttBall.y += _ttBall.vy;
    // Wall bounce
    if (_ttBall.x < 14 || _ttBall.x > W-14) _ttBall.vx *= -1;
    // Bot paddle hit
    if (_ttBall.y < 30 && _ttBall.vy < 0 && Math.abs(_ttBall.x - _ttBotX) < 30) {
      _ttBall.vy = Math.abs(_ttBall.vy);
      _ttBall.vx += (Math.random() - 0.5) * 1.5;
    }
    // Player paddle hit
    if (_ttBall.y > H-32 && _ttBall.vy > 0 && Math.abs(_ttBall.x - _ttPlayerX) < 30) {
      _ttBall.vy = -Math.abs(_ttBall.vy);
      _ttBall.vx += (Math.random() - 0.5) * 1.5;
    }
    // Score
    if (_ttBall.y < 0)  { _ttPlayerScore++; _ttResetBall(W, H,  1); _ttUpdateScore(); }
    if (_ttBall.y > H)  { _ttBotScore++;    _ttResetBall(W, H, -1); _ttUpdateScore(); }
  }
  c.fillStyle = '#FFD93D';
  c.beginPath(); c.arc(_ttBall.x, _ttBall.y, 9, 0, Math.PI*2); c.fill();
  _ttAF = requestAnimationFrame(_ttDraw);
}

function _ttResetBall(W, H, dir) {
  _ttBall = { x: W/2, y: H/2, vx: (Math.random()-0.5)*3, vy: dir * (TT_BALL_SPEED[_ttDiff]||4) };
}

function _ttUpdateScore() {
  const el = document.getElementById('ttScore');
  if (el) el.textContent = `You ${_ttPlayerScore} — ${_ttBotScore} Bot`;
}
function _ttUpdateTimer() {
  const el = document.getElementById('ttTimer');
  if (el) el.textContent = `0:${String(_ttSecs).padStart(2,'0')}`;
}

function _stopTableTennis() {
  clearInterval(_ttTimer); cancelAnimationFrame(_ttAF);
  _ttTimer = null; _ttAF = null; _ttStarted = false;
  const canvas = document.getElementById('ttCanvas');
  if (canvas) { canvas.ontouchstart = canvas.onmousedown = canvas.ontouchmove = canvas.onmousemove = null; }
}

function _ttEnd() {
  _stopTableTennis();
  const won   = _ttPlayerScore > _ttBotScore;
  const xp    = won ? (_mgDifficulty === 'hard' ? 25 : _mgDifficulty === 'medium' ? 18 : 12) : 5;
  const coins = won ? (_mgDifficulty === 'hard' ? 8  : _mgDifficulty === 'medium' ? 5  : 3)  : 1;
  state.coins += coins; save();
  import('./xpSystem.js').then(({ addXP, updateXPUI }) => { addXP(xp); updateXPUI(); });
  document.getElementById('tableTennisGame')?.classList.remove('open');
  const msg = won ? `You won! +${coins} coins +${xp} XP` : `Good game! +${coins} coin +${xp} XP`;
  if (window._toast) window._toast(msg, '#2E86C1');
}

// ===== REWARD ANIMATION =====
export function playReward(amt) {
  const ov = document.getElementById('rewardOverlay');
  const bc = document.getElementById('bigCoin');
  if (!ov || !bc) return;

  const face = document.getElementById('coinFrontFace');
  if (face) face.textContent = '+' + amt;
  ov.style.pointerEvents = 'auto';

  for (let i = 0; i < 12; i++) {
    setTimeout(() => spawnSparkle(ov), i * 80 + 200);
  }

  bc.className = 'big-coin phase-grow';
  setTimeout(() => { bc.className = 'big-coin phase-flip'; },  380);
  setTimeout(() => { bc.className = 'big-coin phase-hold'; },  750);
  setTimeout(() => { bc.className = 'big-coin phase-shrink'; }, 1500);
  setTimeout(() => {
    bc.className = 'big-coin';
    ov.style.pointerEvents = 'none';
    spawnMiniCoins(amt);
  }, 1900);
}

function spawnSparkle(parent) {
  const s = document.createElement('div');
  s.className = 'sparkle';
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  s.style.left       = (cx + (Math.random() - .5) * 180) + 'px';
  s.style.top        = (cy + (Math.random() - .5) * 180) + 'px';
  s.style.background = ['#FFD700','#FFF','#F0C850','#FFE082'][Math.random() * 4 | 0];
  s.style.transition = 'all .8s ease-out';
  parent.appendChild(s);
  requestAnimationFrame(() => {
    s.style.transform = `translate(${(Math.random()-.5)*140}px,${(Math.random()-.5)*140}px) scale(0)`;
    s.style.opacity   = '0';
  });
  setTimeout(() => s.remove(), 900);
}

function spawnConfetti() {
  const c = document.createElement('div');
  c.className  = 'confetti';
  c.style.left = Math.random() * window.innerWidth + 'px';
  c.style.top  = '-10px';
  c.style.background = ['#7CB97A','#E8B84B','#7BAFD4','#E8A0BF','#F4A261'][Math.random() * 5 | 0];
  c.style.width  = (Math.random() * 6 + 4) + 'px';
  c.style.height = (Math.random() * 6 + 4) + 'px';
  c.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
  c.style.transition   = `all ${1.5 + Math.random()}s ease-out`;
  document.body.appendChild(c);
  requestAnimationFrame(() => {
    c.style.transform = `translateY(${window.innerHeight + 50}px) rotate(${Math.random() * 720}deg)`;
    c.style.opacity   = '0';
  });
  setTimeout(() => c.remove(), 2500);
}

function spawnMiniCoins(total) {
  const tgt    = document.getElementById('coinDisplay');
  if (!tgt) return;
  const tRect  = tgt.getBoundingClientRect();
  const tx = tRect.left + tRect.width / 2;
  const ty = tRect.top  + tRect.height / 2;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const count  = Math.min(total, 10);
  const before = state.coins - total;

  for (let i = 0; i < 16; i++) setTimeout(spawnConfetti, i * 40);

  for (let i = 0; i < count; i++) {
    (idx => {
      const mc = document.createElement('div');
      mc.className = 'mini-fly-coin';
      const a = (idx / count) * Math.PI * 2;
      const r = 25 + Math.random() * 20;
      mc.style.left      = (cx + Math.cos(a) * r - 11) + 'px';
      mc.style.top       = (cy + Math.sin(a) * r - 11) + 'px';
      mc.style.opacity   = '0';
      mc.style.transform = 'scale(0)';
      document.body.appendChild(mc);

      setTimeout(() => {
        mc.style.transition = 'opacity .12s, transform .12s';
        mc.style.opacity    = '1';
        mc.style.transform  = 'scale(1)';
        setTimeout(() => {
          mc.style.transition = 'left .35s cubic-bezier(.2,.8,.3,1), top .35s cubic-bezier(.5,0,.7,1), transform .35s, opacity .3s';
          mc.style.left       = (tx - 11) + 'px';
          mc.style.top        = (ty - 11) + 'px';
          mc.style.transform  = 'scale(.35)';
          mc.style.opacity    = '.6';
          setTimeout(() => {
            mc.remove();
            const coinCount = document.getElementById('coinCount');
            if (coinCount) coinCount.textContent = Math.round(before + (idx + 1) * (total / count));
            const cd = document.getElementById('coinDisplay');
            if (cd) { cd.classList.remove('bounce'); void cd.offsetWidth; cd.classList.add('bounce'); }
          }, 350);
        }, 80);
      }, idx * 70);
    })(i);
  }

  setTimeout(() => {
    const cc = document.getElementById('coinCount');
    if (cc) cc.textContent = state.coins;
    updateShopNotif();
  }, count * 70 + 600);
}

// ===== URGE INTERRUPT =====
let _urgeTimer = null;

export function openUrgeInterrupt() {
  const overlay = document.getElementById('urgeOverlay');
  if (!overlay) return;
  overlay.classList.add('open');

  const btn = document.getElementById('urgeConfirmBtn');
  const countdown = document.getElementById('urgeCountdown');
  if (btn) btn.style.display = 'none';

  let secs = 5;
  if (countdown) countdown.textContent = secs;
  if (_urgeTimer) clearInterval(_urgeTimer);

  _urgeTimer = setInterval(() => {
    secs--;
    if (countdown) countdown.textContent = secs;
    if (secs <= 0) {
      clearInterval(_urgeTimer);
      _urgeTimer = null;
      if (btn) btn.style.display = 'inline-flex';
      if (countdown) countdown.textContent = '';
    }
  }, 1000);
}

export function closeUrgeInterrupt() {
  if (_urgeTimer) { clearInterval(_urgeTimer); _urgeTimer = null; }
  document.getElementById('urgeOverlay')?.classList.remove('open');
}

// ===== OFFLINE MESSAGE DISPLAY =====
export function showOfflineMessage(results) {
  if (!results || results.hoursAway < 1) return;

  const overlay = document.createElement('div');
  overlay.className = 'offline-overlay';
  overlay.innerHTML = `
    <div class="offline-card">
      <div class="offline-emoji">${emojiSVG('koala',48)}</div>
      <div class="offline-title">Welcome back!</div>
      <div class="offline-body">
        While you were away (${results.hoursAway}h), your koala was <strong>${results.activity}</strong>.
      </div>
      <div class="offline-stats">
        ${results.energyChange < 0 ? `<span class="offline-stat bad">${results.energyChange} energy</span>` : ''}
        ${state.koalaSick ? `<span class="offline-stat bad">Your koala got sick!</span>` : ''}
      </div>
      <button class="offline-btn" onclick="this.closest('.offline-overlay').remove()">Got it!</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}
