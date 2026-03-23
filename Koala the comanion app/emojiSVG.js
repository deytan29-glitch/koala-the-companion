// Inline SVG emoji replacements for WKWebView compatibility
// WKWebView file:// doesn't render Unicode emoji, so we use SVG

export function emojiSVG(name, size = 20) {
  const s = EMOJI_PATHS[name];
  if (!s) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="${size}" height="${size}" style="vertical-align:middle;display:inline-block">${s}</svg>`;
}

const EMOJI_PATHS = {

  // 🔥 Fire - orange/yellow flame
  fire: `
    <path fill="#F4900C" d="M18 2c0 0-8 9-8 18a8 8 0 0 0 16 0C26 11 18 2 18 2z"/>
    <path fill="#FFCC4D" d="M18 8c0 0-5 6-5 13a5 5 0 0 0 10 0C23 14 18 8 18 8z"/>
    <path fill="#FFAC33" d="M18 14c0 0-3 4-3 8a3 3 0 0 0 6 0C21 18 18 14 18 14z"/>
  `,

  // 😊 Happy face with smile and blush
  happy: `
    <circle fill="#FFCC4D" cx="18" cy="18" r="16"/>
    <circle fill="#664500" cx="12" cy="14" r="2"/>
    <circle fill="#664500" cx="24" cy="14" r="2"/>
    <path fill="none" stroke="#664500" stroke-width="2" stroke-linecap="round" d="M10 20q8 8 16 0"/>
    <circle fill="#FF7A94" cx="8" cy="19" r="3" opacity="0.5"/>
    <circle fill="#FF7A94" cx="28" cy="19" r="3" opacity="0.5"/>
  `,

  // 😴 Tired/sleeping face with Zzz
  tired: `
    <circle fill="#FFCC4D" cx="18" cy="18" r="16"/>
    <path fill="none" stroke="#664500" stroke-width="2" stroke-linecap="round" d="M8 15q4 3 8 0"/>
    <path fill="none" stroke="#664500" stroke-width="2" stroke-linecap="round" d="M20 15q4 3 8 0"/>
    <path fill="none" stroke="#664500" stroke-width="2" stroke-linecap="round" d="M12 24q6 4 12 0"/>
    <text fill="#3B88C3" font-size="7" font-weight="bold" x="27" y="8">Z</text>
    <text fill="#3B88C3" font-size="9" font-weight="bold" x="30" y="4">Z</text>
  `,

  // 😐 Bored/neutral face
  bored: `
    <circle fill="#FFCC4D" cx="18" cy="18" r="16"/>
    <circle fill="#664500" cx="12" cy="14" r="2"/>
    <circle fill="#664500" cx="24" cy="14" r="2"/>
    <line x1="11" y1="23" x2="25" y2="23" stroke="#664500" stroke-width="2" stroke-linecap="round"/>
  `,

  // 😢 Sad/crying face with tear
  sad: `
    <circle fill="#FFCC4D" cx="18" cy="18" r="16"/>
    <circle fill="#664500" cx="12" cy="14" r="2"/>
    <circle fill="#664500" cx="24" cy="14" r="2"/>
    <path fill="none" stroke="#664500" stroke-width="2" stroke-linecap="round" d="M11 25q7-5 14 0"/>
    <path fill="#5DADEC" d="M25 16c0 0-2 4-2 6a2 2 0 0 0 4 0C27 20 25 16 25 16z"/>
  `,

  // 🌟 Proud/glowing star
  proud: `
    <polygon fill="#FFAC33" points="18,2 22,13 34,13 24,21 28,33 18,25 8,33 12,21 2,13 14,13"/>
    <polygon fill="#FFCC4D" points="18,7 21,14 28,14 22,20 25,28 18,23 11,28 14,20 8,14 15,14"/>
    <circle fill="#FFF176" cx="18" cy="17" r="4" opacity="0.6"/>
  `,

  // ⭐ Star - gold star for milestones
  star: `
    <polygon fill="#FFAC33" points="18,2 22,13 34,13 24,21 28,33 18,25 8,33 12,21 2,13 14,13"/>
    <polygon fill="#FFCC4D" points="18,8 21,15 28,15 23,20 25,28 18,23 11,28 13,20 8,15 15,15"/>
  `,

  // 💫 Sparkle/dizzy
  sparkle: `
    <polygon fill="#FFCC4D" points="18,1 20,14 33,12 22,19 28,32 18,23 8,32 14,19 3,12 16,14"/>
    <circle fill="#FFAC33" cx="18" cy="18" r="4"/>
    <circle fill="#FFF176" cx="18" cy="18" r="2"/>
    <circle fill="#FFCC4D" cx="8" cy="6" r="2"/>
    <circle fill="#FFCC4D" cx="30" cy="8" r="1.5"/>
  `,

  // 🏆 Trophy - gold trophy
  trophy: `
    <path fill="#FFAC33" d="M10 4h16v4q0 10-8 14-8-4-8-14z"/>
    <path fill="#FFCC4D" d="M12 4h12v3q0 8-6 12-6-4-6-12z"/>
    <rect fill="#C1694F" x="15" y="22" width="6" height="4" rx="1"/>
    <rect fill="#A0522D" x="12" y="26" width="12" height="4" rx="2"/>
    <path fill="#FFAC33" d="M10 4q-6 0-6 6t6 6v-2q-4 0-4-4t4-4z"/>
    <path fill="#FFAC33" d="M26 4q6 0 6 6t-6 6v-2q4 0 4-4t-4-4z"/>
  `,

  // 🐾 Paw prints
  paw: `
    <ellipse fill="#C1694F" cx="18" cy="22" rx="6" ry="5"/>
    <circle fill="#C1694F" cx="10" cy="14" r="3"/>
    <circle fill="#C1694F" cx="18" cy="11" r="3"/>
    <circle fill="#C1694F" cx="26" cy="14" r="3"/>
    <circle fill="#C1694F" cx="7" cy="21" r="2.5"/>
    <circle fill="#C1694F" cx="29" cy="21" r="2.5"/>
  `,

  // 🌱 Seedling - green sprout
  seedling: `
    <path fill="#77B255" d="M18 10c-6-8-16 0-10 8 2 3 6 4 10 2v12h2V20c4 2 8 1 10-2C36 10 24 2 18 10z"/>
    <rect fill="#3E721D" x="17" y="14" width="2" height="16" rx="1"/>
  `,

  // 🌿 Herb/leaves - green
  herb: `
    <path fill="#77B255" d="M16 30l2-14C12 12 4 16 6 22c1 3 5 5 10 4z"/>
    <path fill="#77B255" d="M20 30l-2-14C24 12 32 16 30 22c-1 3-5 5-10 4z"/>
    <path fill="#3E721D" d="M16 30q2-6 2-16 0 10 2 16z"/>
    <path fill="#77B255" d="M18 8c6-6 14 0 10 6-2 3-6 3-10 0z"/>
  `,

  // 🌺 Flower - pink/red
  flower: `
    <circle fill="#EA596E" cx="18" cy="10" r="6"/>
    <circle fill="#EA596E" cx="10" cy="16" r="6"/>
    <circle fill="#EA596E" cx="26" cy="16" r="6"/>
    <circle fill="#EA596E" cx="12" cy="25" r="6"/>
    <circle fill="#EA596E" cx="24" cy="25" r="6"/>
    <circle fill="#FFCC4D" cx="18" cy="18" r="5"/>
    <circle fill="#F4900C" cx="18" cy="18" r="2.5"/>
  `,

  // 💚 Green heart
  greenheart: `
    <path fill="#77B255" d="M18 30l-1.5-1.4C7 20.5 2 16 2 10.5 2 6 5.5 2 10 2c2.7 0 5.2 1.3 7 3.2h2C20.8 3.3 23.3 2 26 2c4.5 0 8 4 8 8.5 0 5.5-5 10-15.5 18.1z"/>
  `,

  // 📅 Calendar
  calendar: `
    <rect fill="#E1E8ED" x="3" y="6" width="30" height="26" rx="3"/>
    <rect fill="#DD2E44" x="3" y="6" width="30" height="8" rx="3"/>
    <rect fill="#CCD6DD" x="7" y="18" width="5" height="4" rx="1"/>
    <rect fill="#CCD6DD" x="15.5" y="18" width="5" height="4" rx="1"/>
    <rect fill="#CCD6DD" x="24" y="18" width="5" height="4" rx="1"/>
    <rect fill="#CCD6DD" x="7" y="25" width="5" height="4" rx="1"/>
    <rect fill="#CCD6DD" x="15.5" y="25" width="5" height="4" rx="1"/>
    <rect fill="#66757F" x="10" y="3" width="3" height="6" rx="1.5"/>
    <rect fill="#66757F" x="23" y="3" width="3" height="6" rx="1.5"/>
  `,

  // 🎯 Target/bullseye
  target: `
    <circle fill="#DD2E44" cx="18" cy="18" r="16"/>
    <circle fill="#FFFFFF" cx="18" cy="18" r="12"/>
    <circle fill="#DD2E44" cx="18" cy="18" r="8"/>
    <circle fill="#FFFFFF" cx="18" cy="18" r="4"/>
    <circle fill="#DD2E44" cx="18" cy="18" r="2"/>
  `,

  // 💙 Blue heart
  blueheart: `
    <path fill="#5DADEC" d="M18 30l-1.5-1.4C7 20.5 2 16 2 10.5 2 6 5.5 2 10 2c2.7 0 5.2 1.3 7 3.2h2C20.8 3.3 23.3 2 26 2c4.5 0 8 4 8 8.5 0 5.5-5 10-15.5 18.1z"/>
  `,

  // ☯️ Yin yang
  yinyang: `
    <circle fill="#292F33" cx="18" cy="18" r="16"/>
    <path fill="#FFFFFF" d="M18 2a16 16 0 0 1 0 32 8 8 0 0 1 0-16 8 8 0 0 0 0-16z"/>
    <circle fill="#292F33" cx="18" cy="10" r="3"/>
    <circle fill="#FFFFFF" cx="18" cy="26" r="3"/>
  `,

  // 🐨 Koala face
  koala: `
    <circle fill="#AAB8C2" cx="8" cy="12" r="8"/>
    <circle fill="#E1E8ED" cx="8" cy="12" r="5"/>
    <circle fill="#AAB8C2" cx="28" cy="12" r="8"/>
    <circle fill="#E1E8ED" cx="28" cy="12" r="5"/>
    <circle fill="#AAB8C2" cx="18" cy="20" r="12"/>
    <circle fill="#E1E8ED" cx="18" cy="22" r="8"/>
    <ellipse fill="#292F33" cx="18" cy="21" rx="4" ry="3"/>
    <circle fill="#292F33" cx="13" cy="16" r="2"/>
    <circle fill="#292F33" cx="23" cy="16" r="2"/>
    <circle fill="#FFFFFF" cx="14" cy="15.5" r="0.8"/>
    <circle fill="#FFFFFF" cx="24" cy="15.5" r="0.8"/>
  `,

  // 😔 Pensive/sad face
  pensive: `
    <circle fill="#FFCC4D" cx="18" cy="18" r="16"/>
    <path fill="none" stroke="#664500" stroke-width="2" stroke-linecap="round" d="M10 14q3-3 6 0"/>
    <path fill="none" stroke="#664500" stroke-width="2" stroke-linecap="round" d="M20 14q3-3 6 0"/>
    <path fill="none" stroke="#664500" stroke-width="2" stroke-linecap="round" d="M12 25q6-4 12 0"/>
  `,

  // ✓ Checkmark
  checkmark: `
    <path fill="none" stroke="#77B255" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M6 18l8 8L30 8"/>
  `,

  // ✗ Cross mark
  crossmark: `
    <path fill="none" stroke="#DD2E44" stroke-width="4" stroke-linecap="round" d="M8 8l20 20M28 8L8 28"/>
  `,

  // ⏸ Pause icon
  pause: `
    <rect fill="#AAB8C2" x="8" y="6" width="7" height="24" rx="2"/>
    <rect fill="#AAB8C2" x="21" y="6" width="7" height="24" rx="2"/>
  `,

  // ❤️ Red heart
  heart: `
    <path fill="#DD2E44" d="M18 30l-1.5-1.4C7 20.5 2 16 2 10.5 2 6 5.5 2 10 2c2.7 0 5.2 1.3 7 3.2h2C20.8 3.3 23.3 2 26 2c4.5 0 8 4 8 8.5 0 5.5-5 10-15.5 18.1z"/>
  `,

  // 🔒 Lock
  lock: `
    <rect fill="#FFAC33" x="8" y="16" width="20" height="16" rx="3"/>
    <path fill="none" stroke="#FFAC33" stroke-width="3" d="M12 16v-5a6 6 0 0 1 12 0v5"/>
    <circle fill="#664500" cx="18" cy="24" r="2.5"/>
    <rect fill="#664500" x="17" y="24" width="2" height="4" rx="1"/>
  `,

  // ☀️ Sun
  sun: `
    <circle fill="#FFCC4D" cx="18" cy="18" r="8"/>
    <g stroke="#FFCC4D" stroke-width="3" stroke-linecap="round">
      <line x1="18" y1="2" x2="18" y2="7"/>
      <line x1="18" y1="29" x2="18" y2="34"/>
      <line x1="4" y1="18" x2="9" y2="18"/>
      <line x1="27" y1="18" x2="32" y2="18"/>
      <line x1="7" y1="7" x2="10.5" y2="10.5"/>
      <line x1="25.5" y1="25.5" x2="29" y2="29"/>
      <line x1="7" y1="29" x2="10.5" y2="25.5"/>
      <line x1="25.5" y1="10.5" x2="29" y2="7"/>
    </g>
  `,

  // ☁️ Cloud
  cloud: `
    <path fill="#CCD6DD" d="M30 26H8a6 6 0 0 1 0-12 8 8 0 0 1 15-3 6 6 0 0 1 7 5 5 5 0 0 1 0 10z"/>
  `,

  // 🌧️ Rain cloud
  rain: `
    <path fill="#CCD6DD" d="M30 20H8a6 6 0 0 1 0-12 8 8 0 0 1 15-3 6 6 0 0 1 7 5 5 5 0 0 1 0 10z"/>
    <line x1="10" y1="24" x2="8" y2="30" stroke="#5DADEC" stroke-width="2" stroke-linecap="round"/>
    <line x1="18" y1="24" x2="16" y2="30" stroke="#5DADEC" stroke-width="2" stroke-linecap="round"/>
    <line x1="26" y1="24" x2="24" y2="30" stroke="#5DADEC" stroke-width="2" stroke-linecap="round"/>
  `,

  // ❄️ Snow
  snow: `
    <g stroke="#5DADEC" stroke-width="2" stroke-linecap="round">
      <line x1="18" y1="4" x2="18" y2="32"/>
      <line x1="6" y1="11" x2="30" y2="25"/>
      <line x1="6" y1="25" x2="30" y2="11"/>
    </g>
    <circle fill="#5DADEC" cx="18" cy="18" r="3"/>
  `,

  // ⛈️ Storm
  storm: `
    <path fill="#9AAAB4" d="M30 18H8a6 6 0 0 1 0-12 8 8 0 0 1 15-3 6 6 0 0 1 7 5 5 5 0 0 1 0 10z"/>
    <polygon fill="#FFCC4D" points="20,18 16,25 19,25 15,34 24,24 20,24"/>
  `,

  // 🌫️ Fog
  fog: `
    <rect fill="#CCD6DD" x="4" y="8" width="28" height="4" rx="2" opacity="0.7"/>
    <rect fill="#CCD6DD" x="6" y="15" width="24" height="4" rx="2" opacity="0.5"/>
    <rect fill="#CCD6DD" x="4" y="22" width="28" height="4" rx="2" opacity="0.3"/>
    <rect fill="#CCD6DD" x="8" y="29" width="20" height="3" rx="1.5" opacity="0.2"/>
  `,

  // 🎉 Party popper
  party: `
    <path fill="#DD2E44" d="M4 32L14 8l14 14z"/>
    <path fill="#FFCC4D" d="M6 30L14 12l10 10z"/>
    <circle fill="#77B255" cx="24" cy="6" r="2"/>
    <circle fill="#AA8DD8" cx="28" cy="12" r="1.5"/>
    <circle fill="#FFCC4D" cx="20" cy="4" r="1.5"/>
    <rect fill="#DD2E44" x="30" y="8" width="3" height="3" rx="0.5" transform="rotate(20 31 9)"/>
    <rect fill="#77B255" x="26" y="2" width="2" height="2" rx="0.5"/>
  `,

  // 💪 Muscle/flexed arm
  muscle: `
    <path fill="#FFCC4D" d="M10 28c-2-4-3-8-1-12 2-5 6-6 8-4l4 4c2 2 6 1 8-2s4-4 4-2-1 6-4 9c-3 3-7 4-10 3l-5 6z"/>
  `,

  // 💰 Money bag
  moneybag: `
    <path fill="#FFAC33" d="M14 8h8l-4-6z"/>
    <path fill="#FFAC33" d="M8 18c0-6 4-10 10-10s10 4 10 10v6c0 6-4 10-10 10S8 30 8 24z"/>
    <text fill="#664500" font-size="14" font-weight="bold" text-anchor="middle" x="18" y="27">$</text>
  `,

  // 💎 Gem
  gem: `
    <polygon fill="#5DADEC" points="18,4 30,14 18,32 6,14"/>
    <polygon fill="#78D2F0" points="18,4 24,14 18,32"/>
    <polygon fill="#AAE0F7" points="18,4 12,14 18,20"/>
  `,

  // 🐱 Cat face
  cat: `
    <path fill="#FFCC4D" d="M4 10l6-8v10z"/>
    <path fill="#FFCC4D" d="M32 10l-6-8v10z"/>
    <circle fill="#FFCC4D" cx="18" cy="20" r="14"/>
    <circle fill="#664500" cx="12" cy="17" r="2"/>
    <circle fill="#664500" cx="24" cy="17" r="2"/>
    <ellipse fill="#EA596E" cx="18" cy="22" rx="3" ry="2"/>
  `,

  // 📚 Books
  books: `
    <rect fill="#DD2E44" x="6" y="4" width="8" height="28" rx="1"/>
    <rect fill="#77B255" x="14" y="6" width="8" height="26" rx="1"/>
    <rect fill="#5DADEC" x="22" y="3" width="8" height="29" rx="1"/>
  `,

  // 🌸 Cherry blossom
  blossom: `
    <circle fill="#FDCFE8" cx="18" cy="10" r="5"/>
    <circle fill="#FDCFE8" cx="10" cy="16" r="5"/>
    <circle fill="#FDCFE8" cx="26" cy="16" r="5"/>
    <circle fill="#FDCFE8" cx="12" cy="25" r="5"/>
    <circle fill="#FDCFE8" cx="24" cy="25" r="5"/>
    <circle fill="#FFCC4D" cx="18" cy="18" r="3"/>
  `,

  // 🛡️ Shield
  shield: `
    <path fill="#5DADEC" d="M18 4L6 10v8c0 8 5 14 12 18 7-4 12-10 12-18v-8z"/>
    <path fill="#78D2F0" d="M18 8l-8 4v6c0 6 3 10 8 13V8z"/>
  `,

  // 💊 Pill
  pill: `
    <rect fill="#DD2E44" x="12" y="4" width="12" height="28" rx="6"/>
    <rect fill="#E1E8ED" x="12" y="18" width="12" height="14" rx="6"/>
  `,

  // ⚡ Lightning
  lightning: `
    <polygon fill="#FFCC4D" points="22,2 12,18 18,18 14,34 28,14 20,14"/>
  `,

  // 🍀 Four leaf clover
  clover: `
    <circle fill="#77B255" cx="14" cy="12" r="6"/>
    <circle fill="#77B255" cx="22" cy="12" r="6"/>
    <circle fill="#77B255" cx="14" cy="20" r="6"/>
    <circle fill="#77B255" cx="22" cy="20" r="6"/>
    <rect fill="#3E721D" x="17" y="22" width="2" height="12" rx="1"/>
  `,

  // ▶ Play triangle
  play: `
    <polygon fill="#AAB8C2" points="10,6 30,18 10,30"/>
  `,

  // 🌧 Rain (alias without variant)
  raincloud: `
    <path fill="#CCD6DD" d="M30 20H8a6 6 0 0 1 0-12 8 8 0 0 1 15-3 6 6 0 0 1 7 5 5 5 0 0 1 0 10z"/>
    <line x1="10" y1="24" x2="8" y2="30" stroke="#5DADEC" stroke-width="2" stroke-linecap="round"/>
    <line x1="18" y1="24" x2="16" y2="30" stroke="#5DADEC" stroke-width="2" stroke-linecap="round"/>
    <line x1="26" y1="24" x2="24" y2="30" stroke="#5DADEC" stroke-width="2" stroke-linecap="round"/>
  `,
};

// Pre-built at default size (20px)
export const EMOJI = {};
for (const name of Object.keys(EMOJI_PATHS)) {
  EMOJI[name] = emojiSVG(name);
}
