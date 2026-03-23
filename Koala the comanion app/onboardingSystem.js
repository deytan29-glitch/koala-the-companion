// ===== NEW USER ONBOARDING SYSTEM =====
// 8-step first-launch flow: Welcome → Referral → Screen Time → Age → Stats → Prediction → Egg Hatch → Name

import { state, save } from './state.js';

// ============================================================
// STEP MANAGER
// ============================================================
let _resolve = null;
let _data = { referral: null, hoursPerDay: 4, age: 22 };

export function shouldShowOnboarding() {
  return !state.onboardingComplete;
}

export function runOnboarding() {
  return new Promise(resolve => {
    _resolve = resolve;
    _buildOverlay();
    _goStep(0);
  });
}

function _finish(koalaName) {
  if (koalaName) state.koalaName = koalaName;
  state.onboardingComplete = true;
  state.onboardingData = {
    referral: _data.referral,
    hoursPerDay: _data.hoursPerDay,
    age: _data.age,
    completedAt: new Date().toISOString(),
  };
  save();
  const overlay = document.getElementById('onboardingOverlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500);
  }
  if (_resolve) { _resolve(); _resolve = null; }
}

// ============================================================
// OVERLAY BUILDER
// ============================================================
function _buildOverlay() {
  const existing = document.getElementById('onboardingOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:90000',
    'background:#1a2744',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'overflow-y:auto',
    'overflow-x:hidden',
    'font-family:Nunito,sans-serif',
  ].join(';');
  document.body.appendChild(overlay);
}

function _setContent(html) {
  const overlay = document.getElementById('onboardingOverlay');
  if (!overlay) return;
  overlay.scrollTo(0, 0);
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'width:100%',
    'max-width:420px',
    'min-height:100%',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    // respect iOS status bar + a bit of breathing room
    'padding:max(env(safe-area-inset-top,0px) + 20px, 36px) 24px max(env(safe-area-inset-bottom,0px) + 24px, 36px)',
    'box-sizing:border-box',
    'opacity:0',
    'transform:translateY(20px)',
    'transition:opacity .35s, transform .35s',
  ].join(';');
  wrapper.innerHTML = html;
  overlay.innerHTML = '';
  overlay.appendChild(wrapper);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    wrapper.style.opacity = '1';
    wrapper.style.transform = 'translateY(0)';
  }));
}

// ============================================================
// STEP ROUTER
// ============================================================
function _goStep(step) {
  switch(step) {
    case 0: _stepWelcome();     break;
    case 1: _stepReferral();    break;
    case 2: _stepScreenTime();  break;
    case 3: _stepAge();         break;
    case 4: _stepStats();       break;
    case 5: _stepPrediction();  break;
    case 6: _stepEgg();         break;
    case 7: _stepName();        break;
  }
}

// ============================================================
// PROGRESS DOTS
// ============================================================
function _dots(active, total = 8) {
  let html = '<div style="display:flex;gap:5px;margin-bottom:8px;">';
  for (let i = 0; i < total; i++) {
    const on = i === active;
    html += `<div style="width:${on?'18px':'7px'};height:7px;border-radius:4px;background:${on?'#7EC8E3':'rgba(255,255,255,0.25)'};transition:all .3s;flex-shrink:0;"></div>`;
  }
  return html + '</div>';
}

function _label(text) {
  return `<div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:20px;letter-spacing:1.2px;text-transform:uppercase;">${text}</div>`;
}

// ============================================================
// STEP 0: WELCOME
// ============================================================
function _stepWelcome() {
  _setContent(`
    ${_dots(0)}
    ${_label('Welcome')}
    <div style="margin-bottom:20px;animation:obBounce 2s ease-in-out infinite;">
      ${_koalaSVG(96)}
    </div>
    <div style="font-size:26px;font-weight:800;color:#fff;text-align:center;line-height:1.2;margin-bottom:10px;">
      Welcome to<br><span style="color:#7EC8E3;">Koala Calm</span>
    </div>
    <div style="font-size:14px;color:rgba(255,255,255,0.6);text-align:center;line-height:1.5;margin-bottom:32px;">
      Your personal companion for mindful screen time.<br>Let's get you set up!
    </div>
    <button onclick="window._obNext()" style="${_btn('#7EC8E3','#1a2744')}">Let's Go!</button>
    <style>
      @keyframes obBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    </style>
  `);
  window._obNext = () => _goStep(1);
}

// ============================================================
// STEP 1: REFERRAL
// ============================================================
function _stepReferral() {
  const options = [
    { id:'app_store', label:'App Store',        icon: _iconAppStore() },
    { id:'friend',    label:'A Friend',          icon: _iconFriend()   },
    { id:'social',    label:'Social Media',      icon: _iconSocial()   },
    { id:'google',    label:'Google / Search',   icon: _iconSearch()   },
    { id:'other',     label:'Other',             icon: _iconStar()     },
  ];

  const optHtml = options.map(o => `
    <button onclick="window._obSelectRef('${o.id}',this)"
      class="ob-ref-btn" data-id="${o.id}"
      style="width:100%;text-align:left;padding:12px 16px;border-radius:14px;
        border:2px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.05);
        color:#fff;font-size:14px;font-weight:700;margin-bottom:8px;cursor:pointer;
        display:flex;align-items:center;gap:12px;transition:all .2s;">
      ${o.icon}${o.label}
    </button>`).join('');

  _setContent(`
    ${_dots(1)}
    ${_label('Quick Question')}
    <div style="font-size:21px;font-weight:800;color:#fff;text-align:center;margin-bottom:6px;">
      How did you hear<br>about us?
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.45);text-align:center;margin-bottom:20px;">
      Help us reach more people like you
    </div>
    ${optHtml}
    <button id="ob-ref-next" onclick="window._obNext()" disabled
      style="${_btn('rgba(126,200,227,0.3)','rgba(255,255,255,0.08)')} margin-top:4px;pointer-events:none;">
      Continue
    </button>
  `);

  window._obSelectRef = (id, btn) => {
    _data.referral = id;
    document.querySelectorAll('.ob-ref-btn').forEach(b => {
      b.style.borderColor = b.dataset.id === id ? '#7EC8E3' : 'rgba(255,255,255,0.14)';
      b.style.background  = b.dataset.id === id ? 'rgba(126,200,227,0.14)' : 'rgba(255,255,255,0.05)';
    });
    const next = document.getElementById('ob-ref-next');
    if (next) { next.disabled = false; next.style.background = '#7EC8E3'; next.style.color = '#1a2744'; next.style.pointerEvents = 'auto'; }
  };
  window._obNext = () => _goStep(2);
}

// ============================================================
// STEP 2: SCREEN TIME
// ============================================================
function _stepScreenTime() {
  _setContent(`
    ${_dots(2)}
    ${_label('About You')}
    <div style="margin-bottom:12px;">${_iconPhone(40)}</div>
    <div style="font-size:21px;font-weight:800;color:#fff;text-align:center;margin-bottom:6px;">
      How much screen time<br>per day?
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.45);text-align:center;margin-bottom:24px;">
      Be honest — no judgement here!
    </div>
    <div style="font-size:48px;font-weight:900;color:#7EC8E3;margin-bottom:2px;line-height:1;" id="ob-st-val">${_data.hoursPerDay}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:18px;">hours per day</div>
    <input type="range" min="1" max="16" value="${_data.hoursPerDay}"
      oninput="window._obUpdateST(this.value)"
      style="width:100%;max-width:280px;height:6px;accent-color:#7EC8E3;margin-bottom:6px;">
    <div style="display:flex;justify-content:space-between;width:100%;max-width:280px;margin-bottom:28px;">
      <span style="font-size:11px;color:rgba(255,255,255,0.35);">1 hr</span>
      <span style="font-size:11px;color:rgba(255,255,255,0.35);">16 hrs</span>
    </div>
    <button onclick="window._obNext()" style="${_btn('#7EC8E3','#1a2744')}">Continue</button>
  `);
  window._obUpdateST = (val) => { _data.hoursPerDay = parseInt(val,10); const el=document.getElementById('ob-st-val'); if(el) el.textContent=_data.hoursPerDay; };
  window._obNext = () => _goStep(3);
}

// ============================================================
// STEP 3: AGE
// ============================================================
function _stepAge() {
  _setContent(`
    ${_dots(3)}
    ${_label('About You')}
    <div style="margin-bottom:12px;">${_iconCake(40)}</div>
    <div style="font-size:21px;font-weight:800;color:#fff;text-align:center;margin-bottom:6px;">
      How old are you?
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.45);text-align:center;margin-bottom:22px;">
      We'll use this to calculate your stats
    </div>
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:28px;">
      <button onclick="window._obAgeAdj(-1)" style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.18);color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
      <div style="text-align:center;">
        <div style="font-size:52px;font-weight:900;color:#7EC8E3;line-height:1;" id="ob-age-val">${_data.age}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.45);">years old</div>
      </div>
      <button onclick="window._obAgeAdj(1)" style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.18);color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
    </div>
    <button onclick="window._obNext()" style="${_btn('#7EC8E3','#1a2744')}">Continue</button>
  `);
  window._obAgeAdj = (d) => { _data.age=Math.max(5,Math.min(100,_data.age+d)); const el=document.getElementById('ob-age-val'); if(el) el.textContent=_data.age; };
  window._obNext = () => _goStep(4);
}

// ============================================================
// STEP 4: STATS REVEAL
// ============================================================
function _stepStats() {
  const totalHours = _data.hoursPerDay * 365 * Math.max(0, _data.age - 10);
  const totalDays  = Math.round(totalHours / 24);
  const totalYears = (totalHours / (365 * 24)).toFixed(1);

  _setContent(`
    ${_dots(4)}
    ${_label('Your Stats')}
    <div style="margin-bottom:16px;">${_iconShocked(44)}</div>
    <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.8);text-align:center;margin-bottom:14px;line-height:1.4;">
      Based on your answers,<br>you've spent roughly…
    </div>
    <div style="background:rgba(255,100,100,0.1);border:2px solid rgba(255,100,100,0.28);border-radius:18px;padding:22px 20px;text-align:center;margin-bottom:12px;width:100%;box-sizing:border-box;">
      <div style="font-size:50px;font-weight:900;color:#FF6B6B;line-height:1;">${totalDays.toLocaleString()}</div>
      <div style="font-size:16px;color:rgba(255,255,255,0.65);margin-top:4px;">days on your phone</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:6px;">That's ${totalYears} years of your life</div>
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.45);text-align:center;margin-bottom:24px;line-height:1.5;">
      You're not alone — most people are shocked<br>when they see the real number.
    </div>
    <button onclick="window._obNext()" style="${_btn('#7EC8E3','#1a2744')}">Reduce Now</button>
  `);
  window._obNext = () => _goStep(5);
}

// ============================================================
// STEP 5: PREDICTION GRAPH
// ============================================================
function _stepPrediction() {
  const now = new Date();
  const fut = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const targetLabel = MONTHS[fut.getMonth()] + ' ' + fut.getFullYear();

  const W=300, H=110;
  const pts = [[0,18],[50,28],[100,50],[150,66],[200,82],[250,96],[W,106]];
  const line = pts.map((p,i)=>`${i===0?'M':'L'}${p[0]},${p[1]}`).join(' ');
  const area = line+` L${W},${H} L0,${H} Z`;

  _setContent(`
    ${_dots(5)}
    ${_label('Your Forecast')}
    <div style="font-size:20px;font-weight:800;color:#fff;text-align:center;line-height:1.3;margin-bottom:6px;">
      We predict by <span style="color:#7EC8E3;">${targetLabel}</span>
    </div>
    <div style="font-size:14px;color:rgba(255,255,255,0.6);text-align:center;margin-bottom:20px;">
      you'll reduce your screen time by <strong style="color:#7EC8E3;">50%</strong>
    </div>
    <div style="width:100%;max-width:320px;margin-bottom:8px;">
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible;">
        <line x1="0" y1="${H*.25}" x2="${W}" y2="${H*.25}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <line x1="0" y1="${H*.5}"  x2="${W}" y2="${H*.5}"  stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <line x1="0" y1="${H*.75}" x2="${W}" y2="${H*.75}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <path d="${area}" fill="rgba(255,80,80,0.13)"/>
        <path d="${line}" fill="none" stroke="#FF6B6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="0" cy="18" r="4" fill="#FF6B6B"/>
        <circle cx="${W}" cy="106" r="4" fill="#7EC8E3"/>
        <text x="6" y="14" fill="rgba(255,255,255,0.5)" font-size="8">Now</text>
        <text x="${W-36}" y="104" fill="#7EC8E3" font-size="8">${targetLabel.split(' ')[0]}</text>
      </svg>
    </div>
    <div style="font-size:11px;color:rgba(255,255,255,0.3);text-align:center;margin-bottom:24px;">
      Based on your usage pattern and our app data
    </div>
    <button onclick="window._obNext()" style="${_btn('#7EC8E3','#1a2744')}">Now Meet Your Koala</button>
  `);
  window._obNext = () => _goStep(6);
}

// ============================================================
// STEP 6: EGG HATCHING
// ============================================================
function _stepEgg() {
  let _taps = 0;

  _setContent(`
    ${_dots(6)}
    ${_label('Hatch Your Koala')}
    <div style="font-size:20px;font-weight:800;color:#fff;text-align:center;margin-bottom:24px;">
      Tap to open your egg!
    </div>
    <div id="ob-egg-wrap" style="position:relative;width:140px;height:168px;cursor:pointer;user-select:none;flex-shrink:0;"
      onclick="window._obTapEgg()">
      ${_eggSVG(0)}
      <div id="ob-egg-hint" style="position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);
        white-space:nowrap;font-size:13px;color:rgba(255,255,255,0.5);">Tap to crack</div>
    </div>
    <div id="ob-hearts" style="position:relative;width:140px;height:50px;margin-top:40px;pointer-events:none;flex-shrink:0;"></div>
    <style>@keyframes obShake{0%{transform:translateX(0)}12%{transform:translateX(-7px) rotate(-3deg)}25%{transform:translateX(7px) rotate(3deg)}37%{transform:translateX(-5px)}50%{transform:translateX(5px)}62%{transform:translateX(-3px)}75%{transform:translateX(3px)}100%{transform:translateX(0)}}</style>
  `);

  window._obTapEgg = () => {
    _taps++;
    if (_taps === 1) _doTap1();
    else if (_taps === 2) _doTap2();
  };

  function _doTap1() {
    const wrap = document.getElementById('ob-egg-wrap');
    if (!wrap) return;
    wrap.innerHTML = _eggSVG(1) + `<div id="ob-egg-hint" style="position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:13px;color:rgba(255,255,255,0.5);">Tap again!</div>`;
    wrap.style.animation = 'obShake .45s ease-in-out';
    setTimeout(() => { if (wrap) wrap.style.animation = ''; }, 460);
  }

  function _doTap2() {
    const wrap = document.getElementById('ob-egg-wrap');
    if (!wrap) return;
    wrap.style.transition = 'transform .25s';
    wrap.style.transform = 'scale(1.12)';
    wrap.innerHTML = _eggSVG(2);
    setTimeout(() => {
      if (!wrap) return;
      wrap.style.transform = 'scale(1)';
      wrap.onclick = null;
      wrap.innerHTML = `<div style="animation:obBounce 2s ease-in-out infinite;filter:drop-shadow(0 0 12px rgba(126,200,227,0.5))">${_koalaSVG(110)}</div>`;
      _spawnHearts();
      setTimeout(() => _goStep(7), 2000);
    }, 300);
  }

  function _spawnHearts() {
    const container = document.getElementById('ob-hearts');
    if (!container) return;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        const x = 10 + Math.random() * 110;
        el.style.cssText = `position:absolute;left:${x}px;bottom:0;opacity:1;transition:all 1.1s ease-out;pointer-events:none;`;
        // SVG heart — no emoji character, no WKWebView issues
        el.innerHTML = `<svg viewBox="0 0 36 36" width="${14+Math.random()*10|0}" height="${14+Math.random()*10|0}"><path fill="#FF6B8A" d="M18 30l-1.5-1.4C7 20.5 2 16 2 10.5 2 6 5.5 2 10 2c2.7 0 5.2 1.3 7 3.2h2C20.8 3.3 23.3 2 26 2c4.5 0 8 4 8 8.5 0 5.5-5 10-15.5 18.1z"/></svg>`;
        container.appendChild(el);
        requestAnimationFrame(() => {
          el.style.transform = `translateY(-${50 + Math.random()*30}px) rotate(${(Math.random()-.5)*25}deg)`;
          el.style.opacity = '0';
        });
        setTimeout(() => el.remove(), 1200);
      }, i * 110);
    }
  }
}

// ============================================================
// STEP 7: NAME YOUR KOALA
// ============================================================
function _stepName() {
  const animal = state.selectedAnimal || 'koala';
  const defaultName = animal.charAt(0).toUpperCase() + animal.slice(1);

  _setContent(`
    ${_dots(7)}
    ${_label('Almost There!')}
    <div style="margin-bottom:16px;animation:obBounce 2s ease-in-out infinite;">
      ${_koalaSVG(90)}
    </div>
    <div style="font-size:22px;font-weight:800;color:#fff;text-align:center;margin-bottom:6px;">
      Name your koala!
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.45);text-align:center;margin-bottom:24px;">
      Give your companion a name
    </div>
    <input id="ob-name-input" type="text" placeholder="${defaultName}" maxlength="20"
      style="width:100%;padding:14px 18px;border-radius:14px;border:2px solid rgba(126,200,227,0.35);
        background:rgba(255,255,255,0.07);color:#fff;font-size:18px;font-weight:700;
        text-align:center;box-sizing:border-box;outline:none;margin-bottom:22px;
        font-family:Nunito,sans-serif;">
    <button onclick="window._obFinish()" style="${_btn('#7EC8E3','#1a2744')}">
      Start Your Journey!
    </button>
  `);
  setTimeout(() => { const i = document.getElementById('ob-name-input'); if(i) i.focus(); }, 400);
  window._obFinish = () => {
    const input = document.getElementById('ob-name-input');
    _finish((input ? input.value.trim() : '') || defaultName);
  };
}

// ============================================================
// SVG HELPERS
// ============================================================
function _koalaSVG(size = 96) {
  const h = Math.round(size * 110 / 100);
  return `<svg viewBox="0 0 100 110" fill="none" width="${size}" height="${h}" aria-hidden="true">
    <ellipse cx="17" cy="21" rx="15" ry="15" fill="#9E9E9E"/>
    <ellipse cx="17" cy="21" rx="9"  ry="9"  fill="#C4A882"/>
    <ellipse cx="83" cy="21" rx="15" ry="15" fill="#9E9E9E"/>
    <ellipse cx="83" cy="21" rx="9"  ry="9"  fill="#C4A882"/>
    <ellipse cx="50" cy="38" rx="28" ry="25" fill="#9E9E9E"/>
    <ellipse cx="50" cy="43" rx="18" ry="14" fill="#E8E0D8"/>
    <ellipse cx="40" cy="37" rx="3.8" ry="4.5" fill="#3D3229"/>
    <circle  cx="38.5" cy="35.5" r="1.4" fill="#fff" opacity=".9"/>
    <ellipse cx="60" cy="37" rx="3.8" ry="4.5" fill="#3D3229"/>
    <circle  cx="58.5" cy="35.5" r="1.4" fill="#fff" opacity=".9"/>
    <ellipse cx="50" cy="46" rx="5.5" ry="3.8" fill="#5C4A3A"/>
    <path d="M45 50 Q50 53.5 55 50" stroke="#5C4A3A" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="46" rx="5" ry="2.5" fill="#FFC0CB" opacity=".5"/>
    <ellipse cx="66" cy="46" rx="5" ry="2.5" fill="#FFC0CB" opacity=".5"/>
    <ellipse cx="50" cy="76" rx="24" ry="22" fill="#9E9E9E"/>
    <ellipse cx="50" cy="79" rx="16" ry="15" fill="#D8D0C8"/>
    <ellipse cx="26" cy="72" rx="8" ry="11" fill="#8E8E8E" transform="rotate(-10 26 72)"/>
    <ellipse cx="74" cy="72" rx="8" ry="11" fill="#8E8E8E" transform="rotate(10 74 72)"/>
    <ellipse cx="38" cy="96" rx="10" ry="6.5" fill="#8E8E8E"/>
    <ellipse cx="62" cy="96" rx="10" ry="6.5" fill="#8E8E8E"/>
  </svg>`;
}

function _eggSVG(state) {
  const base = `
    <ellipse cx="70" cy="95" rx="48" ry="60" fill="#F5F0E8"/>
    <ellipse cx="55" cy="70" rx="7" ry="5"   fill="#E8E0D0" opacity=".55"/>
    <ellipse cx="87" cy="85" rx="5" ry="4"   fill="#E8E0D0" opacity=".55"/>
    <ellipse cx="66" cy="118" rx="6" ry="4"  fill="#E8E0D0" opacity=".5"/>
    <ellipse cx="95" cy="58"  rx="5" ry="3"  fill="#E8E0D0" opacity=".45"/>
    <ellipse cx="55" cy="57" rx="9" ry="12"  fill="#fff" opacity=".22" transform="rotate(-20 55 57)"/>`;
  const cracks1 = `
    <path d="M70 62 L63 76 L70 81 L60 100" stroke="#C8B8A0" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M70 62 L77 73 L72 79 L81 94"  stroke="#C8B8A0" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M70 62 L70 53" stroke="#C8B8A0" stroke-width="1.2" fill="none"/>`;
  const cracks2 = `
    <path d="M70 62 L63 76 L70 81 L60 100" stroke="#B0A088" stroke-width="2"   fill="none" stroke-linecap="round"/>
    <path d="M70 62 L77 73 L72 79 L81 94"  stroke="#B0A088" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M70 62 L70 53"  stroke="#B0A088" stroke-width="1.6" fill="none"/>
    <path d="M60 79 L51 72"  stroke="#B0A088" stroke-width="1.3" fill="none"/>
    <path d="M81 81 L90 74"  stroke="#B0A088" stroke-width="1.3" fill="none"/>
    <path d="M57 67 Q70 57 83 67" stroke="#FFE0A0" stroke-width="1.8" fill="none" opacity=".5" stroke-linecap="round"/>
    <ellipse cx="40" cy="44" rx="18" ry="12" fill="#F5F0E8" opacity=".88" transform="rotate(-30 40 44)"/>
    <ellipse cx="100" cy="40" rx="16" ry="10" fill="#F5F0E8" opacity=".88" transform="rotate(25 100 40)"/>`;
  return `<svg viewBox="0 0 140 168" width="140" height="168" fill="none">${base}${state===1?cracks1:state===2?cracks2:''}</svg>`;
}

// ---- Icon SVGs (no emoji chars, WKWebView-safe) ----
function _iconAppStore() {
  return `<svg viewBox="0 0 36 36" width="26" height="26" fill="none">
    <rect width="36" height="36" rx="8" fill="#1C8AFF"/>
    <path d="M18 8l3 5h-6l3-5z" fill="#fff"/>
    <path d="M10 20l-3 5h6l-1-2.5" fill="#fff" stroke="#fff" stroke-width=".5"/>
    <path d="M26 20l3 5h-6" fill="#fff" stroke="#fff" stroke-width=".5"/>
    <line x1="7" y1="25" x2="29" y2="25" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  </svg> `;
}
function _iconFriend() {
  return `<svg viewBox="0 0 36 36" width="26" height="26" fill="none">
    <circle cx="13" cy="13" r="6" fill="#FFCC4D"/>
    <circle cx="23" cy="16" r="5" fill="#FFAA30"/>
    <path d="M4 30c0-5 4-8 9-8s9 3 9 8" fill="#FFCC4D"/>
    <path d="M22 30c0-4 3-7 7-7" fill="none" stroke="#FFAA30" stroke-width="2" stroke-linecap="round"/>
    <circle cx="29" cy="23" r="4" fill="#FFAA30"/>
  </svg> `;
}
function _iconSocial() {
  return `<svg viewBox="0 0 36 36" width="26" height="26" fill="none">
    <rect x="4" y="4" width="28" height="28" rx="8" fill="#5DADEC"/>
    <circle cx="18" cy="16" r="5" fill="#fff"/>
    <rect x="24" y="8" width="4" height="4" rx="1" fill="#fff"/>
    <rect x="8"  y="8" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="2"/>
  </svg> `;
}
function _iconSearch() {
  return `<svg viewBox="0 0 36 36" width="26" height="26" fill="none">
    <circle cx="15" cy="15" r="9" fill="none" stroke="#7EC8E3" stroke-width="2.5"/>
    <line x1="22" y1="22" x2="30" y2="30" stroke="#7EC8E3" stroke-width="2.5" stroke-linecap="round"/>
  </svg> `;
}
function _iconStar() {
  return `<svg viewBox="0 0 36 36" width="26" height="26" fill="none">
    <polygon points="18,3 22,13 33,13 24,21 27,32 18,25 9,32 12,21 3,13 14,13" fill="#FFCC4D"/>
  </svg> `;
}
function _iconPhone(size = 36) {
  return `<svg viewBox="0 0 36 36" width="${size}" height="${size}" fill="none">
    <rect x="10" y="2" width="16" height="32" rx="3" fill="#5DADEC"/>
    <rect x="12" y="5" width="12" height="22" rx="1" fill="#1a2744"/>
    <circle cx="18" cy="31" r="1.5" fill="#fff"/>
  </svg>`;
}
function _iconCake(size = 36) {
  return `<svg viewBox="0 0 36 36" width="${size}" height="${size}" fill="none">
    <rect x="4" y="18" width="28" height="14" rx="3" fill="#FFCC4D"/>
    <rect x="8" y="14" width="20" height="8"  rx="2" fill="#FF9AA2"/>
    <line x1="12" y1="14" x2="12" y2="8" stroke="#FFCC4D" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="7" r="2" fill="#FF6B6B"/>
    <line x1="18" y1="14" x2="18" y2="6" stroke="#FFCC4D" stroke-width="2" stroke-linecap="round"/>
    <circle cx="18" cy="5" r="2" fill="#FF6B6B"/>
    <line x1="24" y1="14" x2="24" y2="8" stroke="#FFCC4D" stroke-width="2" stroke-linecap="round"/>
    <circle cx="24" cy="7" r="2" fill="#FF6B6B"/>
  </svg>`;
}
function _iconShocked(size = 36) {
  return `<svg viewBox="0 0 36 36" width="${size}" height="${size}" fill="none">
    <circle cx="18" cy="18" r="16" fill="#FFCC4D"/>
    <ellipse cx="12" cy="15" rx="2.2" ry="3" fill="#664500"/>
    <ellipse cx="24" cy="15" rx="2.2" ry="3" fill="#664500"/>
    <ellipse cx="18" cy="24" rx="4"  ry="5"  fill="#664500"/>
    <path d="M10 11 Q12 8 14 11" stroke="#664500" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M22 11 Q24 8 26 11" stroke="#664500" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// ============================================================
// BUTTON STYLE
// ============================================================
function _btn(bg, color) {
  return `width:100%;padding:15px;border-radius:14px;background:${bg};color:${color};
    font-size:16px;font-weight:800;border:none;cursor:pointer;letter-spacing:.2px;
    font-family:Nunito,sans-serif;transition:opacity .15s;flex-shrink:0;`;
}
