// ===== SPLASH SCREEN SYSTEM =====
import { state } from './state.js';
import { getCurrentSkinFilter } from './koalaSystem.js';

// Animal-specific splash SVGs (same viewBox as the koala splash)
const SPLASH_SVGS = {
  koala: null, // use default HTML
  bear: `<svg viewBox="0 0 100 110" fill="none" width="180" height="198" aria-hidden="true">
    <!-- Tail -->
    <ellipse cx="76" cy="88" rx="7" ry="5" fill="#6B4B2A" transform="rotate(15 76 88)"/>
    <!-- Ears -->
    <ellipse cx="17" cy="21" rx="15" ry="15" fill="#6B4B2A"/>
    <ellipse cx="17" cy="21" rx="9"  ry="9"  fill="#C9A882"/>
    <ellipse cx="83" cy="21" rx="15" ry="15" fill="#6B4B2A"/>
    <ellipse cx="83" cy="21" rx="9"  ry="9"  fill="#C9A882"/>
    <!-- Head -->
    <ellipse cx="50" cy="38" rx="28" ry="25" fill="#7B5B3A"/>
    <ellipse cx="50" cy="43" rx="18" ry="14" fill="#D4B896"/>
    <!-- Eyes -->
    <ellipse cx="40" cy="37" rx="3.8" ry="4.5" fill="#1A0800"/>
    <circle cx="38.5" cy="35.5" r="1.4" fill="#fff" opacity=".9"/>
    <ellipse id="sEyeR" cx="60" cy="37" rx="3.8" ry="4.5" fill="#1A0800" style="transform-box:fill-box;transform-origin:center"/>
    <circle id="sEyeShineR" cx="58.5" cy="35.5" r="1.4" fill="#fff" opacity=".9"/>
    <!-- Nose -->
    <ellipse cx="50" cy="46" rx="5.5" ry="3.8" fill="#3A1A00"/>
    <path d="M45 50 Q50 53.5 55 50" stroke="#3A1A00" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <!-- Blush -->
    <ellipse cx="34" cy="46" rx="5" ry="2.5" fill="#F0C0A0" opacity=".5"/>
    <ellipse cx="66" cy="46" rx="5" ry="2.5" fill="#F0C0A0" opacity=".5"/>
    <!-- Body -->
    <ellipse cx="50" cy="76" rx="24" ry="22" fill="#7B5B3A"/>
    <ellipse cx="50" cy="79" rx="16" ry="15" fill="#C8A880"/>
    <!-- Arms -->
    <ellipse cx="26" cy="72" rx="8" ry="11" fill="#6B4B2A" transform="rotate(-10 26 72)"/>
    <ellipse cx="74" cy="72" rx="8" ry="11" fill="#6B4B2A" transform="rotate(10 74 72)"/>
    <!-- Legs -->
    <ellipse cx="38" cy="96" rx="10" ry="6.5" fill="#6B4B2A"/>
    <ellipse cx="62" cy="96" rx="10" ry="6.5" fill="#6B4B2A"/>
  </svg>`,
  bunny: `<svg viewBox="0 0 100 120" fill="none" width="180" height="216" aria-hidden="true">
    <!-- Tall ears -->
    <ellipse cx="33" cy="18" rx="9" ry="22" fill="#D0D0D0"/>
    <ellipse cx="33" cy="18" rx="5" ry="17" fill="#F8B8C8"/>
    <ellipse cx="67" cy="18" rx="9" ry="22" fill="#D0D0D0"/>
    <ellipse cx="67" cy="18" rx="5" ry="17" fill="#F8B8C8"/>
    <!-- Head -->
    <ellipse cx="50" cy="48" rx="26" ry="23" fill="#E0E0E0"/>
    <ellipse cx="50" cy="53" rx="17" ry="13" fill="#F8F8F8"/>
    <!-- Eyes -->
    <ellipse cx="40" cy="44" rx="3.5" ry="4.2" fill="#4A1A4A"/>
    <circle cx="38.5" cy="42.5" r="1.3" fill="#fff" opacity=".9"/>
    <ellipse id="sEyeR" cx="60" cy="44" rx="3.5" ry="4.2" fill="#4A1A4A" style="transform-box:fill-box;transform-origin:center"/>
    <circle id="sEyeShineR" cx="58.5" cy="42.5" r="1.3" fill="#fff" opacity=".9"/>
    <!-- Nose -->
    <ellipse cx="50" cy="54" rx="4.5" ry="3" fill="#D05070"/>
    <path d="M46 57 Q50 60 54 57" stroke="#D05070" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <!-- Blush -->
    <ellipse cx="34" cy="53" rx="5" ry="2.5" fill="#F8C0D0" opacity=".5"/>
    <ellipse cx="66" cy="53" rx="5" ry="2.5" fill="#F8C0D0" opacity=".5"/>
    <!-- Body -->
    <ellipse cx="50" cy="85" rx="24" ry="24" fill="#E0E0E0"/>
    <ellipse cx="50" cy="88" rx="16" ry="16" fill="#F2F2F2"/>
    <!-- Arms -->
    <ellipse cx="26" cy="80" rx="7" ry="11" fill="#D0D0D0" transform="rotate(-10 26 80)"/>
    <ellipse cx="74" cy="80" rx="7" ry="11" fill="#D0D0D0" transform="rotate(10 74 80)"/>
    <!-- Feet -->
    <ellipse cx="36" cy="106" rx="13" ry="6" fill="#D0D0D0"/>
    <ellipse cx="64" cy="106" rx="13" ry="6" fill="#D0D0D0"/>
    <!-- Tail -->
    <ellipse cx="76" cy="90" rx="7" ry="7" fill="#F8F8F8"/>
  </svg>`,
  dog: `<svg viewBox="0 0 100 110" fill="none" width="180" height="198" aria-hidden="true">
    <!-- Floppy ears -->
    <ellipse cx="16" cy="30" rx="11" ry="18" fill="#B8904A" transform="rotate(-15 16 30)"/>
    <ellipse cx="84" cy="30" rx="11" ry="18" fill="#B8904A" transform="rotate(15 84 30)"/>
    <!-- Head -->
    <ellipse cx="50" cy="38" rx="28" ry="25" fill="#C8A06A"/>
    <ellipse cx="50" cy="45" rx="20" ry="15" fill="#F0E0C0"/>
    <!-- Eyes -->
    <ellipse cx="40" cy="35" rx="3.8" ry="4.5" fill="#2A1800"/>
    <circle cx="38.5" cy="33.5" r="1.4" fill="#fff" opacity=".9"/>
    <ellipse id="sEyeR" cx="60" cy="35" rx="3.8" ry="4.5" fill="#2A1800" style="transform-box:fill-box;transform-origin:center"/>
    <circle id="sEyeShineR" cx="58.5" cy="33.5" r="1.4" fill="#fff" opacity=".9"/>
    <!-- Nose -->
    <ellipse cx="50" cy="47" rx="6" ry="4.5" fill="#1A0A00"/>
    <path d="M44 52 Q50 56 56 52" stroke="#1A0A00" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- Blush -->
    <ellipse cx="33" cy="47" rx="5" ry="2.5" fill="#F0C8A8" opacity=".5"/>
    <ellipse cx="67" cy="47" rx="5" ry="2.5" fill="#F0C8A8" opacity=".5"/>
    <!-- Tail -->
    <ellipse cx="78" cy="82" rx="6" ry="9" fill="#B8904A" transform="rotate(30 78 82)"/>
    <!-- Body -->
    <ellipse cx="50" cy="76" rx="24" ry="22" fill="#C8A06A"/>
    <ellipse cx="50" cy="79" rx="16" ry="15" fill="#E8D4A8"/>
    <!-- Arms/legs -->
    <ellipse cx="26" cy="72" rx="8" ry="11" fill="#B8904A" transform="rotate(-10 26 72)"/>
    <ellipse cx="74" cy="72" rx="8" ry="11" fill="#B8904A" transform="rotate(10 74 72)"/>
    <ellipse cx="38" cy="96" rx="10" ry="6.5" fill="#B8904A"/>
    <ellipse cx="62" cy="96" rx="10" ry="6.5" fill="#B8904A"/>
  </svg>`,
};

const SPLASH_GREETINGS = {
  koala: 'Hey, my friend!',
  bear:  'Ready to focus?',
  bunny: 'Let\'s do this!',
  dog:   'Woof! Let\'s go!',
};

export function runSplash() {
  return new Promise(resolve => {
    const splash = document.getElementById('splashScreen');
    if (!splash) { resolve(); return; }

    // Swap animal SVG if not koala
    const animal = (state && state.selectedAnimal) || 'koala';
    if (animal !== 'koala' && SPLASH_SVGS[animal]) {
      const kw0 = splash.querySelector('.splash-koala-wrap');
      if (kw0) {
        const existingSvg = kw0.querySelector('svg');
        if (existingSvg) {
          const tmp = document.createElement('div');
          tmp.innerHTML = SPLASH_SVGS[animal];
          const newSvg = tmp.querySelector('svg');
          if (newSvg) kw0.replaceChild(newSvg, existingSvg);
        }
      }
    }
    // Update greeting
    const bub0 = splash.querySelector('.splash-bubble');
    if (bub0) bub0.textContent = SPLASH_GREETINGS[animal] || SPLASH_GREETINGS.koala;

    // Apply skin filter to splash SVG
    const splashSvg = splash.querySelector('.splash-koala-wrap svg');
    if (splashSvg) splashSvg.style.filter = getCurrentSkinFilter();

    splash.style.display = 'flex';
    const bg  = splash.querySelector('.splash-bg');
    const kw  = splash.querySelector('.splash-koala-wrap');
    const bub = splash.querySelector('.splash-bubble');

    // Fade in the whole screen
    requestAnimationFrame(() => {
      splash.classList.add('splash-in');
      // Koala bounces in 120ms after bg
      setTimeout(() => {
        if (kw) { kw.classList.add('koala-enter'); }
      }, 120);
    });

    // After entrance finishes, start floating loop
    setTimeout(() => {
      if (kw) {
        kw.classList.remove('koala-enter');
        kw.classList.add('koala-float');
        kw.style.opacity = '1';
      }
    }, 980);

    // Bubble floats in
    setTimeout(() => {
      if (bub) { void bub.offsetHeight; bub.classList.add('show'); }
    }, 1100);

    // Wink
    setTimeout(() => {
      const eye    = splash.querySelector('#sEyeR');
      const shineR = splash.querySelector('#sEyeShineR');
      if (eye) {
        eye.animate([
          { transform: 'scaleY(1)' },
          { transform: 'scaleY(0.05)' },
          { transform: 'scaleY(1)' }
        ], { duration: 380, easing: 'ease-in-out' });
        if (shineR) shineR.animate([{opacity:1},{opacity:0},{opacity:1}], {duration:380});
      }
    }, 2100);

    // Bubble fades out
    setTimeout(() => { if (bub) bub.classList.remove('show'); }, 2900);

    // Transition out: bg funnels, koala exits
    setTimeout(() => {
      if (bg)  bg.classList.add('funnel-out');
    }, 3300);
    setTimeout(() => {
      if (kw) {
        kw.classList.remove('koala-float');
        kw.classList.add('koala-exit');
      }
      if (bub) { bub.style.opacity = '0'; bub.style.transition = 'none'; }
    }, 3650);

    // Done — remove splash
    setTimeout(() => {
      splash.style.display = 'none';
      splash.classList.remove('splash-in');
      if (bg)  bg.classList.remove('funnel-out');
      if (kw)  { kw.classList.remove('koala-exit','koala-float','koala-enter'); kw.style.opacity = '1'; }
      resolve();
    }, 4700);
  });
}
