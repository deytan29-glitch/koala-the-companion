// ===== PROGRESS SYSTEM =====
// Renders the progress screen: streak, XP/bond, weekly view, analytics, focus stats, history, goal log

import { state } from './state.js';
import { getLevelProgress, updateXPUI } from './xpSystem.js';
import { getBond, getBondMilestone } from './bondSystem.js';
import { getPersonalityTrait } from './personalitySystem.js';
import { emojiSVG } from './emojiSVG.js';

export function renderProgress() {
  _renderStreak();
  _renderXPAndBond();
  _renderWeek();
  _renderAnalytics();
  _renderFocusStats();
  _renderGoalLog();
  _renderHistory();
  updateXPUI();
}

// \u{2500}\u{2500}\u{2500} Streak \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _renderStreak() {
  const streakNum = document.getElementById('streakNum');
  if (streakNum) streakNum.textContent = state.streak;

  const mc = document.getElementById('milestones');
  if (!mc) return;
  mc.innerHTML = '';

  [
    { d: 3,  i: emojiSVG('star',22), l: '3 days'  },
    { d: 7,  i: emojiSVG('proud',22), l: '1 week'  },
    { d: 14, i: emojiSVG('sparkle',22), l: '2 weeks' },
    { d: 30, i: emojiSVG('trophy',22), l: '1 month' },
  ].forEach(m => {
    const d = document.createElement('div');
    d.className = 'milestone' + (state.streak >= m.d ? ' reached' : '');
    d.innerHTML = `<span class="milestone-icon">${m.i}</span><div class="milestone-num">${m.d}</div><div class="milestone-label">${m.l}</div>`;
    mc.appendChild(d);
  });
}

// \u{2500}\u{2500}\u{2500} XP + Bond \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _renderXPAndBond() {
  const container = document.getElementById('xpBondSection');
  if (!container) return;

  const { level, xpInLevel, xpNeeded, progress } = getLevelProgress();
  const currentXP  = xpInLevel;
  const xpForNext  = xpNeeded;
  const progressPct = Math.round(progress * 100);
  const bond = getBond();
  const milestone = getBondMilestone();
  const trait = getPersonalityTrait();

  const traitLabels = {
    thriving:   { label: 'Thriving',   color: '#4ade80', emoji: emojiSVG('proud',14) },
    consistent: { label: 'Consistent', color: '#60a5fa', emoji: emojiSVG('calendar',14) },
    focused:    { label: 'Focused',    color: '#a78bfa', emoji: emojiSVG('target',14) },
    struggling: { label: 'Struggling', color: '#f87171', emoji: emojiSVG('blueheart',14) },
    recovering: { label: 'Recovering', color: '#fb923c', emoji: emojiSVG('seedling',14) },
    balanced:   { label: 'Balanced',   color: '#94a3b8', emoji: emojiSVG('yinyang',14) },
  };
  const traitInfo = traitLabels[trait] || traitLabels.balanced;

  container.innerHTML = `
    <div class="prog-xp-bond-grid">
      <div class="prog-xp-card">
        <div class="prog-xb-header">
          <span class="prog-xb-label">Level ${level}</span>
          <span class="prog-xb-sub">${currentXP} / ${xpForNext} XP</span>
        </div>
        <div class="prog-bar-track">
          <div class="prog-bar-fill xp-fill" style="width:${progressPct}%"></div>
        </div>
      </div>
      <div class="prog-bond-card">
        <div class="prog-xb-header">
          <span class="prog-xb-label">${milestone.emoji} ${milestone.label}</span>
          <span class="prog-xb-sub">${bond}% bond</span>
        </div>
        <div class="prog-bar-track">
          <div class="prog-bar-fill bond-fill" style="width:${bond}%"></div>
        </div>
      </div>
    </div>
    <div class="trait-chip-row">
      <span class="trait-chip" style="border-color:${traitInfo.color};color:${traitInfo.color}">${traitInfo.emoji} ${traitInfo.label}</span>
    </div>
  `;
}

// \u{2500}\u{2500}\u{2500} Week view \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _renderWeek() {
  const wr = document.getElementById('weekRow');
  if (!wr) return;
  wr.innerHTML = '';

  const dayNames = ['S','M','T','W','T','F','S'];
  const today    = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  for (let i = 0; i < 7; i++) {
    const d   = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds  = d.toDateString();
    const isT = ds === today.toDateString();
    const ci  = state.checkins.find(c => new Date(c.date).toDateString() === ds);

    let dotClass = 'day-dot';
    if (isT && !ci) dotClass += ' today';
    else if (ci &&  ci.success) dotClass += ' success';
    else if (ci && !ci.success) dotClass += ' fail';

    const col = document.createElement('div');
    col.className = 'day-col';
    col.innerHTML = `<div class="day-label">${dayNames[i]}</div><div class="${dotClass}">${ci ? (ci.success ? emojiSVG('checkmark',14) : emojiSVG('crossmark',14)) : ''}</div>`;
    wr.appendChild(col);
  }
}

// \u{2500}\u{2500}\u{2500} Analytics \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _getWeeklyRates() {
  // Returns last 4 weeks as [{label, rate, wins, total}]
  const today = new Date();
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const end   = new Date(today);
    end.setDate(today.getDate() - today.getDay() - w * 7 + 6);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const inWeek = state.checkins.filter(c => {
      const d = new Date(c.date);
      return d >= start && d <= end;
    });
    const wins  = inWeek.filter(c => c.success).length;
    const total = inWeek.length;
    const rate  = total > 0 ? Math.round((wins / total) * 100) : 0;
    const label = w === 0 ? 'This' : w === 1 ? 'Last' : `${w + 1}w ago`;
    weeks.push({ label, rate, wins, total });
  }
  return weeks;
}

function _renderAnalytics() {
  const container = document.getElementById('analyticsSection');
  if (!container) return;

  const today     = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const thisWeek  = state.checkins.filter(c => new Date(c.date) >= weekStart);
  const wins      = thisWeek.filter(c => c.success).length;
  const rate      = thisWeek.length > 0 ? Math.round((wins / thisWeek.length) * 100) : 0;

  const totalSaved = state.checkins.reduce((acc, c) => {
    if (!c.success) return acc;
    const goal = (state.goalHours * 60 + state.goalMinutes);
    const used = (c.usedH || 0) * 60 + (c.usedM || 0);
    return acc + Math.max(0, goal - used);
  }, 0);
  const savedH = Math.floor(totalSaved / 60);
  const savedM = totalSaved % 60;
  const savedStr = savedH > 0 ? (savedM > 0 ? `${savedH}h ${savedM}m` : `${savedH}h`) : `${savedM}m`;

  // — 4-week success rate bars —
  const weeks    = _getWeeklyRates();
  const maxRate  = Math.max(...weeks.map(w => w.rate), 1);
  const rateBars = weeks.map(w => `
    <div class="week-bar-col">
      <div class="week-bar-track">
        <div class="week-bar-fill" style="height:${Math.round((w.rate / maxRate) * 100)}%;background:${w.rate >= 70 ? '#4ade80' : w.rate >= 40 ? '#FFCC00' : '#f87171'}"></div>
      </div>
      <div class="week-bar-pct">${w.rate}%</div>
      <div class="week-bar-label">${w.label}</div>
    </div>`).join('');

  // — Last 7 days screen time bar chart —
  const goal7 = state.goalHours * 60 + state.goalMinutes;
  const days7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toDateString();
    const ci = state.checkins.find(c => new Date(c.date).toDateString() === ds);
    const used = ci ? (ci.usedH || 0) * 60 + (ci.usedM || 0) : null;
    days7.push({ label: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()], used, success: ci?.success });
  }
  const maxMin = Math.max(...days7.map(d => d.used || 0), goal7, 30);
  const dayBarsHTML = days7.map(d => {
    const barH  = d.used !== null ? Math.round((d.used / maxMin) * 100) : 0;
    const goalH = Math.round((goal7 / maxMin) * 100);
    const col   = d.used === null ? '#4B5563' : d.success ? '#4ade80' : '#f87171';
    const timeStr = d.used !== null ? (d.used >= 60 ? `${Math.floor(d.used/60)}h${d.used%60>0?d.used%60+'m':''}` : `${d.used}m`) : '';
    return `<div class="day7-bar-col">
      <div class="day7-bar-track">
        <div class="day7-goal-line" style="bottom:${goalH}%"></div>
        <div class="day7-bar-fill" style="height:${barH}%;background:${col}"></div>
      </div>
      <div class="day7-bar-time">${timeStr}</div>
      <div class="day7-bar-label">${d.label}</div>
    </div>`;
  }).join('');

  // — Recent 5 check-ins —
  const recentCI = state.checkins.slice().reverse().slice(0, 5);
  const recentHTML = recentCI.length ? recentCI.map(c => {
    const d   = new Date(c.date);
    const wd  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const mon = d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const ref = c.reflection ? `<div class="ci-reflection">"${c.reflection.slice(0,60)}${c.reflection.length>60?'…':''}"</div>` : '';
    return `<div class="ci-row ${c.success?'ci-win':'ci-fail'}">
      <div class="ci-dot"></div>
      <div class="ci-info">
        <div class="ci-date">${wd}, ${mon}</div>
        <div class="ci-detail">${c.usedH}h ${c.usedM}m used${c.success ? ' · +' + (c.reward||0) + ' coins' : ' · over goal'}</div>
        ${ref}
      </div>
    </div>`;
  }).join('') : '<div style="color:var(--text-light);font-size:13px;text-align:center;padding:12px">No check-ins yet</div>';

  container.innerHTML = `
    <div class="analytics-row">
      <div class="analytics-stat">
        <div class="analytics-val">${rate}%</div>
        <div class="analytics-label">This week</div>
      </div>
      <div class="analytics-stat">
        <div class="analytics-val">${state.longestStreak || 0}</div>
        <div class="analytics-label">Best streak</div>
      </div>
      <div class="analytics-stat">
        <div class="analytics-val">${savedStr}</div>
        <div class="analytics-label">Time saved</div>
      </div>
    </div>

    <div class="analytics-chart-label">Screen Time — Last 7 Days</div>
    <div class="day7-chart">${dayBarsHTML}</div>

    <div class="analytics-chart-label" style="margin-top:14px">Weekly Success Rate</div>
    <div class="week-chart">${rateBars}</div>

    <div class="analytics-chart-label" style="margin-top:14px">Recent Check-ins</div>
    <div class="ci-list">${recentHTML}</div>`;
}

// \u{2500}\u{2500}\u{2500} Focus stats \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _renderFocusStats() {
  const container = document.getElementById('focusStatsSection');
  if (!container) return;

  const total      = state.focusSessions || 0;
  const today      = state.dailyFocusSessions || 0;
  const totalHours = Math.round(total * 25 / 60 * 10) / 10;
  const dayStreak  = state.focusDayStreak || 0;

  const streakBadge = dayStreak > 0
    ? `<div class="focus-day-streak-badge">${emojiSVG('fire',16)} ${dayStreak}-day focus streak</div>`
    : '';

  container.innerHTML = `
    <div class="analytics-row">
      <div class="analytics-stat">
        <div class="analytics-val">${total}</div>
        <div class="analytics-label">Total sessions</div>
      </div>
      <div class="analytics-stat">
        <div class="analytics-val">${today}</div>
        <div class="analytics-label">Today</div>
      </div>
      <div class="analytics-stat">
        <div class="analytics-val">${totalHours}h</div>
        <div class="analytics-label">Focus time</div>
      </div>
    </div>
    ${streakBadge}`;
}

// \u{2500}\u{2500}\u{2500} Goal log \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _renderGoalLog() {
  const gl = document.getElementById('goalLogList');
  if (!gl) return;
  gl.innerHTML = '';

  if (!state.goalLog.length) {
    gl.innerHTML = '<div class="goal-log-empty">No goal changes yet</div>';
    return;
  }

  state.goalLog.slice().reverse().slice(0, 8).forEach(g => {
    const d  = new Date(g.date);
    const it = document.createElement('div');
    it.className = 'goal-log-item';
    it.innerHTML = `<span class="goal-log-date">${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span><span class="goal-log-val">${g.hours}h ${String(g.minutes).padStart(2,'0')}m</span>`;
    gl.appendChild(it);
  });
}

// \u{2500}\u{2500}\u{2500} History \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}

function _renderHistory() {
  const hl = document.getElementById('historyList');
  if (!hl) return;
  hl.innerHTML = '';

  const recent = state.checkins.slice().reverse().slice(0, 7);
  if (!recent.length) {
    hl.innerHTML = '<div style="text-align:center;color:var(--text-light);padding:20px;font-size:13px">No check-ins yet</div>';
    return;
  }

  recent.forEach(c => {
    const d   = new Date(c.date);
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-dot ${c.success ? 'win' : 'lose'}"></div>
      <div class="history-info">
        <div class="history-date">${d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
        <div class="history-detail">${c.usedH}h ${c.usedM}m used${c.success ? ' \u{B7} +' + c.reward + ' coins' : ' \u{B7} no coins'}</div>
      </div>`;
    hl.appendChild(div);
  });
}
