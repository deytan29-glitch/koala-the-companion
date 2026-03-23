// ===== FOCUS MODE SYSTEM =====
// Timer with selectable durations (15/25/45/60 min), pause/resume, koala states.
// On completion: reward coins + energy + health, update all UIs immediately.
// Sends notifications on completion and when leaving mid-session.

import { state, save } from './state.js';
import { addFocusEnergy, updateEnergyUI } from './energySystem.js';
import { calculateEnergyGain } from './modifierSystem.js';
import { sendNotification } from './notificationSystem.js';
import { updateHealthUI } from './goalSystem.js';
import { addXP, updateXPUI } from './xpSystem.js';
import { addBond } from './bondSystem.js';
import { emojiSVG } from './emojiSVG.js';

let _focusTimer     = null;
let _focusSeconds   = 0;
let _focusStartTime = null;
let _isPaused       = false;
let _pausedAt       = null;

// \u{2500}\u{2500}\u{2500} Duration options \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}
let _selectedMins     = 25;
let _selectedDuration = 25 * 60;
let _selectedXP       = 25;
let _selectedCoinBase = 5;
let _bonusXP          = 0;  // extra XP from tapping the +10 min bonus button

const MAX_DAILY_FOCUS_SESSIONS = 8;
const MAX_DAILY_FOCUS_COINS    = 60;

// \u{2500}\u{2500}\u{2500} Public API \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

export function selectFocusDuration(minutes) {
  const m = Math.min(60, Math.max(10, parseInt(minutes) || 25));
  _bonusXP = 0;  // reset bonus when dial is moved manually
  _applyDuration(m);
}

// Called when user taps the hint button — adds 10 min with 20 XP bonus
export function addTenMinBonus() {
  const m = Math.min(60, _selectedMins + 10);
  _bonusXP += 10;  // 20 XP for 10 min instead of normal 10 XP (+10 bonus on top)
  _applyDuration(m);
}

function _applyDuration(m) {
  const baseXP = m === 60 ? 100 : m;
  _selectedMins     = m;
  _selectedDuration = m * 60;
  _selectedXP       = baseXP + _bonusXP;
  _selectedCoinBase = Math.round(m / 5);

  const dialMins = document.getElementById('focusDialMins');
  const dialXP   = document.getElementById('focusDialXP');
  const dial     = document.getElementById('focusDial');
  const hint     = document.getElementById('focusDialHint');
  if (dialMins) dialMins.textContent = m;
  if (dialXP)   dialXP.textContent   = `+${_selectedXP} XP`;
  if (dial)     dial.value           = m;

  if (hint) {
    if (m <= 50) {
      const nextXP = Math.min(60, m + 10) === 60 ? (100 - (m === 60 ? 100 : m)) : 10;
      hint.innerHTML = `<span onclick="addTenMinBonus()" style="cursor:pointer;text-decoration:underline;text-underline-offset:3px;">+10 min for +20 XP bonus</span>`;
      hint.style.display = 'block';
    } else if (m < 60) {
      hint.textContent = `Just ${60 - m} more minutes for the 100 XP bonus!`;
      hint.style.display = 'block';
    } else {
      hint.textContent = 'Maximum focus! 100 XP reward';
      hint.style.display = 'block';
    }
  }

  _updateFocusDisplay(_selectedDuration);
  _setCaption(`${m} minutes of deep focus`);
}

export function openFocusMode() {
  const overlay = document.getElementById('focusModeOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  _updateFocusDisplay(_selectedDuration);
  _updateFocusStats();
  _setKoalaState('idle');
  _setCaption(`${_selectedMins} minutes of deep focus`);
  _showStartBtn();
}

export function closeFocusMode() {
  if (_focusTimer || _isPaused) {
    sendNotification(
      '\u{1F428} Koala Calm',
      'Your focus session is waiting \u{2014} come back and finish it!',
      'focus-left'
    );
  }
  stopFocusSession();
  const overlay = document.getElementById('focusModeOverlay');
  if (overlay) overlay.classList.remove('open');
}

export function startFocusSession() {
  if (_focusTimer) return;

  _focusSeconds   = _selectedDuration;
  _focusStartTime = Date.now();
  _isPaused       = false;

  _showRunningBtns();
  _setKoalaState('working');
  _setRingActive(true);
  _setCaption('Stay focused \u{2014} you\'ve got this ' + emojiSVG('muscle',16));

  // Smooth book fade out
  const book = document.getElementById('focusBook');
  if (book) {
    book.style.opacity   = '0';
    book.style.transform = 'scale(0.6) translateY(10px)';
  }

  _focusTimer = setInterval(() => {
    if (_isPaused) return;
    _focusSeconds--;
    _updateFocusDisplay(_focusSeconds);
    if (_focusSeconds <= 0) _completeFocusSession();
  }, 1000);
}

export function pauseFocusSession() {
  if (!_focusTimer) return;

  _isPaused = !_isPaused;

  const icon  = document.getElementById('focusPauseIcon');
  const label = document.getElementById('focusPauseLabel');
  const disp  = document.getElementById('focusTimerDisplay');
  const ring  = document.getElementById('focusRingSvg');

  if (_isPaused) {
    _pausedAt = Date.now();
    if (icon)  icon.innerHTML  = emojiSVG('play',16);
    if (label) label.textContent = 'Resume';
    if (disp)  disp.classList.add('paused');
    if (ring)  ring.classList.remove('active');
    _setKoalaState('idle');
    _setCaption('Paused \u{2014} tap Resume when ready');
  } else {
    if (icon)  icon.innerHTML  = emojiSVG('pause',16);
    if (label) label.textContent = 'Pause';
    if (disp)  disp.classList.remove('paused');
    if (ring)  ring.classList.add('active');
    _setKoalaState('working');
    _setCaption('Stay focused \u{2014} you\'ve got this ' + emojiSVG('muscle',16));
    _pausedAt = null;
  }
}

export function stopFocusSession() {
  const wasRunning    = !!_focusTimer || _isPaused;
  const secsRemaining = _focusSeconds;

  if (_focusTimer) {
    clearInterval(_focusTimer);
    _focusTimer = null;
  }
  _focusSeconds   = 0;
  _focusStartTime = null;
  _isPaused       = false;
  _pausedAt       = null;

  _showStartBtn();
  _setRingActive(false);
  _updateFocusDisplay(_selectedDuration);

  // Smooth book restore
  const book = document.getElementById('focusBook');
  if (book) {
    book.style.opacity   = '1';
    book.style.transform = 'scale(1) translateY(0)';
  }

  if (wasRunning && secsRemaining > 5 * 60) {
    _setKoalaState('tired');
    _setCaption('Oh... maybe next time ' + emojiSVG('herb',16));
    setTimeout(() => {
      _setKoalaState('idle');
      _setCaption(`${_selectedMins} minutes of deep focus`);
    }, 3500);
  } else {
    _setKoalaState('idle');
    _setCaption(`${_selectedMins} minutes of deep focus`);
  }
}

// \u{2500}\u{2500}\u{2500} Private \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _completeFocusSession() {
  clearInterval(_focusTimer);
  _focusTimer     = null;
  _focusStartTime = null;
  _isPaused       = false;

  const today = new Date().toDateString();
  if (state.focusSessionDate !== today) {
    state.dailyFocusSessions = 0;
    state.dailyFocusCoins    = 0;
    state.focusSessionDate   = today;
  }

  if ((state.dailyFocusSessions || 0) >= MAX_DAILY_FOCUS_SESSIONS) {
    _showFocusResult('Session complete!', 'Daily cap reached \u{2014} great work today!', 0, 0);
    _setKoalaState('celebrate');
    _resetToStart();
    return;
  }

  // \u{2500} Tally session \u{2500}
  state.focusSessions      = (state.focusSessions || 0) + 1;
  state.dailyFocusSessions = (state.dailyFocusSessions || 0) + 1;

  // Streak bonus on coins
  let coinReward = _selectedCoinBase;
  if (state.dailyFocusSessions >= 4) coinReward += 6;
  else if (state.dailyFocusSessions >= 2) coinReward += 3;

  const remainingCoins = MAX_DAILY_FOCUS_COINS - (state.dailyFocusCoins || 0);
  coinReward = Math.min(coinReward, remainingCoins);

  state.coins           += coinReward;
  state.dailyFocusCoins  = (state.dailyFocusCoins || 0) + coinReward;

  // Health + energy
  const healthGain = 5;
  state.health = Math.min(100, (state.health || 0) + healthGain);
  const energyGain = addFocusEnergy(Math.floor(_selectedDuration / 60));

  // XP + bond
  addXP(_selectedXP);
  addBond(1);

  _updateFocusDayStreak();
  save();

  // \u{2500} Update UIs immediately \u{2500}
  const coinEl = document.getElementById('coinCount');
  if (coinEl) coinEl.textContent = state.coins;
  updateHealthUI();
  updateEnergyUI();
  updateXPUI();

  // \u{2500} Koala celebrate \u{2500}
  _setKoalaState('celebrate');
  _setRingActive(false);
  _setCaption('Amazing work! ' + emojiSVG('party',16));

  // Smooth book restore after celebrate
  setTimeout(() => {
    const book = document.getElementById('focusBook');
    if (book) {
      book.style.opacity   = '1';
      book.style.transform = 'scale(1) translateY(0)';
    }
  }, 1800);

  const sessionNum = state.dailyFocusSessions;
  const comboTitle = sessionNum >= 4 ? 'Incredible Focus! ' + emojiSVG('fire',16) + emojiSVG('fire',16) + emojiSVG('fire',16)
                   : sessionNum >= 3 ? 'Triple Session! ' + emojiSVG('fire',16) + emojiSVG('fire',16)
                   : sessionNum >= 2 ? 'Combo Session! ' + emojiSVG('fire',16)
                   : 'Focus Session Complete! ' + emojiSVG('party',16);
  const focusDayStreak = state.focusDayStreak || 0;
  const subLine = focusDayStreak > 1
    ? `Session #${sessionNum} today \u{B7} ${focusDayStreak}-day focus streak!`
    : `Session #${sessionNum} today`;

  _showFocusResult(comboTitle, subLine, coinReward, energyGain);

  sendNotification(
    '\u{1F428} Koala Calm',
    `Focus session done! +${coinReward} coins, +${energyGain} energy, +5 health earned.`,
    'focus-complete'
  );

  _resetToStart(3200);
  _updateFocusStats();
}

function _resetToStart(delay = 0) {
  setTimeout(() => {
    _showStartBtn();
    _setKoalaState('idle');
    _updateFocusDisplay(_selectedDuration);
  }, delay);
}

function _showFocusResult(title, subtitle, coins, energy) {
  const result = document.getElementById('focusResult');
  if (!result) return;

  result.innerHTML = `
    <div class="focus-result-title">${title}</div>
    <div class="focus-result-sub">${subtitle}</div>
    <div class="focus-result-rewards">
      ${coins  > 0 ? `<span class="focus-reward-pill coin">+${coins} coins</span>` : ''}
      ${energy > 0 ? `<span class="focus-reward-pill energy">+${energy} energy</span>` : ''}
      <span class="focus-reward-pill health">+5 health</span>
      <span class="focus-reward-pill xp">+${_selectedXP} XP</span>
    </div>
  `;
  result.classList.add('show');
  setTimeout(() => result.classList.remove('show'), 5000);
}

function _updateFocusDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timerEl = document.getElementById('focusTimerDisplay');
  if (timerEl) timerEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

  // Progress ring (r=84, viewBox 200\u{D7}200)
  const ring = document.getElementById('focusProgressRing');
  if (ring) {
    const circumference = 2 * Math.PI * 84;
    const progress = 1 - (seconds / _selectedDuration);
    ring.style.strokeDasharray  = circumference;
    ring.style.strokeDashoffset = circumference * (1 - progress);
  }
}

function _updateFocusStats() {
  const totalEl = document.getElementById('focusTotalSessions');
  const todayEl = document.getElementById('focusTodaySessions');
  if (totalEl) totalEl.textContent = state.focusSessions      || 0;
  if (todayEl) todayEl.textContent = state.dailyFocusSessions || 0;
}

// \u{2500}\u{2500}\u{2500} UI State Helpers \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _showStartBtn() {
  const startBtn   = document.getElementById('focusStartBtn');
  const runningEl  = document.getElementById('focusRunningBtns');
  const timePicker = document.getElementById('focusTimePicker');
  if (startBtn)   startBtn.style.display   = 'inline-flex';
  if (runningEl)  runningEl.style.display  = 'none';
  if (timePicker) timePicker.style.display = 'flex';
}

function _showRunningBtns() {
  const startBtn   = document.getElementById('focusStartBtn');
  const runningEl  = document.getElementById('focusRunningBtns');
  const timePicker = document.getElementById('focusTimePicker');
  const pauseIcon  = document.getElementById('focusPauseIcon');
  const pauseLabel = document.getElementById('focusPauseLabel');
  if (startBtn)   startBtn.style.display   = 'none';
  if (runningEl)  runningEl.style.display  = 'flex';
  if (timePicker) timePicker.style.display = 'none';
  if (pauseIcon)  pauseIcon.innerHTML    = emojiSVG('pause',16);
  if (pauseLabel) pauseLabel.textContent   = 'Pause';
  const disp = document.getElementById('focusTimerDisplay');
  if (disp) disp.classList.remove('paused');
}

function _setKoalaState(s) {
  const wrap = document.getElementById('focusKoala');
  if (!wrap) return;
  wrap.classList.remove('idle', 'working', 'tired', 'celebrate');
  wrap.classList.add(s);
  if (s === 'celebrate') {
    setTimeout(() => {
      wrap.classList.remove('celebrate');
      wrap.classList.add('idle');
    }, 2800);
  }
}

function _setRingActive(on) {
  const svg = document.getElementById('focusRingSvg');
  if (!svg) return;
  on ? svg.classList.add('active') : svg.classList.remove('active');
}

function _setCaption(text) {
  const cap = document.getElementById('focusCaption');
  if (cap) cap.innerHTML = text;
}

function _updateFocusDayStreak() {
  const today    = new Date().toDateString();
  const lastDate = state.lastFocusDayDate;

  if (lastDate === today) return;

  if (lastDate) {
    const last = new Date(lastDate);
    const now  = new Date();
    last.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));
    state.focusDayStreak = diffDays === 1
      ? (state.focusDayStreak || 0) + 1
      : 1;
  } else {
    state.focusDayStreak = 1;
  }

  state.lastFocusDayDate = today;
}
