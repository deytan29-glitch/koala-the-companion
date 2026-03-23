// ===== KOALA SYSTEM =====
// Manages koala animations, interactions, idle behaviors, and room decor rendering

import { state, save } from './state.js';
import { SHOP_ITEMS, itemSVG } from './data.js';
import { getToD } from './environmentSystem.js';
import { addInteractionEnergy } from './energySystem.js';
import { getMoodThoughts } from './moodSystem.js';
import { addXP } from './xpSystem.js';
import { addBond } from './bondSystem.js';
import { emojiSVG } from './emojiSVG.js';

// ===== HEALTH HELPERS =====
function getHealth() { return Math.max(0, Math.min(100, state.health || 100)); }
function isHurt() { return getHealth() < 70; }

// ===== KOALA STATE =====
export const koalaState = {
  busy: false,
  mood: 'happy',
  interactCount: 0,
  lastInteract: 0,
  currentPos: 50,
  facingLeft: false,
  isAtItem: false,
  atItemId: null,
  idleSince: Date.now(),
};

// ===== HELPER: CHECK IF HOME SCREEN IS ACTIVE =====
function isHomeActive() {
  return document.getElementById('screenHome')?.classList.contains('active');
}

// ===== BLINK SYSTEM =====
let _blinkTimer = null;
export function startBlinking() {
  function doBlink() {
    const eyeL = document.getElementById('eyeL');
    const eyeR = document.getElementById('eyeR');
    if (!eyeL || !eyeR) return;

    const tod = getToD();
    const sleepy = (tod === 'night' || tod === 'evening');

    eyeL.setAttribute('ry', '0.5');
    eyeR.setAttribute('ry', '0.5');
    setTimeout(() => {
      eyeL.setAttribute('ry', sleepy ? '3.2' : '4.5');
      eyeR.setAttribute('ry', sleepy ? '3.2' : '4.5');
      // Double-blink 25% of the time
      if (Math.random() < 0.25) {
        setTimeout(() => {
          eyeL.setAttribute('ry', '0.5'); eyeR.setAttribute('ry', '0.5');
          setTimeout(() => {
            eyeL.setAttribute('ry', sleepy ? '3.2' : '4.5');
            eyeR.setAttribute('ry', sleepy ? '3.2' : '4.5');
          }, 80);
        }, 150);
      }
      // Drowsy half-blink at night
      if (sleepy && Math.random() < 0.3) {
        setTimeout(() => {
          eyeL.setAttribute('ry', '2'); eyeR.setAttribute('ry', '2');
          setTimeout(() => {
            eyeL.setAttribute('ry', '3.2'); eyeR.setAttribute('ry', '3.2');
          }, 800);
        }, 2000);
      }
    }, 100);

    const interval = (Date.now() - koalaState.lastInteract < 8000)
      ? 1800 + Math.random() * 2000
      : 2800 + Math.random() * 5000;
    _blinkTimer = setTimeout(doBlink, interval);
  }
  _blinkTimer = setTimeout(doBlink, 2000);
}

// ===== EAR TWITCHES =====
let _earTimer = null;
export function startEarTwitches() {
  function twitch() {
    if (koalaState.busy) { _earTimer = setTimeout(twitch, 5000); return; }
    const earL = document.getElementById('earLeft');
    const earR = document.getElementById('earRight');
    if (!earL) return;
    const which = Math.random();
    if (which < 0.5) {
      earL.setAttribute('rx', '13'); earL.setAttribute('ry', '13');
      setTimeout(() => { earL.setAttribute('rx', '15'); earL.setAttribute('ry', '15'); }, 180);
    } else if (which < 0.85) {
      earR.setAttribute('rx', '13'); earR.setAttribute('ry', '13');
      setTimeout(() => { earR.setAttribute('rx', '15'); earR.setAttribute('ry', '15'); }, 200);
    } else {
      earL.setAttribute('rx', '13'); earR.setAttribute('rx', '13');
      setTimeout(() => {
        earL.setAttribute('rx', '15');
        setTimeout(() => earR.setAttribute('rx', '15'), 80);
      }, 160);
    }
    _earTimer = setTimeout(twitch, 4000 + Math.random() * 8000);
  }
  _earTimer = setTimeout(twitch, 5000);
}

// ===== TAIL WAG =====
let _tailTimer = null;
export function startTailWag() {
  function wag() {
    if (koalaState.busy) { _tailTimer = setTimeout(wag, 6000); return; }
    const tail = document.getElementById('koalaTail');
    if (!tail) return;
    [25, 5, 22, 10, 15].forEach((rot, i) => {
      setTimeout(() => tail.setAttribute('transform', `rotate(${rot} 76 88)`), i * 120);
    });
    _tailTimer = setTimeout(wag, 8000 + Math.random() * 12000);
  }
  _tailTimer = setTimeout(wag, 7000);
}

// ===== IDLE ANIMATIONS =====
function idleClass() { return isHurt() ? 'hurt' : 'idle'; }

function doSniff() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const nose = document.getElementById('koalaNose');
  kb.classList.remove('idle', 'hurt'); kb.classList.add('sniffing');
  if (nose) {
    [6.2, 5, 6, 5.2, 5.5].forEach((rx, i) => setTimeout(() => nose.setAttribute('rx', rx), i * 150));
  }
  setTimeout(() => { kb.classList.remove('sniffing'); kb.classList.add(idleClass()); koalaState.busy = false; }, 1200);
}

function doYawn() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb    = document.getElementById('koalaBody');
  const mouth = document.getElementById('koalaMouth');
  const eyeL  = document.getElementById('eyeL');
  const eyeR  = document.getElementById('eyeR');
  kb.classList.remove('idle', 'hurt'); kb.classList.add('yawning');
  if (eyeL) eyeL.setAttribute('ry', '1.5');
  if (eyeR) eyeR.setAttribute('ry', '1.5');
  if (mouth) {
    setTimeout(() => mouth.setAttribute('d', 'M43 49 Q50 56 57 49'), 300);
    setTimeout(() => mouth.setAttribute('d', 'M42 48 Q50 59 58 48'), 600);
    setTimeout(() => mouth.setAttribute('d', 'M43 49 Q50 56 57 49'), 1800);
    setTimeout(() => mouth.setAttribute('d', 'M45 50 Q50 53.5 55 50'), 2400);
  }
  setTimeout(() => {
    if (eyeL) eyeL.setAttribute('ry', '4.5');
    if (eyeR) eyeR.setAttribute('ry', '4.5');
    kb.classList.remove('yawning'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 3000);
}

function doStretch() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const armL = document.getElementById('armL');
  const armR = document.getElementById('armR');
  kb.classList.remove('idle', 'hurt'); kb.classList.add('stretching');
  if (armL) armL.setAttribute('transform', 'rotate(-30 26 72)');
  if (armR) armR.setAttribute('transform', 'rotate(30 74 72)');
  setTimeout(() => {
    if (armL) armL.setAttribute('transform', 'rotate(-10 26 72)');
    if (armR) armR.setAttribute('transform', 'rotate(10 74 72)');
  }, 1800);
  setTimeout(() => { kb.classList.remove('stretching'); kb.classList.add(idleClass()); koalaState.busy = false; }, 2500);
}

function doHeadScratch() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const armR = document.getElementById('armR');
  kb.classList.remove('idle', 'hurt'); kb.classList.add('head-scratch');
  if (armR) armR.setAttribute('transform', 'rotate(-20 74 72)');
  setTimeout(() => {
    if (armR) armR.setAttribute('transform', 'rotate(10 74 72)');
    kb.classList.remove('head-scratch'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 1500);
}

function doLookAround() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const eyeL = document.getElementById('eyeL');
  const eyeR = document.getElementById('eyeR');
  kb.classList.remove('idle', 'hurt'); kb.classList.add('looking-at');
  if (eyeL) { eyeL.setAttribute('cx', '38'); eyeR.setAttribute('cx', '58'); }
  setTimeout(() => {
    if (eyeL) { eyeL.setAttribute('cx', '42'); eyeR.setAttribute('cx', '62'); }
  }, 600);
  setTimeout(() => {
    if (eyeL) { eyeL.setAttribute('cx', '40'); eyeR.setAttribute('cx', '60'); }
    kb.classList.remove('looking-at'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 1500);
}

// ===== THOUGHT BUBBLES =====
export function spawnThought() {
  if (!isHomeActive() || koalaState.busy) return;
  const tod = getToD();
  // Use mood-driven thoughts first, then fall back to time-of-day
  let thoughts = getMoodThoughts();
  if (tod === 'night')              thoughts = thoughts.concat(['Sleepy...','Pretty stars...','Peaceful...','Zzz...']);
  else if (tod === 'evening' || tod === 'golden') thoughts = thoughts.concat(['Beautiful...','Tea time?','Cozy...']);
  else if (tod === 'morning' || tod === 'dawn')   thoughts = thoughts.concat(['Good morning!','Fresh air!','New day!']);
  // When hurt, override with hurt-specific thoughts
  if (isHurt()) thoughts = ['Ouch...','Feeling sore...','Need rest...','Not great...','...hurting...'];

  const text   = thoughts[Math.floor(Math.random() * thoughts.length)];
  const koala  = document.getElementById('koalaSitting');
  if (!koala) return;
  const r  = koala.getBoundingClientRect();
  const tb = document.createElement('div');
  tb.className   = 'thought-bubble';
  tb.textContent = text;
  tb.style.left  = (r.left + r.width / 2 - 30) + 'px';
  tb.style.top   = (r.top - 24) + 'px';
  tb.style.position = 'fixed';
  document.body.appendChild(tb);
  requestAnimationFrame(() => tb.classList.add('show'));
  setTimeout(() => tb.remove(), 3200);
}

function spawnThoughtForItem(text) {
  if (!isHomeActive()) return;
  const koala = document.getElementById('koalaSitting');
  if (!koala) return;
  const r  = koala.getBoundingClientRect();
  const tb = document.createElement('div');
  tb.className   = 'thought-bubble';
  tb.textContent = text;
  tb.style.left  = (r.left + r.width / 2 - 30) + 'px';
  tb.style.top   = (r.top - 24) + 'px';
  tb.style.position = 'fixed';
  document.body.appendChild(tb);
  requestAnimationFrame(() => tb.classList.add('show'));
  setTimeout(() => tb.remove(), 3200);
}

// ===== ACTIVITY SYSTEM =====
let _ballAnimFrame = null;
let _ballY = 95;
let _ballVY = -4.5;

function _startBallAnim() {
  const ball   = document.getElementById('actBallCircle');
  const shadow = document.getElementById('actBallShadow');
  if (!ball) return;
  function tick() {
    _ballY += _ballVY;
    _ballVY += 0.7; // gravity
    if (_ballY >= 95) { _ballY = 95; _ballVY = -5.5; }
    ball.setAttribute('cy', _ballY);
    // shadow shrinks when ball is high
    if (shadow) {
      const dist = 95 - _ballY;
      const scl  = Math.max(0.35, 1 - dist * 0.016);
      shadow.setAttribute('rx', (8 * scl).toFixed(1));
      shadow.setAttribute('opacity', (0.18 * scl).toFixed(2));
    }
    _ballAnimFrame = requestAnimationFrame(tick);
  }
  tick();
}

function _stopBallAnim() {
  if (_ballAnimFrame) { cancelAnimationFrame(_ballAnimFrame); _ballAnimFrame = null; }
  _ballY = 95; _ballVY = -4.5;
  const ball = document.getElementById('actBallCircle');
  if (ball) ball.setAttribute('cy', 95);
  const shadow = document.getElementById('actBallShadow');
  if (shadow) { shadow.setAttribute('rx', '8'); shadow.setAttribute('opacity', '0.18'); }
}

function _showActivityProp(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.opacity = show ? '1' : '0';
}

function doPainting() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const armR = document.getElementById('armR');
  kb.classList.remove('idle','hurt'); kb.classList.add('head-scratch');
  // extend right arm forward toward easel
  if (armR) armR.setAttribute('transform', 'rotate(-40 74 72)');
  _showActivityProp('actPainting', true);
  setTimeout(() => {
    // brush stroke back and forth
    if (armR) armR.setAttribute('transform', 'rotate(-30 74 72)');
    setTimeout(() => { if (armR) armR.setAttribute('transform', 'rotate(-40 74 72)'); }, 600);
    setTimeout(() => { if (armR) armR.setAttribute('transform', 'rotate(-30 74 72)'); }, 1200);
    setTimeout(() => { if (armR) armR.setAttribute('transform', 'rotate(-40 74 72)'); }, 1800);
  }, 400);
  setTimeout(() => {
    _showActivityProp('actPainting', false);
    if (armR) armR.setAttribute('transform', 'rotate(10 74 72)');
    kb.classList.remove('head-scratch'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 4800);
}

function doPlayBall() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const armR = document.getElementById('armR');
  kb.classList.remove('idle','hurt'); kb.classList.add('stretching');
  _showActivityProp('actBall', true);
  _startBallAnim();
  // right arm bops toward the ball on the right side
  let bops = 0;
  const bopInterval = setInterval(() => {
    if (!armR) return;
    const rot = bops % 2 === 0 ? 'rotate(35 74 72)' : 'rotate(15 74 72)';
    armR.setAttribute('transform', rot);
    bops++;
  }, 550);
  setTimeout(() => {
    clearInterval(bopInterval);
    _stopBallAnim();
    _showActivityProp('actBall', false);
    if (armR) armR.setAttribute('transform', 'rotate(10 74 72)');
    kb.classList.remove('stretching'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 4400);
}

function doYoga() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const armL = document.getElementById('armL');
  const armR = document.getElementById('armR');
  const eyeL = document.getElementById('eyeL');
  const eyeR = document.getElementById('eyeR');
  kb.classList.remove('idle','hurt'); kb.classList.add('stretching');
  // arms spread wide — meditation pose
  if (armL) armL.setAttribute('transform', 'rotate(-55 26 72)');
  if (armR) armR.setAttribute('transform', 'rotate(55 74 72)');
  // peaceful half-closed eyes
  if (eyeL) eyeL.setAttribute('ry', '2.5');
  if (eyeR) eyeR.setAttribute('ry', '2.5');
  _showActivityProp('actYoga', true);
  setTimeout(() => {
    _showActivityProp('actYoga', false);
    if (armL) armL.setAttribute('transform', 'rotate(-10 26 72)');
    if (armR) armR.setAttribute('transform', 'rotate(10 74 72)');
    if (eyeL) eyeL.setAttribute('ry', '4.5');
    if (eyeR) eyeR.setAttribute('ry', '4.5');
    kb.classList.remove('stretching'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 4500);
}

function doDance() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const armL = document.getElementById('armL');
  const armR = document.getElementById('armR');
  kb.classList.remove('idle','hurt'); kb.classList.add('stretching');
  _showActivityProp('actDance', true);
  // arms wave alternately
  const beats = [0,350,700,1050,1400,1750,2100,2450];
  beats.forEach((t, i) => {
    setTimeout(() => {
      if (armL) armL.setAttribute('transform', i%2===0 ? 'rotate(-35 26 72)' : 'rotate(-5 26 72)');
      if (armR) armR.setAttribute('transform', i%2===0 ? 'rotate(5 74 72)' : 'rotate(35 74 72)');
    }, t);
  });
  setTimeout(() => {
    _showActivityProp('actDance', false);
    if (armL) armL.setAttribute('transform', 'rotate(-10 26 72)');
    if (armR) armR.setAttribute('transform', 'rotate(10 74 72)');
    kb.classList.remove('stretching'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 3200);
}

function doJournal() {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb   = document.getElementById('koalaBody');
  const armR = document.getElementById('armR');
  const armL = document.getElementById('armL');
  kb.classList.remove('idle','hurt'); kb.classList.add('reading');
  // arms in a writing position
  if (armL) armL.setAttribute('transform', 'rotate(20 26 72)');
  if (armR) armR.setAttribute('transform', 'rotate(-25 74 72)');
  _showActivityProp('actJournal', true);
  // small hand "writing" motion on armR
  let strokes = 0;
  const writeInterval = setInterval(() => {
    if (!armR) return;
    const rot = strokes % 2 === 0 ? 'rotate(-22 74 72)' : 'rotate(-28 74 72)';
    armR.setAttribute('transform', rot);
    strokes++;
  }, 400);
  setTimeout(() => {
    clearInterval(writeInterval);
    _showActivityProp('actJournal', false);
    if (armL) armL.setAttribute('transform', 'rotate(-10 26 72)');
    if (armR) armR.setAttribute('transform', 'rotate(10 74 72)');
    kb.classList.remove('reading'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 5200);
}

// ===== IDLE BEHAVIORS =====
let _idleTimer = null;
export function startIdleBehaviors() {
  function doRandom() {
    const bed = document.getElementById('bedScene');
    if (koalaState.busy || (bed && bed.classList.contains('active'))) {
      _idleTimer = setTimeout(doRandom, 3000 + Math.random() * 4000);
      return;
    }
    const timeSinceInteract = Date.now() - koalaState.lastInteract;
    const r      = Math.random();
    const tod    = getToD();
    const sleepy = (tod === 'night' || tod === 'evening');

    // Activity props — fire very frequently so koala is always doing something
    if (r < 0.10)      doYawn();
    else if (r < 0.16) doStretch();
    else if (r < 0.22) doLookAround();
    else if (r < 0.27) doSniff();
    else if (r < 0.32) doHeadScratch();
    else if (r < 0.44) doPainting();        // painting
    else if (r < 0.55) doPlayBall();        // ball play
    else if (r < 0.65) doYoga();            // yoga/meditation
    else if (r < 0.74) doDance();           // dancing
    else if (r < 0.83) doJournal();         // journaling
    else if (r < 0.88 && state.ownedItems.length > 0) doWalkToItem();
    else if (timeSinceInteract > 15000) spawnThought();
    else if (sleepy) doYawn();

    const base = timeSinceInteract < 10000 ? 3000 : 5000;
    _idleTimer = setTimeout(doRandom, base + Math.random() * 6000);
  }
  _idleTimer = setTimeout(doRandom, 3000);
}

// ===== WALK TO ITEM =====
function doWalkToItem() {
  if (koalaState.busy || state.ownedItems.length === 0) return;
  koalaState.busy = true;

  const posItems = state.ownedItems.filter(id => {
    const item = SHOP_ITEMS.find(x => x.id === id);
    return item && item.pos;
  });
  if (!posItems.length) { koalaState.busy = false; return; }

  const targetId = posItems[Math.floor(Math.random() * posItems.length)];
  const item     = SHOP_ITEMS.find(x => x.id === targetId);
  const koala    = document.getElementById('koalaSitting');
  const kb       = document.getElementById('koalaBody');
  if (!koala || !kb) { koalaState.busy = false; return; }

  let targetLeft = null;
  if (item.pos.left)  targetLeft = parseInt(item.pos.left);
  else if (item.pos.right) targetLeft = 100 - parseInt(item.pos.right) - 10;
  if (targetLeft === null) { koalaState.busy = false; return; }

  kb.classList.remove('idle', 'hurt'); kb.classList.add('walking');
  koala.style.left = targetLeft + '%';
  koalaState.currentPos = targetLeft;
  if (targetLeft < 45) { koala.style.transform = 'translateX(-50%) scaleX(-1)'; koalaState.facingLeft = true; }
  else                 { koala.style.transform = 'translateX(-50%) scaleX(1)';  koalaState.facingLeft = false; }

  setTimeout(() => {
    kb.classList.remove('walking');
    koalaState.isAtItem  = true;
    koalaState.atItemId  = targetId;
    doItemInteraction(targetId, kb);
  }, 900);
}

function doItemInteraction(itemId, kb) {
  const armL = document.getElementById('armL');
  const armR = document.getElementById('armR');

  switch (itemId) {
    case 'shelf':
      kb.classList.add('reading');
      if (armL) armL.setAttribute('transform', 'rotate(15 26 72)');
      setTimeout(() => spawnThoughtForItem('Good book!'), 1200);
      setTimeout(() => finishItemInteraction(kb, armL, armR), 4000);
      return;
    case 'fireplace':
      kb.classList.add('warming');
      if (armL) armL.setAttribute('transform', 'rotate(15 26 72)');
      if (armR) armR.setAttribute('transform', 'rotate(-15 74 72)');
      setTimeout(() => spawnThoughtForItem('So warm...'), 1500);
      setTimeout(() => finishItemInteraction(kb, armL, armR), 4500);
      return;
    case 'cat':
      if (armR) armR.setAttribute('transform', 'rotate(25 74 72)');
      setTimeout(() => spawnThoughtForItem('Soft kitty!'), 1500);
      setTimeout(() => finishItemInteraction(kb, armL, armR), 3500);
      return;
    case 'plant':
    case 'succulent':
    case 'floorplant':
      kb.classList.add('sniffing');
      setTimeout(() => spawnThoughtForItem('Smells nice!'), 800);
      setTimeout(() => { kb.classList.remove('sniffing'); finishItemInteraction(kb, armL, armR); }, 2500);
      return;
    case 'lamp':
    case 'nightlamp':
      kb.classList.add('looking-at');
      setTimeout(() => { kb.classList.remove('looking-at'); finishItemInteraction(kb, armL, armR); }, 2000);
      return;
    case 'sidetable':
      if (armR) armR.setAttribute('transform', 'rotate(-20 74 72)');
      setTimeout(() => spawnThoughtForItem('Mmm, tea!'), 1000);
      setTimeout(() => finishItemInteraction(kb, armL, armR), 3000);
      return;
    case 'frame':
      kb.classList.add('looking-at');
      setTimeout(() => spawnThoughtForItem('Pretty!'), 1200);
      setTimeout(() => { kb.classList.remove('looking-at'); finishItemInteraction(kb, armL, armR); }, 2500);
      return;
    default:
      setTimeout(() => finishItemInteraction(kb, armL, armR), 2000);
  }
}

function finishItemInteraction(kb, armL, armR) {
  const koala = document.getElementById('koalaSitting');
  if (!koala) return;
  kb.className = 'koala-body walking';
  if (armL) armL.setAttribute('transform', 'rotate(-10 26 72)');
  if (armR) armR.setAttribute('transform', 'rotate(10 74 72)');
  koala.style.left = '50%';
  koala.style.transform = 'translateX(-50%) scaleX(1)';
  koalaState.currentPos = 50;
  koalaState.facingLeft = false;
  koalaState.isAtItem   = false;
  koalaState.atItemId   = null;
  setTimeout(() => { kb.className = 'koala-body ' + idleClass(); koalaState.busy = false; }, 900);
}

// ===== TAP INTERACTIONS =====
export function handleKoalaTap(e) {
  if (koalaState.busy) return;
  const koala = document.getElementById('koalaSitting');
  if (!koala) return;
  const rect = koala.getBoundingClientRect();
  const relY = (e.clientY - rect.top) / rect.height;

  koalaState.interactCount++;
  koalaState.lastInteract = Date.now();
  koalaState.idleSince    = Date.now();

  // Petting gives +1 health, small energy, bond, and XP
  state.health = Math.min(100, (state.health || 0) + 1);
  addInteractionEnergy();
  addBond(0.2);
  addXP(2);
  save();

  if (relY < 0.35)      doPetHead(e.clientX, e.clientY);
  else if (relY < 0.7)  doPokeBelly(e.clientX, e.clientY);
  else                  doTickleFeet(e.clientX, e.clientY);
}

function doPetHead(x, y) {
  koalaState.busy = true;
  const kb    = document.getElementById('koalaBody');
  const eyeL  = document.getElementById('eyeL');
  const eyeR  = document.getElementById('eyeR');
  const mouth = document.getElementById('koalaMouth');
  const bl    = document.getElementById('blushL');
  const br    = document.getElementById('blushR');
  kb.classList.remove('idle', 'hurt'); kb.classList.add('petted');

  if (eyeL) { eyeL.setAttribute('ry', '1.2'); eyeL.setAttribute('cy', '38'); }
  if (eyeR) { eyeR.setAttribute('ry', '1.2'); eyeR.setAttribute('cy', '38'); }
  if (mouth) mouth.setAttribute('d', 'M44 49 Q50 55 56 49');
  if (bl) { bl.setAttribute('opacity', '0.75'); bl.setAttribute('rx', '6'); }
  if (br) { br.setAttribute('opacity', '0.75'); br.setAttribute('rx', '6'); }

  for (let i = 0; i < 7; i++) {
    setTimeout(() => spawnHeart(x + (Math.random() - 0.5) * 70, y - 10 - Math.random() * 20), i * 100);
  }

  setTimeout(() => {
    if (eyeL) { eyeL.setAttribute('ry', '4.5'); eyeL.setAttribute('cy', '37'); }
    if (eyeR) { eyeR.setAttribute('ry', '4.5'); eyeR.setAttribute('cy', '37'); }
    if (mouth) mouth.setAttribute('d', 'M45 50 Q50 53.5 55 50');
    if (bl) { bl.setAttribute('opacity', '0.35'); bl.setAttribute('rx', '5'); }
    if (br) { br.setAttribute('opacity', '0.35'); br.setAttribute('rx', '5'); }
    kb.classList.remove('petted'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 1600);
}

function doPokeBelly(x, y) {
  koalaState.busy = true;
  const kb    = document.getElementById('koalaBody');
  const eyeL  = document.getElementById('eyeL');
  const eyeR  = document.getElementById('eyeR');
  const mouth = document.getElementById('koalaMouth');
  const browL = document.getElementById('browL');
  const browR = document.getElementById('browR');
  kb.classList.remove('idle', 'hurt'); kb.classList.add('startled');

  if (eyeL) { eyeL.setAttribute('ry', '5.5'); eyeL.setAttribute('rx', '4.5'); }
  if (eyeR) { eyeR.setAttribute('ry', '5.5'); eyeR.setAttribute('rx', '4.5'); }
  if (mouth) mouth.setAttribute('d', 'M47 50 Q50 55 53 50');
  if (browL) { browL.setAttribute('opacity', '0.6'); browL.setAttribute('y1', '29'); browL.setAttribute('y2', '29.5'); }
  if (browR) { browR.setAttribute('opacity', '0.6'); browR.setAttribute('y1', '29.5'); browR.setAttribute('y2', '29'); }

  // When hurt, say ouch on belly poke too
  if (isHurt()) {
    spawnThoughtForItem('Ouch!');
  }

  setTimeout(() => {
    for (let i = 0; i < 8; i++) setTimeout(() => spawnGiggleLine(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 30), i * 50);
  }, 400);

  setTimeout(() => {
    if (eyeL) { eyeL.setAttribute('ry', '4.5'); eyeL.setAttribute('rx', '3.8'); }
    if (eyeR) { eyeR.setAttribute('ry', '4.5'); eyeR.setAttribute('rx', '3.8'); }
    if (mouth) mouth.setAttribute('d', 'M45 50 Q50 53.5 55 50');
    if (browL) browL.setAttribute('opacity', '0');
    if (browR) browR.setAttribute('opacity', '0');
    kb.classList.remove('startled'); kb.classList.add(idleClass());
    koalaState.busy = false;
  }, 1500);
}

function doTickleFeet(x, y) {
  koalaState.busy = true;
  const kb    = document.getElementById('koalaBody');
  const eyeL  = document.getElementById('eyeL');
  const eyeR  = document.getElementById('eyeR');
  const mouth = document.getElementById('koalaMouth');

  // When hurt, koala says ouch instead of laughing
  if (isHurt()) {
    kb.classList.remove('idle', 'hurt'); kb.classList.add('startled');
    if (eyeL) eyeL.setAttribute('ry', '5.5');
    if (eyeR) eyeR.setAttribute('ry', '5.5');
    if (mouth) mouth.setAttribute('d', 'M47 50 Q50 55 53 50');
    spawnThoughtForItem('Ouch!');
    setTimeout(() => {
      if (eyeL) eyeL.setAttribute('ry', '4.5');
      if (eyeR) eyeR.setAttribute('ry', '4.5');
      if (mouth) mouth.setAttribute('d', 'M45 50 Q50 53.5 55 50');
      kb.classList.remove('startled'); kb.classList.add(isHurt() ? 'hurt' : 'idle');
      koalaState.busy = false;
    }, 1200);
    return;
  }

  kb.classList.remove('idle'); kb.classList.add('wiggle');

  if (eyeL) eyeL.setAttribute('ry', '1');
  if (eyeR) eyeR.setAttribute('ry', '1');
  if (mouth) mouth.setAttribute('d', 'M43 49 Q50 57 57 49');

  for (let i = 0; i < 8; i++) setTimeout(() => spawnGiggleLine(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 30), i * 70);
  setTimeout(() => {
    for (let j = 0; j < 5; j++) setTimeout(() => spawnGiggleLine(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 20), j * 80);
  }, 600);

  setTimeout(() => {
    if (eyeL) eyeL.setAttribute('ry', '4.5');
    if (eyeR) eyeR.setAttribute('ry', '4.5');
    if (mouth) mouth.setAttribute('d', 'M45 50 Q50 53.5 55 50');
    kb.classList.remove('wiggle'); kb.classList.add(isHurt() ? 'hurt' : 'idle');
    koalaState.busy = false;
  }, 1800);
}

// ===== PARTICLE SPAWNERS =====
export function spawnEmotionBubble(emoji) {
  if (!isHomeActive()) return;
  const koala = document.getElementById('koalaSitting');
  if (!koala) return;
  const r  = koala.getBoundingClientRect();
  const eb = document.createElement('div');
  eb.className   = 'emotion-bubble';
  eb.innerHTML = emoji;
  eb.style.fontSize = '22px';
  eb.style.left  = (r.left + r.width / 2 - 14) + 'px';
  eb.style.top   = (r.top - 16) + 'px';
  document.body.appendChild(eb);
  requestAnimationFrame(() => eb.classList.add('pop'));
  setTimeout(() => eb.remove(), 2200);
}

export function spawnHeart(x, y) {
  if (!isHomeActive()) return;
  const h = document.createElement('div');
  h.className   = 'heart-particle';
  h.innerHTML = emojiSVG('heart',22);
  h.style.left  = x + 'px';
  h.style.top   = y + 'px';
  h.style.setProperty('--hx', (Math.random() - 0.5) * 60 + 'px');
  h.style.setProperty('--hy', (-30 - Math.random() * 40) + 'px');
  document.body.appendChild(h);
  requestAnimationFrame(() => h.classList.add('float'));
  setTimeout(() => h.remove(), 1600);
}

export function spawnGiggleLine(x, y) {
  if (!isHomeActive()) return;
  const g = document.createElement('div');
  g.className = 'giggle-line';
  g.style.left = x + 'px';
  g.style.top  = y + 'px';
  g.style.setProperty('--gx', (Math.random() - 0.5) * 50 + 'px');
  g.style.setProperty('--gy', (Math.random() - 0.5) * 30 + 'px');
  g.style.background = ['#FFD700','#FF9800','#FFC107','#8BC34A'][Math.floor(Math.random() * 4)];
  document.body.appendChild(g);
  requestAnimationFrame(() => g.classList.add('burst'));
  setTimeout(() => g.remove(), 700);
}

// ===== KOALA REACTIONS (shop buy / celebrate) =====
export function koalaReact(type) {
  if (koalaState.busy) return;
  koalaState.busy = true;
  const kb = document.getElementById('koalaBody');
  if (!kb) return;
  kb.classList.remove('idle', 'hurt', 'celebrate', 'react-look');
  void kb.offsetWidth; // force reflow
  kb.classList.add('react-look');
  // Show a thought bubble instead of emoji
  const thoughts = { plant:'Nice plant!', succulent:'Cute!', lamp:'Bright!', frame:'Pretty!', shelf:'Books!', cat:'Kitty!', fireplace:'Warm!', floorplant:'Leafy!', curtains:'Cozy!', weather:'Weather!', nightlamp:'Glowy!', sidetable:'Tea time!', rug:'Comfy!' };
  spawnThoughtForItem(thoughts[type] || 'Nice!');
  setTimeout(() => { kb.classList.remove('react-look'); kb.classList.add(idleClass()); koalaState.busy = false; }, 1200);
}

export function celebrate(onComplete) {
  if (koalaState.busy) { if (onComplete) onComplete(); return; }
  koalaState.busy = true;
  const kb = document.getElementById('koalaBody');
  if (!kb) { koalaState.busy = false; if (onComplete) onComplete(); return; }
  kb.classList.remove('idle', 'hurt'); kb.classList.add('celebrate');
  setTimeout(() => {
    kb.classList.remove('celebrate'); kb.classList.add(idleClass());
    koalaState.busy = false;
    if (onComplete) onComplete();
  }, 4200);
}

// ===== SLEEP STATE =====
export function showSleepState(sleeping) {
  const sit = document.getElementById('koalaSitting');
  const bed = document.getElementById('bedScene');
  if (sleeping) {
    if (sit) { sit.style.opacity = '0'; sit.style.pointerEvents = 'none'; }
    if (bed)  bed.classList.add('active');
  } else {
    if (sit) { sit.style.opacity = '1'; sit.style.pointerEvents = 'auto'; }
    if (bed)  bed.classList.remove('active');
  }
  renderDecor();
}

// ===== DECOR RENDER =====
export function renderDecor() {
  const l = document.getElementById('decorLayer');
  if (!l) return;
  l.innerHTML = '';

  const sleeping = document.getElementById('bedScene')?.classList.contains('active');

  // Rug — only in living room
  if (state.ownedItems.includes('rug') && (state.currentRoom || 'living') === 'living') {
    const r = document.createElement('div');
    r.className = 'rug-wrap ' + (sleeping ? 'under-bed' : 'under-koala');
    r.innerHTML = '<div class="rug-shadow"></div>' + itemSVG('rug');
    setTimeout(() => r.classList.add('visible'), 100);
    l.appendChild(r);
  }

  // Curtains
  const cl = document.getElementById('curtainLeft');
  const cr = document.getElementById('curtainRight');
  if (cl && cr) {
    cl.classList.toggle('visible', state.ownedItems.includes('curtains'));
    cr.classList.toggle('visible', state.ownedItems.includes('curtains'));
  }

  // Fireplace glow
  if (state.ownedItems.includes('fireplace')) {
    document.getElementById('fireplaceGlow')?.classList.add('on');
  }

  // Lamp glow — only in living room
  const tod = getToD();
  const _currentRoom = state.currentRoom || 'living';
  const nightLampOn = _currentRoom === 'living' && state.ownedItems.includes('lamp') && (tod === 'night' || tod === 'evening');
  document.getElementById('lampGlow')?.classList.toggle('on', nightLampOn);

  // Room items — filter by current room, sort by z so background items render before foreground
  const currentRoom = state.currentRoom || 'living';
  // If premium fireplace is owned, it replaces the regular fireplace
  const hasPremiumFireplace = state.ownedItems.includes('premium_fireplace_deluxe');
  const ownedRoomItems = state.ownedItems
    .filter(id => id !== 'rug' && id !== 'curtains' && id !== 'weather')
    .filter(id => !(id === 'fireplace' && hasPremiumFireplace)) // premium fireplace takes dominion
    .map(id => SHOP_ITEMS.find(x => x.id === id))
    .filter(item => item && item.pos && (item.room || 'living') === currentRoom)
    .sort((a, b) => (a.pos.z ?? 1) - (b.pos.z ?? 1));

  ownedRoomItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'room-item';
    el.style.zIndex = item.pos.z ?? 1;
    el.innerHTML = '<div class="item-shadow"></div>' + itemSVG(item.icon, item.pos.w || 40, item.pos.h || 40);
    el.style.bottom = item.pos.bottom;
    if (item.pos.left)  el.style.left  = item.pos.left;
    if (item.pos.right) el.style.right = item.pos.right;
    setTimeout(() => el.classList.add('visible'), 150);
    l.appendChild(el);
  });
}

// ===== MULTI-ROOM SYSTEM =====
const _ROOM_LIST  = ['living', 'kitchen', 'bedroom'];
const _ROOM_NAMES = { living: 'Living Room', kitchen: 'Kitchen', bedroom: 'Bedroom' };

export function switchRoomDir(dir) {
  const curr = state.currentRoom || 'living';
  const idx  = (_ROOM_LIST.indexOf(curr) + dir + _ROOM_LIST.length) % _ROOM_LIST.length;
  state.currentRoom = _ROOM_LIST[idx];
  save();

  const container = document.getElementById('roomContainer');
  if (container) container.dataset.room = state.currentRoom;

  const nameEl = document.getElementById('roomNavName');
  if (nameEl) nameEl.textContent = _ROOM_NAMES[state.currentRoom] || 'Living Room';

  // Show / hide room overlays
  document.getElementById('kitchenScene')?.classList.toggle('active', state.currentRoom === 'kitchen');
  document.getElementById('bedroomScene')?.classList.toggle('active', state.currentRoom === 'bedroom');

  renderDecor();
  _renderBedroomItems();
}

function _renderBedroomItems() {
  const layer = document.getElementById('bedroomDecorLayer');
  if (!layer) return;
  layer.innerHTML = '';
  if ((state.currentRoom || 'living') !== 'bedroom') return;

  const bedroomItems = state.ownedItems
    .map(id => SHOP_ITEMS.find(x => x.id === id))
    .filter(item => item && item.pos && item.room === 'bedroom')
    .sort((a, b) => (a.pos.z ?? 1) - (b.pos.z ?? 1));

  bedroomItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'room-item visible';
    el.style.zIndex = item.pos.z ?? 8;
    el.innerHTML = itemSVG(item.icon, item.pos.w || 40, item.pos.h || 40);
    el.style.bottom = item.pos.bottom;
    if (item.pos.left)  el.style.left  = item.pos.left;
    if (item.pos.right) el.style.right = item.pos.right;
    layer.appendChild(el);
  });

  // Lamp glow in bedroom
  const bedroomLampOn = state.ownedItems.some(id => ['nightlamp', 'premium_crystal_lamp'].includes(id));
  const bedroomGlow   = document.getElementById('bedroomLampGlow');
  if (bedroomGlow) bedroomGlow.classList.toggle('on', bedroomLampOn);
}

// ===== ANIMAL SKIN SYSTEM =====
// Each palette maps original koala hex colors → replacement colors
// Original fills: #A0A0A0(body/head), #A4A4A4(head sheen), #8E8E8E(ears/arms/legs),
//                 #EAE2DA(muzzle), #DCD4CC(belly), #C9A882(ear inner/toes),
//                 #3D3229(eyes), #5C4A3A(nose), #F0B8B8(blush), #969696(tail)
const ANIMAL_PALETTES = {
  koala: null,
  bear:  { '#A0A0A0':'#7B5B3A','#A4A4A4':'#8A6645','#8E8E8E':'#6B4B2A','#EAE2DA':'#D4B896','#DCD4CC':'#C8A880','#C9A882':'#C9A882','#3D3229':'#1A0800','#5C4A3A':'#3A1A00','#F0B8B8':'#F0C0A0','#969696':'#7B5B3A' },
  bunny: { '#A0A0A0':'#E0E0E0','#A4A4A4':'#EBEBEB','#8E8E8E':'#D0D0D0','#EAE2DA':'#F8F8F8','#DCD4CC':'#F2F2F2','#C9A882':'#F8B8C8','#3D3229':'#4A1A4A','#5C4A3A':'#D05070','#F0B8B8':'#F8C0D0','#969696':'#E0E0E0' },
  dog:   { '#A0A0A0':'#C8A06A','#A4A4A4':'#D4AC78','#8E8E8E':'#B8904A','#EAE2DA':'#F0E0C0','#DCD4CC':'#E8D4A8','#C9A882':'#E8C090','#3D3229':'#2A1800','#5C4A3A':'#1A0A00','#F0B8B8':'#F0C8A8','#969696':'#C8A06A' },
};

// CSS filter skins — work on any animal (applied on top of animal palette)
const SKIN_FILTERS = {
  default:  '',
  golden:   'sepia(1) hue-rotate(5deg) saturate(4) brightness(1.12)',
  midnight: 'sepia(1) hue-rotate(220deg) saturate(2.5) brightness(0.48)',
  sakura:   'sepia(1) hue-rotate(310deg) saturate(4) brightness(1.1)',
};

export function getCurrentSkinFilter() {
  const skin = (state.settings && state.settings.koalaSkin) || 'default';
  return SKIN_FILTERS[skin] || '';
}

export const ANIMAL_FOOD = {
  koala: 'Eucalyptus Leaves',
  bear:  'Honey Jars',
  bunny: 'Carrots',
  dog:   'Dog Treats',
};

export const ANIMAL_NAMES = {
  koala: 'Koala', bear: 'Bear', bunny: 'Bunny', dog: 'Dog',
};

// Store original fills on first call
let _originalFills = null;
function _cacheOriginalFills(svg) {
  if (_originalFills) return;
  _originalFills = [];
  svg.querySelectorAll('[fill]').forEach(el => {
    _originalFills.push({ el, fill: el.getAttribute('fill') });
  });
}

export function applyAnimalSkin() {
  const animal = state.selectedAnimal || 'koala';
  const svg    = document.getElementById('koalaSvg');
  if (!svg) return;
  _cacheOriginalFills(svg);

  // Step 1: apply animal body palette (shape/color of the animal)
  const palette = ANIMAL_PALETTES[animal] || null;
  _originalFills.forEach(({ el, fill }) => {
    const newFill = palette ? (palette[fill] || fill) : fill;
    el.setAttribute('fill', newFill);
  });
  svg.setAttribute('data-animal', animal);

  // Step 2: apply skin CSS filter on top (works for ANY animal)
  svg.style.filter = getCurrentSkinFilter();
}

// Animal food for feed overlay / shop
function _getAnimalFoodIcon(animal) {
  const icons = {
    koala: `<svg viewBox="0 0 44 48" width="22" height="22" fill="none"><ellipse cx="22" cy="28" rx="15" ry="19" fill="#4CAF50" transform="rotate(-15 22 28)"/><path d="M22 46 Q18 34 13 20" stroke="#2E7D32" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    bear:  `<svg viewBox="0 0 32 32" width="22" height="22" fill="none"><ellipse cx="16" cy="18" rx="10" ry="12" fill="#F9A825"/><ellipse cx="16" cy="17" rx="7" ry="9" fill="#FFC107" opacity=".7"/><ellipse cx="16" cy="12" rx="5" ry="3" fill="#E65100" opacity=".8"/><path d="M10 22 Q16 26 22 22" stroke="#E65100" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
    bunny: `<svg viewBox="0 0 32 32" width="22" height="22" fill="none"><ellipse cx="16" cy="20" rx="6" ry="10" fill="#FF7043"/><ellipse cx="16" cy="14" rx="4" ry="6" fill="#FFA726" opacity=".8"/><ellipse cx="11" cy="10" rx="3" ry="5" fill="#4CAF50" transform="rotate(-15 11 10)"/><ellipse cx="21" cy="10" rx="3" ry="5" fill="#4CAF50" transform="rotate(15 21 10)"/></svg>`,
    dog:   `<svg viewBox="0 0 36 24" width="28" height="18" fill="none"><rect x="2" y="8" width="32" height="8" rx="4" fill="#D4A574"/><rect x="2" y="8" width="32" height="8" rx="4" fill="none" stroke="#A07040" stroke-width="1.5"/><ellipse cx="4" cy="12" rx="3" ry="5" fill="#D4A574" stroke="#A07040" stroke-width="1.5"/><ellipse cx="32" cy="12" rx="3" ry="5" fill="#D4A574" stroke="#A07040" stroke-width="1.5"/></svg>`,
  };
  return icons[animal] || icons.koala;
}

function _showAnimalConfirmModal(id, onConfirm) {
  const name = ANIMAL_NAMES[id] || id;
  const food = ANIMAL_FOOD[id] || 'food';
  document.getElementById('animalConfirmModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'animalConfirmModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:50000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:24px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:28px 24px;max-width:300px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.3)">
      <div style="margin-bottom:14px">${_getAnimalFoodIcon(id)}</div>
      <div style="font-size:20px;font-weight:800;color:#3D3229;margin-bottom:8px">Switch to ${name}?</div>
      <div style="font-size:14px;color:#8B7E74;line-height:1.5;margin-bottom:20px">Your companion will become a ${name.toLowerCase()}! You'll feed it <strong>${food}</strong> and the whole interface will adapt.</div>
      <div style="display:flex;gap:10px">
        <button id="_animalCancelBtn" style="flex:1;padding:13px;border-radius:14px;background:#F0EDE8;color:#8B7E74;font-weight:700;font-size:15px;font-family:inherit;border:none;cursor:pointer">Cancel</button>
        <button id="_animalConfirmBtn" style="flex:1;padding:13px;border-radius:14px;background:linear-gradient(135deg,#7CB97A,#5A9A58);color:#fff;font-weight:800;font-size:15px;font-family:inherit;border:none;cursor:pointer">Switch!</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('_animalCancelBtn').onclick  = () => modal.remove();
  document.getElementById('_animalConfirmBtn').onclick = () => { modal.remove(); onConfirm(); };
}

export function setSelectedAnimal(id) {
  const current = state.selectedAnimal || 'koala';
  if (id === current) return;

  _showAnimalConfirmModal(id, () => {
    state.selectedAnimal = id;
    save();
    applyAnimalSkin();
    document.querySelectorAll('.animal-selector-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.animal === id);
    });
    // Notify app of animal change (food labels, splash, etc.)
    if (typeof window._onAnimalChanged === 'function') window._onAnimalChanged(id);
  });
}

// ===== INIT TOUCH/CLICK EVENTS =====
export function initKoalaEvents() {
  const koala = document.getElementById('koalaSitting');
  if (!koala) return;
  koala.addEventListener('click', handleKoalaTap);
  koala.addEventListener('touchend', e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    handleKoalaTap({ clientX: touch.clientX, clientY: touch.clientY });
  });
}
