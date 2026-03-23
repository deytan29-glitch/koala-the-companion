// ===== SHOP DATA & SVG ICONS =====

export const SHOP_ITEMS = [
  // ── LIVING ROOM ──
  { id:'sofa',       name:'Cozy Sofa',         cost:0,  icon:'sofa',       category:'room',    tier:1, room:'living', desc:'A comfortable sofa to relax on.',        effect:'+mood',                         pos:{bottom:'24%',left:'26%',w:165,h:78,z:3} },
  { id:'rug',        name:'Cozy Rug',          cost:10, icon:'rug',        category:'decor',   tier:1, room:'living', desc:'A soft rug under paw.',                  effect:'+0.3/hr regen, +mood',          pos:null },
  { id:'sidetable',  name:'Side Table',        cost:8,  icon:'sidetable',  category:'room',    tier:1, room:'living', desc:'A handy spot for placing items.',        effect:'+0.1/hr passive regen',         pos:{bottom:'24%',right:'1%',w:52,h:46,z:4} },
  { id:'succulent',  name:'Succulent',         cost:5,  icon:'succulent',  category:'decor',   tier:1, room:'living', desc:'A tiny plant friend for the room.',      effect:'-8% health decay',              pos:{bottom:'38%',right:'12%',w:18,h:20,z:5}, requires:'sidetable' },
  { id:'lamp',       name:'Table Lamp',        cost:15, icon:'lamp',       category:'decor',   tier:1, room:'living', desc:'Warm glow for cozy evenings.',           effect:'+10% energy gain',              pos:{bottom:'38%',right:'2%',w:28,h:52,z:5}, hasGlow:true, requires:'sidetable' },
  { id:'plant',      name:'Potted Plant',      cost:8,  icon:'plant',      category:'decor',   tier:1, room:'living', desc:'A leafy companion full of life.',        effect:'-15% health decay',             pos:{bottom:'24%',right:'19%',w:36,h:52,z:3}, requires:'sidetable' },
  { id:'frame',      name:'Wall Art',          cost:18, icon:'frame',      category:'decor',   tier:2, room:'living', desc:'A little art to brighten the wall.',     effect:'+mood boost',                   pos:{bottom:'64%',left:'2%',w:55,h:48,z:0} },
  { id:'floorplant', name:'Floor Plant',       cost:30, icon:'floorplant', category:'decor',   tier:2, room:'living', desc:'A tall leafy friend in the corner.',     effect:'-20% health decay',             pos:{bottom:'24%',left:'1%',w:44,h:95,z:1} },
  { id:'shelf',      name:'Bookshelf',         cost:28, icon:'shelf',      category:'room',    tier:2, room:'living', desc:'Fill the room with stories.',            effect:'+5% energy, +mood',             pos:{bottom:'52%',right:'0%',w:68,h:78,z:2}, minLevel:2 },
  { id:'cat',        name:'Sleeping Cat',      cost:35, icon:'cat',        category:'decor',   tier:2, room:'living', desc:'A lazy cat naps beside the koala.',      effect:'Random coin rewards, +mood',    pos:{bottom:'24%',right:'33%',w:32,h:22,z:4}, minLevel:3 },
  { id:'curtains',   name:'Window Curtains',   cost:45, icon:'curtains',   category:'room',    tier:3, room:'living', desc:'Soft drapes to frame the view.',         effect:'-5% decay, +mood',              pos:null, minLevel:3 },
  { id:'weather',    name:'Weather System',    cost:60, icon:'weather',    category:'special', tier:3, room:'living', desc:'Live weather on the window.',            effect:'Dynamic weather effects',       pos:null, minLevel:5 },
  { id:'fireplace',  name:'Fireplace',         cost:80, icon:'fireplace',  category:'room',    tier:3, room:'living', desc:'Crackling warmth fills the room.',       effect:'+mood, +0.5/hr regen (night)',  pos:{bottom:'24%',left:'4%',w:72,h:60,z:2}, isFireplace:true, minLevel:6 },

  // ── KITCHEN ──
  { id:'kitchen_herb_pot',  name:'Herb Pot',        cost:12, icon:'succulent',  category:'decor', tier:1, room:'kitchen', desc:'Fresh herbs on the kitchen counter.',   effect:'+mood, +5% energy', pos:null },
  { id:'kitchen_fruit_bowl',name:'Fruit Bowl',      cost:18, icon:'plant',      category:'decor', tier:1, room:'kitchen', desc:'A colourful bowl of fresh fruit.',       effect:'+0.2/hr regen',    pos:null },
  { id:'kitchen_pendant',   name:'Pendant Light',   cost:25, icon:'lamp',       category:'decor', tier:2, room:'kitchen', desc:'Warm hanging light above the counter.',  effect:'+8% energy gain',  pos:null, minLevel:2 },
  { id:'kitchen_wall_clock',name:'Wall Clock',      cost:22, icon:'frame',      category:'decor', tier:2, room:'kitchen', desc:'A charming clock on the kitchen wall.',  effect:'+mood',            pos:null, minLevel:2 },
  { id:'kitchen_cookbook',  name:'Cookbook Stand',  cost:30, icon:'shelf',      category:'decor', tier:2, room:'kitchen', desc:'Open cookbook full of yummy recipes.',   effect:'+mood boost',      pos:null, minLevel:3 },

  // ── BEDROOM ──
  { id:'nightlamp',         name:'Night Lamp',       cost:55, icon:'nightlamp',   category:'decor', tier:3, room:'bedroom', desc:'A soft floor lamp for the night.',       effect:'+15% energy gain',             pos:{bottom:'26%',left:'4%',w:36,h:60,z:6}, hasGlow:true, minLevel:4 },
  { id:'bedroom_teddy',     name:'Teddy Bear',       cost:20, icon:'cat',         category:'decor', tier:1, room:'bedroom', desc:'A cozy stuffed bear on the bed.',        effect:'+mood, restful sleep',         pos:null },
  { id:'bedroom_dreamcatcher', name:'Dream Catcher', cost:28, icon:'frame',       category:'decor', tier:2, room:'bedroom', desc:'Hangs above the bed catching dreams.',   effect:'-10% health decay',            pos:null, minLevel:2 },
  { id:'bedroom_star_mobile',  name:'Star Mobile',   cost:35, icon:'lamp',        category:'decor', tier:2, room:'bedroom', desc:'Glowing stars spin above the pillow.',   effect:'+mood, +0.1/hr',               pos:null, minLevel:3 },

  // ── PREMIUM (Subscription Only) ──
  { id:'premium_gold_bed',         name:'Gold Koala Bed',    cost:5000, icon:'goldbed',       category:'premium', tier:'premium', room:'bedroom', desc:'A luxurious golden bed fit for royalty.',      effect:'+0.2/hr regen, +mood boost',   pos:null, requiresPremium:true },
  { id:'premium_fireplace_deluxe', name:'Premium Fireplace', cost:8000, icon:'fireplaceplus', category:'premium', tier:'premium', room:'living',  desc:'An ornate fireplace of magnificent beauty.',   effect:'+0.6/hr regen (night), +mood', pos:{bottom:'24%',left:'4%',w:80,h:65}, requiresPremium:true, isFireplace:true },
  { id:'premium_crystal_lamp',     name:'Crystal Lamp',      cost:6000, icon:'crystallamp',   category:'premium', tier:'premium', room:'bedroom', desc:'Shimmers with enchanted magical light.',       effect:'+20% energy gain, +0.1/hr',    pos:{bottom:'26%',left:'40%',w:36,h:52}, hasGlow:true, requiresPremium:true },
];

export const FOCUS_REWARDS = [
  { id:'bonus5',  name:'+5 Min Bonus',  cost:40, desc:"Add 5 min to today's screen time goal.",  minutes:5 },
  { id:'bonus10', name:'+10 Min Bonus', cost:60, desc:"Add 10 min to today's screen time goal.", minutes:10 },
];

export const PREMIUM_ANIMALS = [
  { id: 'koala', name: 'Koala', desc: 'Your calm and curious forest friend' },
  { id: 'bear', name: 'Bear', desc: 'A cozy forest bear companion' },
  { id: 'bunny', name: 'Bunny', desc: 'A hoppy bunny friend full of energy' },
  { id: 'dog', name: 'Dog', desc: 'A loyal puppy companion' },
];

// ===== SVG ICON GENERATOR =====
export function itemSVG(icon, w, h) {
  const s = w || 40, t = h || 40;
  const cx = s / 2, cy = t / 2;

  const icons = {
    succulent: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="${cx-5}" y="${t-9}" width="10" height="9" rx="2" fill="#C4886B"/>
      <ellipse cx="${cx}" cy="${t-9}" rx="7" ry="4" fill="#7CB97A"/>
      <ellipse cx="${cx-2}" cy="${t-12}" rx="4" ry="5.5" fill="#8BC98A"/>
      <ellipse cx="${cx+2}" cy="${t-13}" rx="4" ry="5" fill="#6BAF6A"/>
      <ellipse cx="${cx}" cy="${t-15}" rx="3" ry="4" fill="#9ED99E"/>
    </svg>`,

    plant: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="${cx-7}" y="${t-17}" width="14" height="15" rx="3" fill="#C4886B" stroke="#A07050" stroke-width="1"/>
      <rect x="${cx-9}" y="${t-19}" width="18" height="4" rx="2" fill="#B07858"/>
      <path d="M${cx} ${t-20} Q${cx-8} ${t-36} ${cx-12} ${t-42}" stroke="#5A9A58" stroke-width="2" fill="none"/>
      <ellipse cx="${cx-12}" cy="${t-44}" rx="6" ry="5" fill="#7CB97A"/>
      <path d="M${cx} ${t-22} Q${cx+4} ${t-36} ${cx+11} ${t-44}" stroke="#5A9A58" stroke-width="2" fill="none"/>
      <ellipse cx="${cx+11}" cy="${t-46}" rx="7" ry="5" fill="#6BAF6A"/>
      <path d="M${cx} ${t-24} L${cx+1} ${t-38}" stroke="#5A9A58" stroke-width="1.8"/>
      <ellipse cx="${cx+1}" cy="${t-40}" rx="5" ry="5" fill="#8BC98A"/>
    </svg>`,

    floorplant: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <!-- Pot -->
      <rect x="${cx-7}" y="${t-15}" width="14" height="14" rx="3" fill="#C4886B" stroke="#A07050" stroke-width="1"/>
      <rect x="${cx-9}" y="${t-18}" width="18" height="5" rx="2" fill="#B07858"/>
      <!-- Tall stem -->
      <line x1="${cx}" y1="${t-19}" x2="${cx}" y2="18" stroke="#5A9A58" stroke-width="2.5"/>
      <!-- Side stems branch out near the top -->
      <path d="M${cx} ${Math.round(t*0.22)} Q${cx-14} ${Math.round(t*0.18)} ${cx-18} ${Math.round(t*0.12)}" stroke="#5A9A58" stroke-width="1.8" fill="none"/>
      <path d="M${cx} ${Math.round(t*0.25)} Q${cx+14} ${Math.round(t*0.20)} ${cx+18} ${Math.round(t*0.14)}" stroke="#5A9A58" stroke-width="1.8" fill="none"/>
      <path d="M${cx} ${Math.round(t*0.30)} Q${cx-10} ${Math.round(t*0.27)} ${cx-15} ${Math.round(t*0.22)}" stroke="#4A8A48" stroke-width="1.4" fill="none"/>
      <!-- Leaf cluster at top -->
      <ellipse cx="${cx-16}" cy="${Math.round(t*0.10)}" rx="13" ry="8" fill="#7CB97A" transform="rotate(-25 ${cx-16} ${Math.round(t*0.10)})"/>
      <ellipse cx="${cx+16}" cy="${Math.round(t*0.12)}" rx="13" ry="8" fill="#6BAF6A" transform="rotate(25 ${cx+16} ${Math.round(t*0.12)})"/>
      <ellipse cx="${cx-6}" cy="${Math.round(t*0.07)}" rx="11" ry="7" fill="#8BC98A" transform="rotate(-10 ${cx-6} ${Math.round(t*0.07)})"/>
      <ellipse cx="${cx+6}" cy="${Math.round(t*0.06)}" rx="10" ry="7" fill="#7CB97A" transform="rotate(15 ${cx+6} ${Math.round(t*0.06)})"/>
      <ellipse cx="${cx}" cy="${Math.round(t*0.04)}" rx="9" ry="6" fill="#9ED99E" transform="rotate(-5 ${cx} ${Math.round(t*0.04)})"/>
      <!-- Mid-height side leaves -->
      <ellipse cx="${cx-13}" cy="${Math.round(t*0.21)}" rx="9" ry="5" fill="#7CB97A" transform="rotate(-30 ${cx-13} ${Math.round(t*0.21)})"/>
    </svg>`,

    rug: `<svg viewBox="0 0 120 40" width="120" height="40" fill="none">
      <ellipse cx="60" cy="20" rx="58" ry="18" fill="#E8DCC8"/>
      <ellipse cx="60" cy="20" rx="50" ry="14" fill="#DDD0BC"/>
      <ellipse cx="60" cy="20" rx="58" ry="18" stroke="#C4B498" stroke-width="2" fill="none"/>
      <ellipse cx="60" cy="20" rx="54" ry="16" stroke="#C4B498" stroke-width=".8" stroke-dasharray="3 2" fill="none"/>
      <ellipse cx="60" cy="20" rx="40" ry="11" stroke="#D0C0A4" stroke-width=".6" fill="none"/>
    </svg>`,

    lamp: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="${cx-3}" y="${t-13}" width="6" height="12" rx="1" fill="#A08260"/>
      <rect x="${cx-8}" y="${t-4}" width="16" height="4" rx="2" fill="#8E7658"/>
      <rect x="${cx-2}" y="18" width="4" height="${t-30}" fill="#A08260"/>
      <path d="M${cx-13} 20 L${cx+13} 20 L${cx+8} 4 L${cx-8} 4 Z" fill="#F8E8B0" stroke="#DCC880" stroke-width="1"/>
      <ellipse cx="${cx}" cy="4" rx="5" ry="2" fill="#F5E8C0"/>
      <ellipse cx="${cx}" cy="20" rx="11" ry="3" fill="#F0D890" opacity=".4"/>
    </svg>`,

    nightlamp: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="${cx-3}" y="${t-6}" width="6" height="6" rx="1" fill="#A08260"/>
      <rect x="${cx-7}" y="${t-9}" width="14" height="4" rx="2" fill="#8E7658"/>
      <rect x="${cx-2}" y="22" width="4" height="${t-30}" fill="#B89870"/>
      <path d="M${cx-10} 22 L${cx+10} 22 L${cx+6} 8 L${cx-6} 8 Z" fill="#FFF0C0" stroke="#E0D080" stroke-width="1"/>
      <ellipse cx="${cx}" cy="8" rx="4" ry="1.5" fill="#FFF0C0"/>
      <circle cx="${cx}" cy="18" r="3" fill="#F8E8A0"/>
    </svg>`,

    frame: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="2" y="2" width="${s-4}" height="${t-4}" rx="3" fill="#FFF8F0" stroke="#C4A870" stroke-width="2.5"/>
      <rect x="6" y="6" width="${s-12}" height="${t-12}" rx="1" fill="#E4F0FA"/>
      <circle cx="${cx}" cy="${cy-2}" r="5" fill="#F4C090"/>
      <path d="M${cx-8} ${cy+4} Q${cx-4} ${cy} ${cx} ${cy+3} Q${cx+4} ${cy+6} ${cx+8} ${cy+3}" stroke="#A0C8E0" stroke-width="1.2" fill="none"/>
    </svg>`,

    shelf: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="2" y="2" width="${s-4}" height="${t-4}" rx="2" fill="#D4BC9A" stroke="#A08260" stroke-width="1.5"/>
      <line x1="2" y1="${t/3}" x2="${s-2}" y2="${t/3}" stroke="#B89870" stroke-width="1.5"/>
      <line x1="2" y1="${t*2/3}" x2="${s-2}" y2="${t*2/3}" stroke="#B89870" stroke-width="1.5"/>
      <rect x="5" y="5" width="5" height="${t/3-8}" rx="1" fill="#7BAFD4"/>
      <rect x="12" y="7" width="4" height="${t/3-10}" rx="1" fill="#E8A0BF"/>
      <rect x="18" y="4" width="6" height="${t/3-7}" rx="1" fill="#7CB97A"/>
      <rect x="5" y="${t/3+3}" width="4" height="${t/3-8}" rx="1" fill="#F4C090"/>
      <rect x="11" y="${t/3+5}" width="5" height="${t/3-10}" rx="1" fill="#9BBFDA"/>
    </svg>`,

    sidetable: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="5" y="7" width="${s-10}" height="${t-18}" rx="3" fill="#C9A87C" stroke="#A08260" stroke-width="1"/>
      <rect x="5" y="7" width="${s-10}" height="4" rx="2" fill="#B8956A"/>
      <rect x="9" y="${t-11}" width="4" height="10" rx="1" fill="#A08260"/>
      <rect x="${s-13}" y="${t-11}" width="4" height="10" rx="1" fill="#A08260"/>
      <circle cx="${cx}" cy="14" r="3" fill="#F4E0C0" stroke="#C8A870" stroke-width="0.8"/>
    </svg>`,

    cat: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <ellipse cx="${cx}" cy="${cy+2}" rx="${cx-2}" ry="${cy-3}" fill="#F0C8A0"/>
      <ellipse cx="${cx}" cy="${cy+2}" rx="${cx-5}" ry="${cy-5}" fill="#E8BA90"/>
      <path d="M${cx-9} ${cy-3} L${cx-6} ${cy-8} L${cx-2} ${cy-3}" fill="#F0C8A0"/>
      <path d="M${cx+9} ${cy-3} L${cx+6} ${cy-8} L${cx+2} ${cy-3}" fill="#F0C8A0"/>
      <path d="M${cx-4} ${cy+1} Q${cx} ${cy-1} ${cx+4} ${cy+1}" stroke="#8B6050" stroke-width="0.8" fill="none"/>
      <ellipse cx="${cx-3}" cy="${cy-1}" rx="1.5" ry="0.8" fill="#5C4030"/>
      <ellipse cx="${cx+3}" cy="${cy-1}" rx="1.5" ry="0.8" fill="#5C4030"/>
    </svg>`,

    curtains: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="2" y="2" width="${s-4}" height="${t-4}" rx="3" fill="#E8D0DC" stroke="#C8A0B8" stroke-width="1.5"/>
      <line x1="${cx}" y1="2" x2="${cx}" y2="${t-2}" stroke="#C8A0B8" stroke-width="1.5"/>
      <path d="M6 8 Q10 18 8 28 Q6 38 10 ${t-6}" stroke="#D4B0C4" stroke-width="1" fill="none"/>
      <path d="M${s-6} 8 Q${s-10} 18 ${s-8} 28 Q${s-6} 38 ${s-10} ${t-6}" stroke="#D4B0C4" stroke-width="1" fill="none"/>
    </svg>`,

    weather: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <circle cx="${cx}" cy="${cy-4}" r="10" fill="#B8D4F0"/>
      <ellipse cx="${cx-6}" cy="${cy+2}" rx="10" ry="7" fill="#D0E4F8"/>
      <ellipse cx="${cx+6}" cy="${cy+2}" rx="10" ry="7" fill="#D0E4F8"/>
      <ellipse cx="${cx}" cy="${cy+4}" rx="14" ry="8" fill="#E0EEFF"/>
      <line x1="${cx-6}" y1="${cy+14}" x2="${cx-8}" y2="${cy+20}" stroke="#90B8E0" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="${cx}" y1="${cy+14}" x2="${cx-2}" y2="${cy+20}" stroke="#90B8E0" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="${cx+6}" y1="${cy+14}" x2="${cx+4}" y2="${cy+20}" stroke="#90B8E0" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

    fireplace: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <rect x="4" y="${cy+4}" width="${s-8}" height="${t-cy-6}" rx="3" fill="#C4A070" stroke="#A08050" stroke-width="1.5"/>
      <rect x="8" y="${cy+8}" width="${s-16}" height="${t-cy-14}" rx="2" fill="#2A1808"/>
      <path d="M${cx-8} ${t-8} Q${cx-4} ${cy+12} ${cx} ${cy+8} Q${cx+4} ${cy+12} ${cx+8} ${t-8}" fill="#E8601A"/>
      <path d="M${cx-5} ${t-8} Q${cx-2} ${cy+16} ${cx} ${cy+12} Q${cx+2} ${cy+16} ${cx+5} ${t-8}" fill="#F49030"/>
      <path d="M${cx-3} ${t-8} Q${cx} ${cy+18} ${cx+3} ${t-8}" fill="#FFCC40"/>
      <rect x="4" y="${cy}" width="${s-8}" height="6" rx="2" fill="#B89060"/>
      <rect x="2" y="${cy-2}" width="${s-4}" height="6" rx="2" fill="#C8A070" stroke="#A08050" stroke-width="1"/>
    </svg>`,

    // ===== PREMIUM ITEM ICONS =====
    goldbed: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <!-- bed frame -->
      <rect x="3" y="${cy+2}" width="${s-6}" height="${t-cy-5}" rx="3" fill="#B8941A" stroke="#9A7A10" stroke-width="1.2"/>
      <!-- mattress -->
      <rect x="5" y="${cy}" width="${s-10}" height="${t-cy-8}" rx="3" fill="#F5E068"/>
      <!-- pillow -->
      <rect x="7" y="${cy+2}" width="${Math.round(s*0.32)}" height="${Math.round((t-cy-8)*0.55)}" rx="3" fill="#FFF5C0" stroke="#E8D840" stroke-width="0.8"/>
      <!-- headboard -->
      <rect x="3" y="${cy-6}" width="${s-6}" height="10" rx="3" fill="#D4A820" stroke="#9A7A10" stroke-width="1.2"/>
      <!-- gold shine lines -->
      <line x1="${Math.round(cx-4)}" y1="${cy-5}" x2="${Math.round(cx-6)}" y2="${cy+1}" stroke="#FFE060" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
      <line x1="${cx}" y1="${cy-5}" x2="${Math.round(cx-1)}" y2="${cy+1}" stroke="#FFE060" stroke-width="1" stroke-linecap="round" opacity=".5"/>
      <!-- star accent -->
      <polygon points="${cx+Math.round(s*0.22)},${cy-3} ${cx+Math.round(s*0.26)},${cy+1} ${cx+Math.round(s*0.30)},${cy-3} ${cx+Math.round(s*0.26)},${cy-7}" fill="#FFE040" opacity=".9"/>
    </svg>`,

    fireplaceplus: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <!-- ornate frame -->
      <rect x="2" y="${cy+2}" width="${s-4}" height="${t-cy-4}" rx="4" fill="#8B5E20" stroke="#6A3E10" stroke-width="1.5"/>
      <!-- marble surround -->
      <rect x="4" y="${cy+4}" width="${s-8}" height="${t-cy-8}" rx="3" fill="#E8E0D4" stroke="#C8B898" stroke-width="1"/>
      <!-- firebox -->
      <rect x="7" y="${cy+8}" width="${s-14}" height="${t-cy-16}" rx="2" fill="#1C0C04"/>
      <!-- flames - layer 3 (back orange) -->
      <path d="M${cx-7} ${t-6} Q${cx-3} ${cy+14} ${cx} ${cy+10} Q${cx+3} ${cy+14} ${cx+7} ${t-6}" fill="#E85A12"/>
      <!-- flames - layer 2 (mid yellow-orange) -->
      <path d="M${cx-5} ${t-6} Q${cx-2} ${cy+17} ${cx} ${cy+13} Q${cx+2} ${cy+17} ${cx+5} ${t-6}" fill="#F49020"/>
      <!-- flames - layer 1 (front bright yellow) -->
      <path d="M${cx-2} ${t-6} Q${cx} ${cy+20} ${cx+2} ${t-6}" fill="#FFCC30"/>
      <!-- decorative top mantle -->
      <rect x="2" y="${cy-2}" width="${s-4}" height="6" rx="2" fill="#A07030" stroke="#7A5020" stroke-width="1"/>
      <!-- gold ornament dots -->
      <circle cx="${cx-Math.round(s*0.3)}" cy="${cy+1}" r="2" fill="#FFD040"/>
      <circle cx="${cx+Math.round(s*0.3)}" cy="${cy+1}" r="2" fill="#FFD040"/>
      <circle cx="${cx}" cy="${cy}" r="2.5" fill="#FFE050"/>
    </svg>`,

    crystallamp: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <!-- stand base -->
      <rect x="${cx-5}" y="${t-8}" width="10" height="7" rx="2" fill="#9090B8" stroke="#7070A0" stroke-width="1"/>
      <rect x="${cx-7}" y="${t-10}" width="14" height="4" rx="2" fill="#A0A0C8"/>
      <!-- pole -->
      <rect x="${cx-2}" y="22" width="4" height="${t-31}" fill="#B0B0D0"/>
      <!-- crystal shade — hexagonal shape with shimmer -->
      <polygon points="${cx},4 ${cx+10},10 ${cx+10},22 ${cx},26 ${cx-10},22 ${cx-10},10" fill="#C8E4FF" stroke="#A0C0F0" stroke-width="1"/>
      <!-- inner glow facets -->
      <polygon points="${cx},7 ${cx+7},12 ${cx+7},20 ${cx},23 ${cx-7},20 ${cx-7},12" fill="#E0F0FF" opacity=".8"/>
      <!-- light center -->
      <circle cx="${cx}" cy="${Math.round(cy-2)}" r="4" fill="#FFFFFF" opacity=".9"/>
      <!-- shimmer highlights -->
      <line x1="${cx+3}" y1="6" x2="${cx+5}" y2="2" stroke="#A0D0FF" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
      <line x1="${cx-4}" y1="7" x2="${cx-6}" y2="3" stroke="#C0E0FF" stroke-width="1" stroke-linecap="round" opacity=".6"/>
      <!-- dangling crystal prisms -->
      <polygon points="${cx-6},22 ${cx-4},22 ${cx-5},28" fill="#B0DCFF" opacity=".8"/>
      <polygon points="${cx},23 ${cx+2},23 ${cx+1},30" fill="#A8D4FF" opacity=".9"/>
      <polygon points="${cx+5},22 ${cx+7},22 ${cx+6},27" fill="#B8E0FF" opacity=".7"/>
    </svg>`,

    sofa: `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
      <!-- Wooden legs -->
      <rect x="${Math.round(s*0.09)}" y="${Math.round(t*0.84)}" width="6" height="${Math.round(t*0.16)}" rx="2" fill="#5C3A1A"/>
      <rect x="${Math.round(s*0.36)}" y="${Math.round(t*0.84)}" width="6" height="${Math.round(t*0.16)}" rx="2" fill="#5C3A1A"/>
      <rect x="${Math.round(s*0.58)}" y="${Math.round(t*0.84)}" width="6" height="${Math.round(t*0.16)}" rx="2" fill="#5C3A1A"/>
      <rect x="${Math.round(s*0.83)}" y="${Math.round(t*0.84)}" width="6" height="${Math.round(t*0.16)}" rx="2" fill="#5C3A1A"/>
      <!-- Sofa base (dark for depth) -->
      <rect x="0" y="${Math.round(t*0.46)}" width="${s}" height="${Math.round(t*0.40)}" rx="5" fill="#3D2468"/>
      <!-- Back rest (tall) -->
      <rect x="0" y="${Math.round(t*0.06)}" width="${s}" height="${Math.round(t*0.46)}" rx="7" fill="#5A3A92"/>
      <!-- Back top highlight rim -->
      <rect x="2" y="${Math.round(t*0.07)}" width="${s-4}" height="${Math.round(t*0.07)}" rx="5" fill="#7050B8" opacity=".55"/>
      <!-- Left armrest -->
      <rect x="0" y="${Math.round(t*0.16)}" width="${Math.round(s*0.11)}" height="${Math.round(t*0.68)}" rx="6" fill="#6540A0"/>
      <!-- Right armrest -->
      <rect x="${Math.round(s*0.89)}" y="${Math.round(t*0.16)}" width="${Math.round(s*0.11)}" height="${Math.round(t*0.68)}" rx="6" fill="#6540A0"/>
      <!-- Armrest top pads (rounded, lighter) -->
      <rect x="0" y="${Math.round(t*0.16)}" width="${Math.round(s*0.11)}" height="${Math.round(t*0.10)}" rx="5" fill="#8060C8"/>
      <rect x="${Math.round(s*0.89)}" y="${Math.round(t*0.16)}" width="${Math.round(s*0.11)}" height="${Math.round(t*0.10)}" rx="5" fill="#8060C8"/>
      <!-- Back cushions (2) -->
      <rect x="${Math.round(s*0.12)}" y="${Math.round(t*0.11)}" width="${Math.round(s*0.35)}" height="${Math.round(t*0.36)}" rx="8" fill="#7450B0"/>
      <rect x="${Math.round(s*0.53)}" y="${Math.round(t*0.11)}" width="${Math.round(s*0.35)}" height="${Math.round(t*0.36)}" rx="8" fill="#6D48A8"/>
      <!-- Back cushion highlight arcs -->
      <path d="M${Math.round(s*0.14)} ${Math.round(t*0.19)} Q${Math.round(s*0.295)} ${Math.round(t*0.15)} ${Math.round(s*0.46)} ${Math.round(t*0.19)}" stroke="#9070D0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M${Math.round(s*0.55)} ${Math.round(t*0.19)} Q${Math.round(s*0.705)} ${Math.round(t*0.15)} ${Math.round(s*0.86)} ${Math.round(t*0.19)}" stroke="#9070D0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/>
      <!-- Seat cushions (2) -->
      <rect x="${Math.round(s*0.12)}" y="${Math.round(t*0.49)}" width="${Math.round(s*0.35)}" height="${Math.round(t*0.36)}" rx="7" fill="#9070C8"/>
      <rect x="${Math.round(s*0.53)}" y="${Math.round(t*0.49)}" width="${Math.round(s*0.35)}" height="${Math.round(t*0.36)}" rx="7" fill="#8868C0"/>
      <!-- Seat cushion top edge (lighter) -->
      <rect x="${Math.round(s*0.12)}" y="${Math.round(t*0.49)}" width="${Math.round(s*0.35)}" height="${Math.round(t*0.07)}" rx="5" fill="#A880D8" opacity=".7"/>
      <rect x="${Math.round(s*0.53)}" y="${Math.round(t*0.49)}" width="${Math.round(s*0.35)}" height="${Math.round(t*0.07)}" rx="5" fill="#A080D0" opacity=".7"/>
      <!-- Decorative throw pillows -->
      <ellipse cx="${Math.round(s*0.195)}" cy="${Math.round(t*0.42)}" rx="${Math.round(s*0.075)}" ry="${Math.round(t*0.14)}" fill="#F0A0C0" opacity=".92"/>
      <ellipse cx="${Math.round(s*0.805)}" cy="${Math.round(t*0.42)}" rx="${Math.round(s*0.075)}" ry="${Math.round(t*0.14)}" fill="#90C8F0" opacity=".92"/>
      <!-- Pillow highlight -->
      <ellipse cx="${Math.round(s*0.185)}" cy="${Math.round(t*0.38)}" rx="${Math.round(s*0.04)}" ry="${Math.round(t*0.05)}" fill="#FFC8E0" opacity=".6"/>
      <ellipse cx="${Math.round(s*0.815)}" cy="${Math.round(t*0.38)}" rx="${Math.round(s*0.04)}" ry="${Math.round(t*0.05)}" fill="#B8E0FF" opacity=".6"/>
    </svg>`,
  };

  return icons[icon] || `<svg viewBox="0 0 ${s} ${t}" width="${s}" height="${t}" fill="none">
    <rect x="4" y="4" width="${s-8}" height="${t-8}" rx="4" fill="#E0D0C0" stroke="#B0A090" stroke-width="1.5"/>
  </svg>`;
}

// Use 56x56 for crisp shop card icons
export function shopSVG(icon) {
  return itemSVG(icon, 56, 56);
}
