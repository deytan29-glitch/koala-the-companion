// ===== ENVIRONMENT SYSTEM =====
// Manages time-of-day, weather, clouds, stars, rain, snow, floor, ambient particles

import { state } from './state.js';
import { emojiSVG } from './emojiSVG.js';

// Callback registered from app.js to avoid circular dependency with koalaSystem
let _onSleepStateChange = null;
export function registerSleepCallback(fn) { _onSleepStateChange = fn; }

// ===== CURRENT WEATHER STATE =====
export let currentWeather = { type: 'clear', temp: null, desc: '' };

// ===== TIME OF DAY =====
export function getMSTHour() {
  const now = new Date();
  return { h: now.getHours(), m: now.getMinutes(), date: now };
}

export function getToD() {
  const { h } = getMSTHour();
  if (h >= 5 && h < 7)  return 'dawn';
  if (h >= 7 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'afternoon';
  if (h >= 16 && h < 18) return 'golden';
  if (h >= 18 && h < 20) return 'evening';
  return 'night';
}

export function applyToD() {
  const t = getToD();
  const sky = document.getElementById('roomSky');
  if (!sky) return;

  sky.className = 'room-sky sky-' + t;

  const isNight   = t === 'night';
  const isDawn    = t === 'dawn';
  const isGolden  = t === 'golden';
  const isEvening = t === 'evening';

  // Stars & moon
  document.getElementById('starsLayer').classList.toggle('visible', isNight);
  document.getElementById('moon').classList.toggle('visible', isNight);

  // Cloud opacity
  const cl = document.getElementById('cloudLayer');
  if (isNight)           cl.style.opacity = '0';
  else if (isDawn || isEvening) cl.style.opacity = '0.4';
  else if (isGolden)     cl.style.opacity = '0.7';
  else                   cl.style.opacity = '1';

  // Tint clouds
  cl.querySelectorAll('svg').forEach(svg => {
    if (isGolden)  svg.style.filter = 'sepia(0.3) brightness(1.1) hue-rotate(-10deg)';
    else if (isEvening) svg.style.filter = 'sepia(0.5) brightness(0.9) hue-rotate(-20deg)';
    else if (isDawn)    svg.style.filter = 'sepia(0.2) brightness(0.95) hue-rotate(10deg)';
    else                svg.style.filter = '';
  });

  // Lamp/fireplace glows
  if (state.ownedItems.includes('lamp')) {
    document.getElementById('lampGlow').classList.toggle('on', isNight || isEvening);
  }
  if (state.ownedItems.includes('fireplace')) {
    document.getElementById('fireplaceGlow').classList.add('on');
  }

  // Sleep state via callback \u{2014} only after 8pm (night), not during evening
  const isTodayDone = state.todayCheckedIn === new Date().toDateString();
  if (_onSleepStateChange) _onSleepStateChange(isTodayDone && isNight);

  // Wall tinting
  const wall = document.querySelector('.room-wall');
  if (wall) {
    if (isNight)        wall.style.background = 'linear-gradient(180deg,#C0B8AC 0%,#B0A89C 35%,#A29A8E 70%,#969088 100%)';
    else if (isEvening) wall.style.background = 'linear-gradient(180deg,#ECD8C4 0%,#E4CCB4 35%,#DCC0A8 70%,#D4B8A0 100%)';
    else if (isDawn)    wall.style.background = 'linear-gradient(180deg,#E8DDD0 0%,#E0D4C6 35%,#D8CCBE 70%,#D2C8BA 100%)';
    else if (isGolden)  wall.style.background = 'linear-gradient(180deg,#FDF4E4 0%,#F8ECD4 35%,#F2E4C8 70%,#ECDCBC 100%)';
    else                wall.style.background = '';
  }

  // Mountain tinting
  const sceneFar  = document.getElementById('sceneFar');
  const sceneMid  = document.getElementById('sceneMid');
  const sceneNear = document.getElementById('sceneNear');
  const haze      = document.getElementById('sceneHaze');

  if (isNight) {
    if (sceneFar)  sceneFar.style.filter  = 'brightness(0.22) saturate(0.3) hue-rotate(-15deg)';
    if (sceneMid)  sceneMid.style.filter  = 'brightness(0.18) saturate(0.2) hue-rotate(-12deg)';
    if (sceneNear) sceneNear.style.filter = 'brightness(0.12) saturate(0.15) hue-rotate(-10deg)';
    if (haze)      haze.style.opacity     = '0.3';
  } else if (isEvening) {
    if (sceneFar)  sceneFar.style.filter  = 'brightness(0.6) saturate(0.7) sepia(0.2) hue-rotate(12deg)';
    if (sceneMid)  sceneMid.style.filter  = 'brightness(0.48) saturate(0.6) sepia(0.15) hue-rotate(8deg)';
    if (sceneNear) sceneNear.style.filter = 'brightness(0.35) saturate(0.5) sepia(0.1) hue-rotate(5deg)';
    if (haze)      haze.style.opacity     = '0.5';
  } else if (isDawn) {
    if (sceneFar)  sceneFar.style.filter  = 'brightness(0.55) saturate(0.5) sepia(0.1) hue-rotate(8deg)';
    if (sceneMid)  sceneMid.style.filter  = 'brightness(0.45) saturate(0.45) sepia(0.08) hue-rotate(5deg)';
    if (sceneNear) sceneNear.style.filter = 'brightness(0.35) saturate(0.4) hue-rotate(3deg)';
    if (haze)      haze.style.opacity     = '0.8';
  } else if (isGolden) {
    if (sceneFar)  sceneFar.style.filter  = 'brightness(0.85) saturate(0.85) sepia(0.18)';
    if (sceneMid)  sceneMid.style.filter  = 'brightness(0.75) saturate(0.8) sepia(0.12)';
    if (sceneNear) sceneNear.style.filter = 'brightness(0.65) saturate(0.75) sepia(0.08)';
    if (haze)      haze.style.opacity     = '0.6';
  } else {
    if (sceneFar)  sceneFar.style.filter  = '';
    if (sceneMid)  sceneMid.style.filter  = '';
    if (sceneNear) sceneNear.style.filter = '';
    if (haze)      haze.style.opacity     = '1';
  }

  // Window light cast
  const wlc = document.getElementById('windowLightCast');
  if (wlc) wlc.className = 'window-light-cast ' + t;

  // Floor tinting
  const floor = document.getElementById('roomFloor');
  if (floor) {
    if (isNight)        floor.style.filter = 'brightness(0.65) saturate(0.5)';
    else if (isEvening) floor.style.filter = 'brightness(0.82) sepia(0.12)';
    else if (isGolden)  floor.style.filter = 'brightness(1.05) sepia(0.1)';
    else if (isDawn)    floor.style.filter = 'brightness(0.88) sepia(0.05)';
    else                floor.style.filter = '';
  }

  applyWeather();
}

// ===== LIVE WEATHER (Open-Meteo, Phoenix AZ \u{2014} no API key needed) =====
export function fetchWeather() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=33.45&longitude=-112.07&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America/Phoenix';
  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (!data.current) return;
      const code = data.current.weather_code;
      const temp = Math.round(data.current.temperature_2m);
      currentWeather.temp = temp;

      // WMO weather code \u{2192} type
      if (code <= 1)              { currentWeather.type = 'clear';  currentWeather.desc = 'Clear'; }
      else if (code <= 3)         { currentWeather.type = 'cloudy'; currentWeather.desc = 'Cloudy'; }
      else if (code >= 51 && code <= 67) { currentWeather.type = 'rain';  currentWeather.desc = 'Rain'; }
      else if (code >= 71 && code <= 77) { currentWeather.type = 'snow';  currentWeather.desc = 'Snow'; }
      else if (code >= 80 && code <= 82) { currentWeather.type = 'rain';  currentWeather.desc = 'Showers'; }
      else if (code >= 95)        { currentWeather.type = 'storm'; currentWeather.desc = 'Thunderstorm'; }
      else if (code >= 45 && code <= 48) { currentWeather.type = 'fog';   currentWeather.desc = 'Foggy'; }
      else                        { currentWeather.type = 'cloudy'; currentWeather.desc = 'Overcast'; }

      updateWeatherBadge();
      applyWeather();
    })
    .catch(() => { /* silent fail \u{2014} keep default clear */ });
}

export function updateWeatherBadge() {
  const badge = document.getElementById('weatherBadge');
  if (!badge) return;
  if (!state.ownedItems.includes('weather')) { badge.style.display = 'none'; return; }
  badge.style.display = 'flex';
  const icons = { clear: emojiSVG('sun',18), cloudy: emojiSVG('cloud',18), rain: emojiSVG('rain',18), snow: emojiSVG('snow',18), storm: emojiSVG('storm',18), fog: emojiSVG('fog',18) };
  document.getElementById('weatherIcon').innerHTML = icons[currentWeather.type] || emojiSVG('sun',18);
  document.getElementById('weatherTemp').textContent = currentWeather.temp !== null ? currentWeather.temp + '\u{B0}F' : '';
}

export function applyWeather() {
  const rainLayer    = document.getElementById('rainLayer');
  const snowLayer    = document.getElementById('snowLayer');
  const windowGlass  = document.getElementById('windowGlass');
  const roomSky      = document.getElementById('roomSky');
  const haze         = document.getElementById('sceneHaze');

  if (!state.ownedItems.includes('weather')) {
    rainLayer && rainLayer.classList.remove('active');
    snowLayer && snowLayer.classList.remove('active');
    windowGlass && windowGlass.classList.remove('foggy');
    roomSky && (roomSky.style.filter = '');
    return;
  }

  const w = currentWeather.type;
  rainLayer && rainLayer.classList.toggle('active', w === 'rain' || w === 'storm');
  snowLayer && snowLayer.classList.toggle('active', w === 'snow');
  windowGlass && windowGlass.classList.toggle('foggy', w === 'fog' || w === 'snow');

  let skyFilter = '';
  if (w === 'rain')       skyFilter = 'brightness(0.75) saturate(0.7)';
  else if (w === 'storm') skyFilter = 'brightness(0.6) saturate(0.5)';
  else if (w === 'cloudy') skyFilter = 'brightness(0.88) saturate(0.8)';
  else if (w === 'fog')   skyFilter = 'brightness(0.8) saturate(0.5) contrast(0.9)';
  else if (w === 'snow')  skyFilter = 'brightness(0.85) saturate(0.6) hue-rotate(-5deg)';
  roomSky && (roomSky.style.filter = skyFilter);

  if (haze) {
    if (w === 'fog')             haze.style.background = 'linear-gradient(180deg,rgba(180,190,200,.3) 0%,rgba(170,185,200,.5) 40%,rgba(160,180,200,.6) 70%,rgba(150,170,190,.4) 100%)';
    else if (w === 'rain' || w === 'storm') haze.style.background = 'linear-gradient(180deg,rgba(140,155,175,.2) 0%,rgba(130,150,170,.35) 40%,rgba(120,140,165,.3) 70%,rgba(110,130,155,.15) 100%)';
    else if (w === 'snow')       haze.style.background = 'linear-gradient(180deg,rgba(200,210,220,.25) 0%,rgba(190,205,218,.4) 40%,rgba(180,200,215,.35) 70%,rgba(170,190,210,.2) 100%)';
    else                         haze.style.background = '';
  }

  if (w === 'storm') startLightning(); else stopLightning();
}

// ===== LIGHTNING =====
let _lightningTimer = null;
export function startLightning() {
  if (_lightningTimer) return;
  function flash() {
    const el = document.getElementById('lightningFlash');
    if (!el) return;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 80);
    setTimeout(() => {
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 60);
    }, 200);
    _lightningTimer = setTimeout(flash, 4000 + Math.random() * 8000);
  }
  _lightningTimer = setTimeout(flash, 2000);
}
export function stopLightning() {
  if (_lightningTimer) { clearTimeout(_lightningTimer); _lightningTimer = null; }
}

// ===== CLOUDS =====
export function genClouds() {
  const cl = document.getElementById('cloudLayer');
  if (!cl) return;
  cl.innerHTML = '';
  const clouds = [
    { x:-5,  y:4,  w:90,  h:32, opacity:.65, speed:.006 },
    { x:25,  y:14, w:70,  h:28, opacity:.5,  speed:.008 },
    { x:55,  y:7,  w:100, h:36, opacity:.55, speed:.005 },
    { x:80,  y:20, w:60,  h:24, opacity:.4,  speed:.009 },
    { x:10,  y:28, w:50,  h:20, opacity:.35, speed:.007 },
    { x:65,  y:30, w:45,  h:18, opacity:.3,  speed:.01  },
  ];
  clouds.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'cloud';
    div.style.cssText = `left:${c.x}%;top:${c.y}%;width:${c.w}px`;
    const cw = c.w, ch = c.h, o = c.opacity;
    div.innerHTML = `<svg viewBox="0 0 ${cw} ${ch}" width="${cw}" height="${ch}">
      <ellipse cx="${cw*.3}"  cy="${ch*.65}" rx="${cw*.22}" ry="${ch*.35}" fill="rgba(255,255,255,${o*.8})"/>
      <ellipse cx="${cw*.5}"  cy="${ch*.6}"  rx="${cw*.28}" ry="${ch*.4}"  fill="rgba(255,255,255,${o})"/>
      <ellipse cx="${cw*.7}"  cy="${ch*.65}" rx="${cw*.2}"  ry="${ch*.32}" fill="rgba(255,255,255,${o*.75})"/>
      <ellipse cx="${cw*.42}" cy="${ch*.42}" rx="${cw*.2}"  ry="${ch*.3}"  fill="rgba(255,255,255,${o*.9})"/>
      <ellipse cx="${cw*.58}" cy="${ch*.45}" rx="${cw*.18}" ry="${ch*.28}" fill="rgba(255,255,255,${o*.85})"/>
    </svg>`;
    cl.appendChild(div);
    // Slow organic drift
    let xPos = c.x;
    const spd = c.speed;
    function drift() { xPos += spd; if (xPos > 105) xPos = -15; div.style.left = xPos + '%'; requestAnimationFrame(drift); }
    setTimeout(drift, i * 600);
    setTimeout(() => div.classList.add('visible'), 400 + i * 300);
  });
}

// ===== STARS =====
export function genStars() {
  const c = document.getElementById('starsLayer');
  if (!c) return;
  const twinkleClasses = ['twinkle-slow', 'twinkle-fast', 'twinkle-gentle'];
  for (let i = 0; i < 55; i++) {
    const s = document.createElement('div');
    s.className = 'star ' + twinkleClasses[Math.floor(Math.random() * 3)];
    s.style.left = Math.random() * 100 + '%';
    s.style.top  = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 6) + 's';
    let size = Math.random() * 2.5 + 0.5;
    if (Math.random() < 0.12) size = 2.5 + Math.random() * 1.5;
    s.style.width = s.style.height = size + 'px';
    c.appendChild(s);
  }
}

// ===== SHOOTING STARS =====
let _shootingStarTimer = null;
export function startShootingStars() {
  if (_shootingStarTimer) return;
  function shoot() {
    if (getToD() !== 'night') { _shootingStarTimer = setTimeout(shoot, 10000); return; }
    const sl = document.getElementById('starsLayer');
    if (!sl) return;
    const star = document.createElement('div');
    star.className = 'shooting-star';
    star.style.left = (10 + Math.random() * 40) + '%';
    star.style.top  = (5  + Math.random() * 25) + '%';
    sl.appendChild(star);
    requestAnimationFrame(() => star.classList.add('fly'));
    setTimeout(() => star.remove(), 1400);
    _shootingStarTimer = setTimeout(shoot, 8000 + Math.random() * 15000);
  }
  _shootingStarTimer = setTimeout(shoot, 5000);
}

// ===== FLOOR =====
export function genFloor() {
  const f = document.getElementById('roomFloor');
  if (!f) return;
  for (let i = 1; i <= 7; i++) {
    const p = document.createElement('div');
    p.className = 'plank-line';
    p.style.top = (i * 13.5) + '%';
    p.style.height = (i % 2 === 0 ? '2px' : '1.5px');
    f.appendChild(p);
  }
  [[25,0,13.5],[60,0,13.5],[40,13.5,27],[75,13.5,27],[20,27,40.5],[55,27,40.5],[35,40.5,54],[70,40.5,54]].forEach(a => {
    const j = document.createElement('div');
    j.className = 'plank-joint';
    j.style.left = a[0] + '%';
    j.style.top  = a[1] + '%';
    j.style.height = (a[2] - a[1]) + '%';
    f.appendChild(j);
  });
}

// ===== RAIN =====
export function genRain() {
  const rl = document.getElementById('rainLayer');
  if (!rl) return;
  rl.innerHTML = '';
  for (let i = 0; i < 35; i++) {
    const d = document.createElement('div');
    d.className = 'raindrop';
    const h = 6 + Math.random() * 18;
    const w = Math.random() > .7 ? 1.5 : 1;
    d.style.cssText = `left:${Math.random()*100}%;top:-${h}px;height:${h}px;width:${w}px;animation-duration:${0.35+Math.random()*0.35}s;animation-delay:${Math.random()*1.2}s;opacity:${0.3+Math.random()*0.4}`;
    rl.appendChild(d);
  }
}

// ===== SNOW =====
export function genSnow() {
  const sl = document.getElementById('snowLayer');
  if (!sl) return;
  sl.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('div');
    s.className = 'snowflake';
    const sz = 1.5 + Math.random() * 3.5;
    s.style.cssText = `left:${Math.random()*100}%;top:-5px;width:${sz}px;height:${sz}px;animation-duration:${2.5+Math.random()*4}s;animation-delay:${Math.random()*3}s;opacity:${0.4+Math.random()*0.5}`;
    sl.appendChild(s);
  }
}

// ===== AMBIENT PARTICLES (sunbeam dust + fireflies) =====
let _ambientTimer = null;
export function startAmbientParticles() {
  function update() {
    const tod = getToD();
    const al  = document.getElementById('ambientLayer');
    const sb  = document.getElementById('sunbeam');
    if (!al) return;
    al.innerHTML = '';

    // Sunbeam + dust motes during daytime
    if (tod === 'morning' || tod === 'afternoon') {
      if (sb) sb.classList.add('visible');
      for (let i = 0; i < 6; i++) {
        const dm = document.createElement('div');
        dm.className = 'dust-mote';
        dm.style.left = (55 + Math.random() * 35) + '%';
        dm.style.top  = (20 + Math.random() * 50) + '%';
        dm.style.setProperty('--dx',  (Math.random() - 0.5) * 20 + 'px');
        dm.style.setProperty('--dy',  (-20 - Math.random() * 40) + 'px');
        dm.style.setProperty('--dx2', (Math.random() - 0.5) * 15 + 'px');
        dm.style.setProperty('--dy2', (-30 - Math.random() * 50) + 'px');
        dm.style.setProperty('--dur', (6 + Math.random() * 6) + 's');
        dm.style.animationDelay = (Math.random() * 5) + 's';
        al.appendChild(dm);
        dm.classList.add('float');
      }
    } else {
      if (sb) sb.classList.remove('visible');
    }

    // Fireflies at dusk/evening
    if (tod === 'golden' || tod === 'evening') {
      for (let j = 0; j < 4; j++) {
        const ff = document.createElement('div');
        ff.className = 'firefly';
        ff.style.left = (10 + Math.random() * 80) + '%';
        ff.style.top  = (30 + Math.random() * 50) + '%';
        ff.style.setProperty('--fx',  (Math.random() - 0.5) * 40 + 'px');
        ff.style.setProperty('--fy',  (-10 - Math.random() * 30) + 'px');
        ff.style.setProperty('--fx2', (Math.random() - 0.5) * 30 + 'px');
        ff.style.setProperty('--fy2', (Math.random() - 0.5) * 20 + 'px');
        ff.style.setProperty('--dur', (4 + Math.random() * 5) + 's');
        ff.style.animationDelay = (Math.random() * 4) + 's';
        al.appendChild(ff);
        ff.classList.add('glow');
      }
    }

    _ambientTimer = setTimeout(update, 30000);
  }
  update();
}

// ===== TRANSITION TO NIGHT (after check-in) =====
export function transitionToNight() {
  setTimeout(() => {
    const sky = document.getElementById('roomSky');
    if (sky) sky.className = 'room-sky sky-night';
    document.getElementById('starsLayer')?.classList.add('visible');
    document.getElementById('moon')?.classList.add('visible');
    const cl = document.getElementById('cloudLayer');
    if (cl) cl.style.opacity = '0';
    if (state.ownedItems.includes('lamp')) {
      document.getElementById('lampGlow')?.classList.add('on');
    }
    setTimeout(() => {
      if (_onSleepStateChange) _onSleepStateChange(true);
    }, 800);
  }, 600);
}
