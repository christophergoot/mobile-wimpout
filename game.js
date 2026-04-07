'use strict';

// ============================================================
// CONSTANTS
// ============================================================
const WHITE_FACES = [2, 3, 4, 5, 6, 10];
const BLACK_FACES = [2, 3, 4, 5, 6, 'sun'];
const WINNING_SCORE = 500;
const ENTRY_SCORE = 35;
const TUMBLE_MS              = 650;   // die tumble animation duration
const STAGGER_MS             = 60;    // ms between each die starting its tumble
const REVEAL_TRANSITION_MS   = 220;   // CSS transition duration for snap-to-face
const TUMBLE_VARIANTS        = ['tumble-a', 'tumble-b', 'tumble-c'];
const STORAGE_KEY            = 'cosmicWimpoutOpts';
const GAME_STATE_KEY  = 'cosmicWimpoutGame';

// ============================================================
// FACE SVG ICONS
// ============================================================
const FACE_SVGS = {

  // ── 2: Two half-moons (opposing crescents, yin-yang style) ──
  // Outer circles: (13,13) r=11 and (27,27) r=11
  // Inner cutout circles: (17,13) r=8 and (23,27) r=8
  // Intersection x for pair 1: 22.1; pair 2: 17.9
  2: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <path fill="currentColor" d="M22.1,6.9 A11,11 0 1,0 22.1,19.1 A8,8 0 1,1 22.1,6.9 Z"/>
    <path fill="currentColor" d="M17.9,20.9 A11,11 0 1,1 17.9,33.1 A8,8 0 1,0 17.9,20.9 Z"/>
  </svg>`,

  // ── 3: Three pyramids (triforce arrangement, all pointing up) ──
  3: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <polygon fill="currentColor" points="20,3 29,18 11,18"/>
    <polygon fill="currentColor" points="11,21 20,36 2,36"/>
    <polygon fill="currentColor" points="29,21 38,36 20,36"/>
  </svg>`,

  // ── 4: Four starbursts (4-pointed stars, 2×2 grid) ──
  4: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <polygon fill="currentColor" points="11,4 12.5,9.5 18,11 12.5,12.5 11,18 9.5,12.5 4,11 9.5,9.5"/>
    <polygon fill="currentColor" points="29,4 30.5,9.5 36,11 30.5,12.5 29,18 27.5,12.5 22,11 27.5,9.5"/>
    <polygon fill="currentColor" points="11,22 12.5,27.5 18,29 12.5,30.5 11,36 9.5,30.5 4,29 9.5,27.5"/>
    <polygon fill="currentColor" points="29,22 30.5,27.5 36,29 30.5,30.5 29,36 27.5,30.5 22,29 27.5,27.5"/>
  </svg>`,

  // ── 5: Bold numeral with small 5-pointed star at lower-left ──
  5: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <text x="22" y="30" font-family="Orbitron,sans-serif" font-size="30" font-weight="900"
          text-anchor="middle" fill="currentColor">5</text>
    <polygon fill="currentColor" points="9,25.5 9.8,27.9 12.3,27.9 10.3,29.4 11.1,31.8 9,30.3 6.9,31.8 7.7,29.4 5.7,27.9 8.2,27.9"/>
  </svg>`,

  // ── 6: Six 5-pointed stars (2×3 grid) ──
  // Each star: outer R=5.5, inner r=2.1 (regular pentagram ratio ≈0.382)
  6: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <polygon fill="currentColor" points="11,2.5 12.2,6.3 16.2,6.3 13.0,8.6 14.2,12.5 11,10.1 7.8,12.5 9.0,8.6 5.8,6.3 9.8,6.3"/>
    <polygon fill="currentColor" points="29,2.5 30.2,6.3 34.2,6.3 31.0,8.6 32.2,12.5 29,10.1 25.8,12.5 27.0,8.6 23.8,6.3 27.8,6.3"/>
    <polygon fill="currentColor" points="11,14.5 12.2,18.3 16.2,18.3 13.0,20.6 14.2,24.5 11,22.1 7.8,24.5 9.0,20.6 5.8,18.3 9.8,18.3"/>
    <polygon fill="currentColor" points="29,14.5 30.2,18.3 34.2,18.3 31.0,20.6 32.2,24.5 29,22.1 25.8,24.5 27.0,20.6 23.8,18.3 27.8,18.3"/>
    <polygon fill="currentColor" points="11,26.5 12.2,30.3 16.2,30.3 13.0,32.6 14.2,36.5 11,34.1 7.8,36.5 9.0,32.6 5.8,30.3 9.8,30.3"/>
    <polygon fill="currentColor" points="29,26.5 30.2,30.3 34.2,30.3 31.0,32.6 32.2,36.5 29,34.1 25.8,36.5 27.0,32.6 23.8,30.3 27.8,30.3"/>
  </svg>`,

  // ── 10: Bold numeral with small 5-pointed star at lower-left ──
  10: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <text x="21" y="30" font-family="Orbitron,sans-serif" font-size="26" font-weight="900"
          text-anchor="middle" fill="currentColor">10</text>
    <polygon fill="currentColor" points="8,25 8.7,27.1 10.9,27.1 9.1,28.4 9.8,30.4 8,29.2 6.2,30.4 6.9,28.4 5.1,27.1 7.3,27.1"/>
  </svg>`,

  // ── Flaming Sun (wild): 8-pointed starburst ──
  sun: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <polygon fill="currentColor" points="
      20,2   23.4,11.7  32.7,7.3  28.3,16.6
      38,20  28.3,23.4  32.7,32.7 23.4,28.3
      20,38  16.6,28.3  7.3,32.7  11.7,23.4
      2,20   11.7,16.6  7.3,7.3   16.6,11.7"/>
  </svg>`,
};

// ============================================================
// ANIMAL TRACKS DICE SET
// ============================================================
// SVG paths derived from toePath(w, h, cl): M 0,0 C -w,-h*0.18 -w*0.82,-h*0.55 -2.2,-(h-2)
//   L -2,-h L 0,-(h+cl) L 2,-h L 2.2,-(h-2) C w*0.82,-h*0.55 w,-h*0.18 0,0 Z
// Applied via transform="translate(px,py) rotate(angleDeg)"
const ANIMAL_TRACK_SVGS = {

  // ── 2: White-tailed Deer — two cloven hoof halves ──
  2: `<svg viewBox="0 0 100 130" width="100%" height="100%">
    <defs><filter id="f-deer" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.13" numOctaves="4" seed="5" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G" scale="1.3"/>
    </filter></defs>
    <g filter="url(#f-deer)">
      <path fill="currentColor" d="M 46,13 C 22,15 9,42 9,69 C 9,93 23,114 46,116 C 45,97 44,78 44,58 C 44,38 45,25 46,13 Z"/>
      <path fill="currentColor" d="M 54,13 C 78,15 91,42 91,69 C 91,93 77,114 54,116 C 55,97 56,78 56,58 C 56,38 55,25 54,13 Z"/>
    </g>
  </svg>`,

  // ── 3: Emu — three forward toes, pivot at (50,110) ──
  // toePath(9,40,13): h1=7.2 h2=22  toePath(11,48,15): h1=8.64 h2=26.4
  3: `<svg viewBox="0 0 100 130" width="100%" height="100%">
    <defs><filter id="f-emu" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.13" numOctaves="4" seed="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G" scale="1.1"/>
    </filter></defs>
    <g filter="url(#f-emu)">
      <path fill="currentColor" transform="translate(50,110) rotate(-36)"
        d="M 0,0 C -9,-7.2 -7.38,-22 -2.2,-38 L -2,-40 L 0,-53 L 2,-40 L 2.2,-38 C 7.38,-22 9,-7.2 0,0 Z"/>
      <path fill="currentColor" transform="translate(50,110) rotate(0)"
        d="M 0,0 C -11,-8.64 -9.02,-26.4 -2.2,-46 L -2,-48 L 0,-63 L 2,-48 L 2.2,-46 C 9.02,-26.4 11,-8.64 0,0 Z"/>
      <path fill="currentColor" transform="translate(50,110) rotate(36)"
        d="M 0,0 C -9,-7.2 -7.38,-22 -2.2,-38 L -2,-40 L 0,-53 L 2,-40 L 2.2,-38 C 7.38,-22 9,-7.2 0,0 Z"/>
    </g>
  </svg>`,

  // ── 4: American Crow — three forward toes + rear hallux, pivot at (50,85) ──
  // toePath(3,22,8): h1=3.96 h2=12.1  toePath(4,30,9): h1=5.4 h2=16.5  toePath(4,38,11): h1=6.84 h2=20.9
  4: `<svg viewBox="0 0 100 130" width="100%" height="100%">
    <defs><filter id="f-crow" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.13" numOctaves="4" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G" scale="0.9"/>
    </filter></defs>
    <g filter="url(#f-crow)">
      <path fill="currentColor" transform="translate(50,85) rotate(180)"
        d="M 0,0 C -3,-3.96 -2.46,-12.1 -2.2,-20 L -2,-22 L 0,-30 L 2,-22 L 2.2,-20 C 2.46,-12.1 3,-3.96 0,0 Z"/>
      <path fill="currentColor" transform="translate(50,85) rotate(-46)"
        d="M 0,0 C -4,-5.4 -3.28,-16.5 -2.2,-28 L -2,-30 L 0,-39 L 2,-30 L 2.2,-28 C 3.28,-16.5 4,-5.4 0,0 Z"/>
      <path fill="currentColor" transform="translate(50,85) rotate(0)"
        d="M 0,0 C -4,-6.84 -3.28,-20.9 -2.2,-36 L -2,-38 L 0,-49 L 2,-38 L 2.2,-36 C 3.28,-20.9 4,-6.84 0,0 Z"/>
      <path fill="currentColor" transform="translate(50,85) rotate(46)"
        d="M 0,0 C -4,-5.4 -3.28,-16.5 -2.2,-28 L -2,-30 L 0,-39 L 2,-30 L 2.2,-28 C 3.28,-16.5 4,-5.4 0,0 Z"/>
    </g>
  </svg>`,

  // ── 5: reuse cosmic numeral (no animal track for this value) ──
  5: FACE_SVGS[5],

  // ── 6: Black Bear — five toe pads + heel pad, pivot at (50,93) ──
  // toeAngles=[-148,-114,-90,-66,-32], dist=32, r=8, cl=11
  // Toe positions (cx,cy) and triangle claw M...L...L...Z computed from bearClaw()
  6: `<svg viewBox="0 0 100 130" width="100%" height="100%">
    <defs><filter id="f-bear" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.13" numOctaves="4" seed="11" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G" scale="1.4"/>
    </filter></defs>
    <g filter="url(#f-bear)">
      <ellipse cx="43" cy="93" rx="18" ry="16" fill="currentColor"/>
      <ellipse cx="57" cy="93" rx="18" ry="16" fill="currentColor"/>
      <circle cx="22.9" cy="76.0" r="8" fill="currentColor"/>
      <path fill="currentColor" d="M 17.3,69.8 L 6.8,66.0 L 14.9,73.8 Z"/>
      <circle cx="37.0" cy="63.8" r="8" fill="currentColor"/>
      <path fill="currentColor" d="M 35.8,55.5 L 29.3,46.4 L 31.6,57.4 Z"/>
      <circle cx="50" cy="61" r="8" fill="currentColor"/>
      <path fill="currentColor" d="M 52.3,53 L 50,42 L 47.7,53 Z"/>
      <circle cx="63.0" cy="63.8" r="8" fill="currentColor"/>
      <path fill="currentColor" d="M 68.4,57.4 L 70.7,46.4 L 64.2,55.5 Z"/>
      <circle cx="77.1" cy="76.0" r="8" fill="currentColor"/>
      <path fill="currentColor" d="M 85.1,73.8 L 93.3,66.0 L 82.7,69.8 Z"/>
    </g>
  </svg>`,

  // ── 10: reuse cosmic numeral ──
  10: FACE_SVGS[10],

  // ── sun (wild): flaming sun — same as cosmic theme ──
  sun: FACE_SVGS.sun,
};

// ============================================================
// ARCADE DICE SET
// ============================================================
const ARCADE_SVGS = {

  // ── 2: two pixel hearts (diagonal, top-right + bottom-left) ──
  2: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <circle fill="currentColor" cx="24" cy="12" r="3"/>
    <circle fill="currentColor" cx="30" cy="12" r="3"/>
    <polygon fill="currentColor" points="21,12 33,12 27,19.5"/>
    <circle fill="currentColor" cx="10" cy="28" r="3"/>
    <circle fill="currentColor" cx="16" cy="28" r="3"/>
    <polygon fill="currentColor" points="7,28 19,28 13,35.5"/>
  </svg>`,

  // ── 3: three coins (circles) in triangle layout ──
  3: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <circle fill="currentColor" cx="20" cy="10" r="5.5"/>
    <circle fill="currentColor" cx="10" cy="28" r="5.5"/>
    <circle fill="currentColor" cx="30" cy="28" r="5.5"/>
  </svg>`,

  // ── 4: four pixel diamonds in 2×2 grid ──
  4: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <polygon fill="currentColor" points="11,6 16,11 11,16 6,11"/>
    <polygon fill="currentColor" points="29,6 34,11 29,16 24,11"/>
    <polygon fill="currentColor" points="11,24 16,29 11,34 6,29"/>
    <polygon fill="currentColor" points="29,24 34,29 29,34 24,29"/>
  </svg>`,

  // ── 5: pixel numeral "5" (5×6 grid, cell=4) ──
  5: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <rect fill="currentColor" x="10" y="8"  width="4" height="4"/>
    <rect fill="currentColor" x="14" y="8"  width="4" height="4"/>
    <rect fill="currentColor" x="18" y="8"  width="4" height="4"/>
    <rect fill="currentColor" x="22" y="8"  width="4" height="4"/>
    <rect fill="currentColor" x="26" y="8"  width="4" height="4"/>
    <rect fill="currentColor" x="10" y="12" width="4" height="4"/>
    <rect fill="currentColor" x="10" y="16" width="4" height="4"/>
    <rect fill="currentColor" x="14" y="16" width="4" height="4"/>
    <rect fill="currentColor" x="18" y="16" width="4" height="4"/>
    <rect fill="currentColor" x="22" y="16" width="4" height="4"/>
    <rect fill="currentColor" x="26" y="20" width="4" height="4"/>
    <rect fill="currentColor" x="26" y="24" width="4" height="4"/>
    <rect fill="currentColor" x="10" y="28" width="4" height="4"/>
    <rect fill="currentColor" x="14" y="28" width="4" height="4"/>
    <rect fill="currentColor" x="18" y="28" width="4" height="4"/>
    <rect fill="currentColor" x="22" y="28" width="4" height="4"/>
    <rect fill="currentColor" x="26" y="28" width="4" height="4"/>
  </svg>`,

  // ── 6: six bullet/capsule shapes (rounded rects) in 2×3 grid ──
  6: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <rect fill="currentColor" x="12" y="4"  width="6" height="10" rx="3"/>
    <rect fill="currentColor" x="22" y="4"  width="6" height="10" rx="3"/>
    <rect fill="currentColor" x="12" y="16" width="6" height="10" rx="3"/>
    <rect fill="currentColor" x="22" y="16" width="6" height="10" rx="3"/>
    <rect fill="currentColor" x="12" y="28" width="6" height="10" rx="3"/>
    <rect fill="currentColor" x="22" y="28" width="6" height="10" rx="3"/>
  </svg>`,

  // ── 10: pixel "10" numeral drawn with rects (pixel size 3) ──
  10: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <rect fill="currentColor" x="12" y="10" width="3" height="3"/>
    <rect fill="currentColor" x="9"  y="13" width="3" height="3"/>
    <rect fill="currentColor" x="12" y="13" width="3" height="3"/>
    <rect fill="currentColor" x="12" y="16" width="3" height="3"/>
    <rect fill="currentColor" x="12" y="19" width="3" height="3"/>
    <rect fill="currentColor" x="12" y="22" width="3" height="3"/>
    <rect fill="currentColor" x="12" y="25" width="3" height="3"/>
    <rect fill="currentColor" x="9"  y="28" width="3" height="3"/>
    <rect fill="currentColor" x="12" y="28" width="3" height="3"/>
    <rect fill="currentColor" x="15" y="28" width="3" height="3"/>
    <rect fill="currentColor" x="20" y="10" width="3" height="3"/>
    <rect fill="currentColor" x="23" y="10" width="3" height="3"/>
    <rect fill="currentColor" x="26" y="10" width="3" height="3"/>
    <rect fill="currentColor" x="29" y="10" width="3" height="3"/>
    <rect fill="currentColor" x="20" y="13" width="3" height="3"/>
    <rect fill="currentColor" x="29" y="13" width="3" height="3"/>
    <rect fill="currentColor" x="20" y="16" width="3" height="3"/>
    <rect fill="currentColor" x="29" y="16" width="3" height="3"/>
    <rect fill="currentColor" x="20" y="19" width="3" height="3"/>
    <rect fill="currentColor" x="29" y="19" width="3" height="3"/>
    <rect fill="currentColor" x="20" y="22" width="3" height="3"/>
    <rect fill="currentColor" x="29" y="22" width="3" height="3"/>
    <rect fill="currentColor" x="20" y="25" width="3" height="3"/>
    <rect fill="currentColor" x="29" y="25" width="3" height="3"/>
    <rect fill="currentColor" x="20" y="28" width="3" height="3"/>
    <rect fill="currentColor" x="23" y="28" width="3" height="3"/>
    <rect fill="currentColor" x="26" y="28" width="3" height="3"/>
    <rect fill="currentColor" x="29" y="28" width="3" height="3"/>
  </svg>`,

  // ── sun (wild): space invader alien (9×7 pixel grid, cell=4) ──
  sun: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <rect fill="currentColor" x="6"  y="5"  width="4" height="4"/>
    <rect fill="currentColor" x="30" y="5"  width="4" height="4"/>
    <rect fill="currentColor" x="10" y="9"  width="4" height="4"/>
    <rect fill="currentColor" x="26" y="9"  width="4" height="4"/>
    <rect fill="currentColor" x="6"  y="13" width="4" height="4"/>
    <rect fill="currentColor" x="10" y="13" width="4" height="4"/>
    <rect fill="currentColor" x="14" y="13" width="4" height="4"/>
    <rect fill="currentColor" x="18" y="13" width="4" height="4"/>
    <rect fill="currentColor" x="22" y="13" width="4" height="4"/>
    <rect fill="currentColor" x="26" y="13" width="4" height="4"/>
    <rect fill="currentColor" x="30" y="13" width="4" height="4"/>
    <rect fill="currentColor" x="2"  y="17" width="4" height="4"/>
    <rect fill="currentColor" x="6"  y="17" width="4" height="4"/>
    <rect fill="currentColor" x="14" y="17" width="4" height="4"/>
    <rect fill="currentColor" x="18" y="17" width="4" height="4"/>
    <rect fill="currentColor" x="22" y="17" width="4" height="4"/>
    <rect fill="currentColor" x="30" y="17" width="4" height="4"/>
    <rect fill="currentColor" x="34" y="17" width="4" height="4"/>
    <rect fill="currentColor" x="2"  y="21" width="4" height="4"/>
    <rect fill="currentColor" x="6"  y="21" width="4" height="4"/>
    <rect fill="currentColor" x="10" y="21" width="4" height="4"/>
    <rect fill="currentColor" x="14" y="21" width="4" height="4"/>
    <rect fill="currentColor" x="18" y="21" width="4" height="4"/>
    <rect fill="currentColor" x="22" y="21" width="4" height="4"/>
    <rect fill="currentColor" x="26" y="21" width="4" height="4"/>
    <rect fill="currentColor" x="30" y="21" width="4" height="4"/>
    <rect fill="currentColor" x="34" y="21" width="4" height="4"/>
    <rect fill="currentColor" x="10" y="25" width="4" height="4"/>
    <rect fill="currentColor" x="14" y="25" width="4" height="4"/>
    <rect fill="currentColor" x="22" y="25" width="4" height="4"/>
    <rect fill="currentColor" x="26" y="25" width="4" height="4"/>
    <rect fill="currentColor" x="6"  y="29" width="4" height="4"/>
    <rect fill="currentColor" x="30" y="29" width="4" height="4"/>
  </svg>`,
};

const DICE_SETS = { cosmic: FACE_SVGS, tracks: ANIMAL_TRACK_SVGS, arcade: ARCADE_SVGS };

// ============================================================
// FACE MAPPING  (which value lives on each geometric face)
// ============================================================
// Cube face → die value assignment.  show-VALUE CSS classes rotate the cube
// so the matching face points toward the viewer.
const FACE_VALUES_WHITE = { 'face-front': 2, 'face-back': 3, 'face-right': 4, 'face-left': 5, 'face-top': 6, 'face-bottom': 10 };
const FACE_VALUES_BLACK = { 'face-front': 2, 'face-back': 3, 'face-right': 4, 'face-left': 5, 'face-top': 6, 'face-bottom': 'sun' };

/** Stamp SVG content on all 6 faces of every die for the given dice set. */
function refreshDiceFaces(setKey) {
  const svgSet = DICE_SETS[setKey] || FACE_SVGS;
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById(`die-${i}`);
    if (!el) continue;
    const faceMap = i === 4 ? FACE_VALUES_BLACK : FACE_VALUES_WHITE;
    Object.entries(faceMap).forEach(([cls, val]) => {
      const faceEl = el.querySelector(`.${cls}`);
      if (faceEl) {
        const svg = svgSet[val] || FACE_SVGS[val] || `<span class="die-num">${val}</span>`;
        faceEl.innerHTML = `<span class="die-face">${svg}</span>`;
      }
    });
  }
}

function getDiceThemePreview(setKey) {
  return (DICE_SETS[setKey] || FACE_SVGS)[6];
}

function renderDiceThemeBtn(btn) {
  const set = btn.dataset.set || 'cosmic';
  btn.innerHTML = getDiceThemePreview(set);
  btn.setAttribute('aria-label', 'Dice style: ' + set.charAt(0).toUpperCase() + set.slice(1));
}

function closeDiceThemePicker() {
  document.querySelectorAll('.dice-theme-picker').forEach(p => p.remove());
  document.querySelectorAll('.dice-theme-btn.active').forEach(b => b.classList.remove('active'));
}

function showDiceThemePicker(btn) {
  closeDiceThemePicker();
  const picker = document.createElement('div');
  picker.className = 'dice-theme-picker';
  const currentSet = btn.dataset.set || 'cosmic';
  [['cosmic','Cosmic'],['tracks','Tracks'],['arcade','Arcade']].forEach(([key, label]) => {
    const opt = document.createElement('div');
    opt.className = 'dice-theme-option' + (key === currentSet ? ' selected' : '');
    opt.innerHTML = `<div class="dice-theme-opt-icon">${getDiceThemePreview(key)}</div><span class="dice-theme-option-label">${label}</span>`;
    opt.addEventListener('click', e => {
      e.stopPropagation();
      btn.dataset.set = key;
      renderDiceThemeBtn(btn);
      closeDiceThemePicker();
    });
    picker.appendChild(opt);
  });
  btn.classList.add('active');
  btn.closest('.dice-theme-wrap').appendChild(picker);
  setTimeout(() => document.addEventListener('click', closeDiceThemePicker, { once: true }), 0);
}

// ============================================================
// STATE
// ============================================================
let G = null;

// ============================================================
// BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  refreshDiceFaces('cosmic');
  document.querySelectorAll('.dice-theme-btn').forEach(renderDiceThemeBtn);
  document.getElementById('player-fields').addEventListener('click', e => {
    const btn = e.target.closest('.dice-theme-btn');
    if (btn) { e.stopPropagation(); showDiceThemePicker(btn); }
  });
  document.getElementById('start-game-btn').addEventListener('click', onStartGame);
  document.getElementById('add-player-btn').addEventListener('click', onAddPlayer);
  document.getElementById('roll-btn').addEventListener('click', onRoll);
  document.getElementById('bank-btn').addEventListener('click', onBank);
  document.getElementById('next-btn').addEventListener('click', onNextPlayer);
  document.getElementById('play-again-btn').addEventListener('click', showSetupScreen);
  ['opt-entry', 'opt-clear-flash', 'opt-all-five', 'opt-flash-optional'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveOpts);
  });

  // How to Play
  document.getElementById('help-btn').addEventListener('click', () => {
    document.getElementById('help-modal').hidden = false;
  });
  document.getElementById('help-close-btn').addEventListener('click', () => {
    document.getElementById('help-modal').hidden = true;
  });
  document.getElementById('help-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById('help-modal').hidden = true;
  });

  // Theme
  document.getElementById('theme-btn').addEventListener('click', openThemeModal);
  document.getElementById('theme-close-btn').addEventListener('click', closeThemeModal);
  document.getElementById('theme-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeThemeModal(); // close on backdrop click
  });
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (preset === 'custom') {
        applyTheme(loadCustomTheme() || THEMES.dark);
      } else {
        if (!THEMES[preset]) return;
        applyTheme(THEMES[preset]);
      }
      savePreset(preset);
      buildThemeModal();
    });
  });
  loadSavedTheme();

  if (!restoreGameState()) {
    showSetupScreen();
  }
});

// ============================================================
// SETUP SCREEN
// ============================================================
function saveOpts() {
  const opts = {
    entryRequired:      document.getElementById('opt-entry').checked,
    clearFlashRequired: document.getElementById('opt-clear-flash').checked,
    allFiveRequired:    document.getElementById('opt-all-five').checked,
    flashOptional:      document.getElementById('opt-flash-optional').checked,
    suicidePact:        document.getElementById('opt-suicide-pact').checked,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
}

function loadOpts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      document.getElementById('opt-entry').checked          = saved.entryRequired      !== false;
      document.getElementById('opt-clear-flash').checked    = saved.clearFlashRequired !== false;
      document.getElementById('opt-all-five').checked       = saved.allFiveRequired    !== false;
      document.getElementById('opt-flash-optional').checked = !!saved.flashOptional;
      document.getElementById('opt-suicide-pact').checked   = !!saved.suicidePact;
    }
  } catch (_) { /* ignore parse errors, keep defaults */ }
}

function showSetupScreen() {
  G = null;
  clearGameState();
  document.getElementById('setup-screen').hidden = false;
  document.getElementById('game-screen').hidden = true;
  document.getElementById('gameover-screen').hidden = true;
  document.getElementById('player-fields').innerHTML = `
    <div class="player-field">
      <span class="player-num">1</span>
      <input type="text" class="player-name-input" placeholder="Player 1" maxlength="14" autocomplete="off">
      <div class="dice-theme-wrap"><button type="button" class="dice-theme-btn" data-set="cosmic"></button></div>
    </div>
    <div class="player-field">
      <span class="player-num">2</span>
      <input type="text" class="player-name-input" placeholder="Player 2" maxlength="14" autocomplete="off">
      <div class="dice-theme-wrap"><button type="button" class="dice-theme-btn" data-set="cosmic"></button></div>
    </div>`;
  document.querySelectorAll('.dice-theme-btn').forEach(renderDiceThemeBtn);
  document.getElementById('add-player-btn').disabled = false;
  loadOpts();
}

function onAddPlayer() {
  const fields = document.getElementById('player-fields');
  const count = fields.children.length + 1;
  if (count > 6) return;
  const div = document.createElement('div');
  div.className = 'player-field';
  div.innerHTML = `
    <span class="player-num">${count}</span>
    <input type="text" class="player-name-input" placeholder="Player ${count}" maxlength="14" autocomplete="off">
    <div class="dice-theme-wrap"><button type="button" class="dice-theme-btn" data-set="cosmic"></button></div>
    <button class="remove-player-btn" onclick="removePlayer(this)">✕</button>`;
  renderDiceThemeBtn(div.querySelector('.dice-theme-btn'));
  fields.appendChild(div);
  if (count >= 6) document.getElementById('add-player-btn').disabled = true;
}

function removePlayer(btn) {
  btn.parentElement.remove();
  document.getElementById('add-player-btn').disabled = false;
  // Re-number
  document.querySelectorAll('.player-num').forEach((el, i) => { el.textContent = i + 1; });
}

function onStartGame() {
  const inputs = Array.from(document.querySelectorAll('.player-name-input'));
  const names = inputs.map((inp, i) => inp.value.trim() || `Player ${i + 1}`);
  if (names.length < 2) { alert('Need at least 2 players!'); return; }
  const diceSets = Array.from(document.querySelectorAll('.dice-theme-btn')).map(btn => btn.dataset.set || 'cosmic');
  const opts = {
    entryRequired:      document.getElementById('opt-entry').checked,
    clearFlashRequired: document.getElementById('opt-clear-flash').checked,
    allFiveRequired:    document.getElementById('opt-all-five').checked,
    flashOptional:      document.getElementById('opt-flash-optional').checked,
    suicidePact:        document.getElementById('opt-suicide-pact').checked,
  };
  G = createGame(names, opts, diceSets);
  document.getElementById('setup-screen').hidden = true;
  document.getElementById('game-screen').hidden = false;
  document.getElementById('gameover-screen').hidden = true;
  renderScoreBoard();
  startTurn();
}

// ============================================================
// GAME STATE PERSISTENCE
// ============================================================
function saveGameState() {
  if (!G || G.phase === 'gameover') return;
  try {
    const snapshot = {
      ...G,
      dice: G.dice.map(d => ({ ...d })),
      lastLicksDone: [...G.lastLicksDone],
    };
    // If saved mid-animation, treat as pre-roll on restore
    if (snapshot.phase === 'rolling') {
      snapshot.phase = 'preroll';
      snapshot.dice.forEach(d => { if (d.state === 'rolling') d.state = 'unrolled'; });
      snapshot.committedScore = 0;
      snapshot.evalResult = null;
      snapshot.lastRollIndices = [];
    }
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(snapshot));
  } catch (_) {}
}

function clearGameState() {
  localStorage.removeItem(GAME_STATE_KEY);
}

function restoreGameState() {
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return false;
    const snapshot = JSON.parse(raw);
    if (!snapshot || !snapshot.players || snapshot.phase === 'gameover') return false;
    G = { ...snapshot, lastLicksDone: new Set(snapshot.lastLicksDone) };
    refreshDiceFaces((G.players[G.currentPlayerIndex] || {}).diceSet || 'cosmic');
    document.getElementById('setup-screen').hidden = true;
    document.getElementById('game-screen').hidden = false;
    document.getElementById('gameover-screen').hidden = true;
    renderScoreBoard();
    renderCurrentPlayer();
    renderDice();
    refreshTurnScore();
    updateLastLicksBanner();
    updateButtons();
    if (G.phase === 'endturn') showNextBtn();
    if (G.phase === 'pact-freight-choice' && G.evalResult) showFreightPactChoice(G.evalResult);
    if (G.phase === 'pact-wimpout-choice') showWimpoutPactChoice();
    const msg = G.savedMsg;
    if (msg) {
      setMessage(msg.main, msg.sub);
      if (msg.cls) document.getElementById('msg-main').className = msg.cls;
    } else {
      setMessage(`${G.players[G.currentPlayerIndex].name}'s turn — game restored.`, '');
    }
    return true;
  } catch (_) { return false; }
}

// ============================================================
// GAME MODEL
// ============================================================
function createGame(playerNames, opts = {}, diceSets = []) {
  return {
    players: playerNames.map((name, i) => ({ name, score: 0, eliminated: false, suicidePactToken: false, diceSet: diceSets[i] || 'cosmic' })),
    opts: {
      entryRequired:      opts.entryRequired      !== false,
      clearFlashRequired: opts.clearFlashRequired !== false,
      allFiveRequired:    opts.allFiveRequired    !== false,
      flashOptional:      !!opts.flashOptional,
      suicidePact:        !!opts.suicidePact,
    },
    currentPlayerIndex: 0,

    // Die object: value | isBlack | state
    // state: 'unrolled' | 'rolled' | 'selected' | 'committed' | 'flash'
    dice: [
      { id: 0, value: null, isBlack: false, state: 'unrolled' },
      { id: 1, value: null, isBlack: false, state: 'unrolled' },
      { id: 2, value: null, isBlack: false, state: 'unrolled' },
      { id: 3, value: null, isBlack: false, state: 'unrolled' },
      { id: 4, value: null, isBlack: true,  state: 'unrolled' },
    ],

    // Accumulated score from dice committed this turn
    committedScore: 0,

    // phase: 'preroll' | 'rolling' | 'choosing' | 'endturn'
    phase: 'preroll',

    // Eval result of the current roll
    evalResult: null,
    // Global indices of dice from the most recent roll
    lastRollIndices: [],

    // Flash value whose dice were selected this roll → must roll before banking
    mustClearFlash: false,
    // The flash value being cleared on the next roll (forbidden from scoring on that roll)
    clearingFlashValue: null,

    // Must roll all 5 dice next (sampler / all-dice-used)
    mustRollAll: false,

    // Last licks state
    lastLicksActive: false,
    lastLicksInitiator: -1,
    lastLicksDone: new Set(),

    // Last displayed message (for restore after refresh)
    savedMsg: null,
  };
}

// ============================================================
// DICE ROLLING & EVALUATION
// ============================================================
function rollDie(isBlack) {
  const faces = isBlack ? BLACK_FACES : WHITE_FACES;
  return faces[Math.floor(Math.random() * faces.length)];
}

/**
 * Evaluate a set of freshly-rolled dice.
 * dice: array of {value, isBlack} from G.dice (the rolled subset)
 * clearingValue: flash value being cleared (this value can't participate in scoring)
 */
function evaluateDice(dice, clearingValue) {
  const n = dice.length;
  const vals = dice.map(d => d.value);
  const sunIdx = vals.indexOf('sun');
  const hasSun = sunIdx !== -1;
  const numericVals = vals.map(v => v === 'sun' ? null : v);
  const nonNull = numericVals.filter(v => v !== null);

  // ── FREIGHT TRAIN (only when rolling all 5 dice at once) ──
  if (n === 5) {
    const unique = new Set(nonNull);
    if (unique.size === 1) {
      const fv = [...unique][0];
      if (nonNull.length + (hasSun ? 1 : 0) === 5) {
        if (fv === 6)  return { type: 'freight', sub: 'win',      value: fv, score: 600 };
        if (fv === 10) return { type: 'freight', sub: 'supernova', value: fv, score: 0  };
        return { type: 'freight', sub: 'normal', value: fv, score: fv * 100 };
      }
    }
  }

  // ── SAMPLER (only when rolling all 5 dice) ──
  if (n === 5 && new Set(vals).size === 5) {
    return { type: 'sampler', score: 25, flashValue: null, flashIndices: [], canScore: vals.map(() => true) };
  }

  // ── FLASH DETECTION ──
  const counts = {};
  nonNull.forEach(v => { counts[v] = (counts[v] || 0) + 1; });

  let flashValue = null;
  let flashIndices = []; // local indices into `dice`

  // Direct flash: exactly 3 of the same value.
  // (5-of-a-kind is caught by the freight-train check above before we get here.)
  for (const [vStr, cnt] of Object.entries(counts)) {
    const v = Number(vStr);
    if (v === clearingValue) continue;
    if (cnt === 3) {
      flashValue = v;
      flashIndices = numericVals.map((nv, i) => nv === v ? i : null).filter(i => i !== null);
      break;
    }
  }

  // Sun flash: pair + sun (pick highest-scoring pair if multiple)
  if (flashValue === null && hasSun) {
    let best = null, bestPts = -1;
    for (const [vStr, cnt] of Object.entries(counts)) {
      const v = Number(vStr);
      if (v === clearingValue) continue;
      if (cnt >= 2 && v * 10 > bestPts) { best = v; bestPts = v * 10; }
    }
    if (best !== null) {
      flashValue = best;
      flashIndices = [
        ...numericVals.map((nv, i) => nv === best ? i : null).filter(i => i !== null),
        sunIdx
      ];
    }
  }

  // ── INDIVIDUAL SCORING ──
  // clearingValue only blocks new flashes of that value (handled above); it does
  // NOT block individual scoring — a 5 rolled while clearing a flash of 5s still
  // scores as an individual 5 and proves the flash.
  const canScore = vals.map((v, i) => {
    if (flashIndices.includes(i)) return true;   // part of flash
    if (v === 'sun') return true;                 // sun scores as 10 individually
    return v === 5 || v === 10;                   // individual 5 or 10
  });

  return {
    type: canScore.some(Boolean) ? 'normal' : 'wimpout',
    flashValue,
    flashIndices,
    canScore,
  };
}

// ============================================================
// SCORE HELPERS
// ============================================================
/** Score of currently selected dice in the active roll. */
function calcCurrentRollScore() {
  const er = G.evalResult;
  if (!er) return 0;
  if (er.type === 'freight') return er.score;
  if (er.type === 'sampler') return 25;
  if (er.type === 'wimpout') return 0;

  const { flashValue, flashIndices } = er;
  const gIdxs = G.lastRollIndices;
  let score = 0;

  // Flash score: only if every flash die is still held
  const allHeld = flashValue !== null &&
    flashIndices.every(li => G.dice[gIdxs[li]].state === 'flash' || G.dice[gIdxs[li]].state === 'selected');
  if (allHeld) score += flashValue * 10;

  // Individual die scoring (5 = 5 pts, 10 = 10 pts, sun = 10 pts)
  gIdxs.forEach((gi, li) => {
    const d = G.dice[gi];
    if (d.state !== 'selected') return;
    // Skip if this die is already counted inside an intact flash
    if (flashIndices.includes(li) && allHeld) return;
    if (d.value === 'sun') score += 10;
    if (d.value === 5)    score += 5;
    if (d.value === 10)   score += 10;
  });

  return score;
}

function refreshTurnScore() {
  document.getElementById('turn-score-val').textContent = G.committedScore + calcCurrentRollScore();
}

// ============================================================
// TURN START
// ============================================================
function startTurn() {
  const player = G.players[G.currentPlayerIndex];
  refreshDiceFaces(player.diceSet || 'cosmic');
  G.committedScore = 0;
  G.phase = 'preroll';
  G.evalResult = null;
  G.lastRollIndices = [];
  G.mustClearFlash = false;
  G.clearingFlashValue = null;
  G.mustRollAll = false;

  G.dice.forEach(d => { d.value = null; d.state = 'unrolled'; });

  renderScoreBoard();
  renderCurrentPlayer();
  renderDice();
  refreshTurnScore();
  updateLastLicksBanner();
  updateButtons();

  const msg = G.lastLicksActive
    ? `⚡ LAST LICKS — ${player.name}'s final turn!`
    : `${player.name}'s turn!`;
  const sub = (G.opts.entryRequired && player.score === 0)
    ? `Must score ${ENTRY_SCORE}+ pts to get on the board.`
    : `Total: ${player.score}`;
  setMessage(msg, sub);
  saveGameState();
}

// ============================================================
// ROLLING
// ============================================================
function onRoll() {
  if (G.phase !== 'preroll' && G.phase !== 'choosing') return;

  // Determine if we must roll all 5:
  //   - sampler / all-five-required forced it (mustRollAll), OR
  //   - there are simply no rolled dice left to pick from (all scored)
  // allFiveRequired only controls whether banking is *blocked*, not whether rolling is possible.
  const diceToRollCount = G.dice.filter(d => d.state === 'rolled').length;
  const rollAll = G.mustRollAll || (G.phase === 'choosing' && diceToRollCount === 0);

  // Must keep at least one scoring die before rolling again (not applicable to forced roll-all)
  if (G.phase === 'choosing' && !rollAll) {
    const hasSelection = G.dice.some(d => d.state === 'selected' || d.state === 'flash');
    if (!hasSelection) {
      setMessage('Must keep at least one scoring die!', 'Tap a die to select it before rolling.');
      return; // G.mustRollAll intentionally not cleared — still valid for next attempt
    }
  }

  G.mustRollAll = false; // consume the flag only after passing all guards

  // ── Commit currently selected dice ──
  if (G.phase === 'choosing') {
    G.committedScore += calcCurrentRollScore();
    G.lastRollIndices.forEach(gi => {
      const d = G.dice[gi];
      if (d.state === 'selected' || d.state === 'flash') {
        d.state = 'committed';
      }
    });
    G.mustClearFlash = false;
    G.evalResult = null;
  }

  G.phase = 'rolling';

  // ── Determine which dice to roll ──
  let rollIndices;
  if (rollAll) {
    // Full re-roll: reset all dice; also clear any carry-over flash-clearing value
    G.dice.forEach(d => { d.value = null; d.state = 'unrolled'; });
    G.clearingFlashValue = null;
    rollIndices = [0, 1, 2, 3, 4];
  } else {
    // Roll only non-committed dice (state 'rolled' = available to re-roll)
    rollIndices = G.dice.map((d, i) => d.state !== 'committed' ? i : null).filter(i => i !== null);
  }

  // ── Animate ──

  // Pre-generate all final values now so game logic is unaffected by timing
  const prerolledValues = rollIndices.map(gi => rollDie(G.dice[gi].isBlack));

  // Mark rolling state (renderDice reads this)
  rollIndices.forEach(gi => {
    G.dice[gi].value = null;
    G.dice[gi].state = 'rolling';
  });

  renderDice();     // resets el.className — must run BEFORE we add .rolling
  updateButtons();

  // Start tumble animation on each die (add .rolling AFTER renderDice so it sticks).
  // Each die gets a random variant and staggered start.
  rollIndices.forEach((gi, li) => {
    const el = document.getElementById(`die-${gi}`);
    if (!el) return;
    const cube = el.querySelector('.die-cube');
    el.classList.add('rolling');
    if (cube) {
      const variant  = TUMBLE_VARIANTS[Math.floor(Math.random() * TUMBLE_VARIANTS.length)];
      const duration = TUMBLE_MS + Math.floor(Math.random() * 80);
      cube.style.animationName           = variant;
      cube.style.animationDuration       = `${duration}ms`;
      cube.style.animationDelay          = `${li * STAGGER_MS}ms`;
      cube.style.animationTimingFunction = 'cubic-bezier(0.4, 0, 0.6, 1)';
      cube.style.animationFillMode       = 'none';
    }
  });

  // Staggered reveal — each die stops tumbling and snaps to its correct face
  rollIndices.forEach((gi, li) => {
    setTimeout(() => {
      const el = document.getElementById(`die-${gi}`);
      if (!el) return;
      const cube = el.querySelector('.die-cube');
      // Stop animation (cube returns to CSS-defined transform = identity)
      el.classList.remove('rolling');
      if (cube) {
        cube.style.animationName = '';
        cube.style.animationDuration = '';
        cube.style.animationDelay = '';
        cube.style.animationTimingFunction = '';
        cube.style.animationFillMode = '';
        // Add show class — the CSS transition on .die-cube smoothly rotates to the correct face
        cube.classList.add(`show-${prerolledValues[li]}`);
      }
    }, li * STAGGER_MS + TUMBLE_MS);
  });

  // Resolve after last die reveals + transition settles
  const lastRevealAt = (rollIndices.length - 1) * STAGGER_MS + TUMBLE_MS;
  setTimeout(() => {
    resolveRoll(rollIndices, prerolledValues);
  }, lastRevealAt + REVEAL_TRANSITION_MS + 30);
}

/**
 * Pure function: given an evaluateDice result, opts, and current dice,
 * returns the new state flags and per-die state strings for the rolled indices.
 * @param {object} er        - result of evaluateDice()
 * @param {object} opts      - G.opts
 * @param {number[]} rollIndices - global die indices that were just rolled
 * @param {object[]} dice    - full G.dice array (read-only, used for allUsed check)
 * @returns {{ mustClearFlash, clearingFlashValue, mustRollAll, diceStates }}
 */
function applyRollRules(er, opts, rollIndices, dice) {
  // Per-die state for this roll (indexed by local roll position)
  const diceStates = rollIndices.map((gi, li) => {
    if (!er.canScore[li])            return 'rolled';    // non-scoring
    if (er.flashIndices.includes(li))
      return opts.flashOptional ? 'selected' : 'flash'; // flash die
    return 'selected';                                   // individual scorer
  });

  // Flash clearing rule
  let mustClearFlash   = false;
  let clearingFlashValue = null;
  if (er.flashValue !== null && opts.clearFlashRequired && !opts.flashOptional) {
    mustClearFlash     = true;
    clearingFlashValue = er.flashValue;
  }

  // All-five-scored rule: check after applying new states
  const afterStates = dice.map((d, gi) => {
    const li = rollIndices.indexOf(gi);
    return li !== -1 ? diceStates[li] : d.state;
  });
  const allUsed = afterStates.every(s => s === 'committed' || s === 'selected' || s === 'flash');
  const mustRollAll = allUsed && opts.allFiveRequired;

  return { mustClearFlash, clearingFlashValue, mustRollAll, diceStates, allUsed };
}

function resolveRoll(rollIndices, prerolledValues) {
  const clearingValue = G.clearingFlashValue;
  G.clearingFlashValue = null;
  G.lastRollIndices = rollIndices;

  // Apply final values (pre-generated during animation, or roll fresh if not provided)
  rollIndices.forEach((gi, li) => {
    G.dice[gi].value = prerolledValues ? prerolledValues[li] : rollDie(G.dice[gi].isBlack);
    G.dice[gi].state = 'rolled';
  });

  const rolledDice = rollIndices.map(i => G.dice[i]);
  const er = evaluateDice(rolledDice, clearingValue);
  G.evalResult = er;

  // ── Handle special results ──
  if (er.type === 'freight') { handleFreight(er); return; }
  if (er.type === 'sampler') { handleSampler();   return; }
  if (er.type === 'wimpout') { handleWimpout();   return; }

  // ── Normal: mark dice states ──
  G.phase = 'choosing';

  const rules = applyRollRules(er, G.opts, rollIndices, G.dice);
  rollIndices.forEach((gi, li) => {
    G.dice[gi].state = rules.diceStates[li];
  });
  G.mustClearFlash   = rules.mustClearFlash;
  G.clearingFlashValue = rules.clearingFlashValue;
  G.mustRollAll      = rules.mustRollAll;

  refreshTurnScore();
  renderDice();
  updateButtons();

  if (er.flashValue !== null) {
    const flashSub = G.opts.flashOptional
      ? 'Flash is optional — keep it or select individual dice.'
      : (G.mustRollAll ? 'All dice used — must roll all 5 to clear!' : 'Must roll remaining dice to clear.');
    setMessage(`Flash of ${er.flashValue}s! (+${er.flashValue * 10} pts)`, flashSub);
    setMessageClass('msg-flash');
  } else if (rules.allUsed) {
    if (G.opts.allFiveRequired) {
      setMessage('All dice scored! Must roll all 5 again.', 'Banking disabled until you roll.');
    } else {
      setMessage('All dice scored! Roll all 5 to chain, or bank.', 'Roll All 5 to keep building your score.');
    }
    setMessageClass('msg-sampler');
  } else {
    const hasToggleable = rollIndices.some(gi => {
      const li = rollIndices.indexOf(gi);
      return er.canScore[li] && !er.flashIndices.includes(li);
    });
    setMessage('Scoring dice selected', hasToggleable ? 'Tap 5s or 10s to toggle · Gold = locked in · Cyan = flash' : 'Roll remaining or Bank.');
  }
  saveGameState();
}

// ============================================================
// SPECIAL OUTCOMES
// ============================================================
function handleFreight(er) {
  G.phase = 'endturn';
  G.lastRollIndices.forEach(gi => { G.dice[gi].state = 'selected'; });
  renderDice();

  if (er.sub === 'win') {
    // Don't pre-add to committedScore — bankAndFinish uses calcCurrentRollScore()
    refreshTurnScore();
    setMessage('🚂 FREIGHT TRAIN — FIVE 6s!', 'Instant Win!');
    setMessageClass('msg-freight');
    setTimeout(() => bankAndFinish(true), 1400);
    return;
  }
  if (er.sub === 'supernova') {
    G.players[G.currentPlayerIndex].eliminated = true;
    renderScoreBoard();
    setMessage('💥 SUPERNOVA! Five 10s!', `${G.players[G.currentPlayerIndex].name} is eliminated!`);
    setMessageClass('msg-wimpout');
    showNextBtn();
    saveGameState();
    return;
  }
  // Normal freight train — don't pre-add; bankAndFinish computes total
  refreshTurnScore();
  if (G.opts.suicidePact) {
    showFreightPactChoice(er);
    return;
  }
  setMessage(`🚂 FREIGHT TRAIN! Five ${er.value}s — ${er.score} pts`, 'Auto-banking…');
  setMessageClass('msg-freight');
  setTimeout(() => bankAndFinish(false), 1400);
}

function showFreightPactChoice(er) {
  G.phase = 'pact-freight-choice';
  setMessage(
    `🚂 FREIGHT TRAIN! Five ${er.value}s — ${er.score} pts`,
    'Invoke the Suicide Pact, or take the freight train?'
  );
  setMessageClass('msg-freight');
  const btnA = document.getElementById('pact-a-btn');
  const btnB = document.getElementById('pact-b-btn');
  btnA.textContent = 'TAKE FREIGHT';
  btnA.onclick = () => { hidePactRow(); bankAndFinish(false); };
  btnB.textContent = 'INVOKE PACT';
  btnB.onclick = () => { hidePactRow(); invokeSuicidePact(); };
  document.getElementById('btn-pact-row').hidden = false;
  saveGameState();
}

function invokeSuicidePact() {
  const flashValue = WHITE_FACES[Math.floor(Math.random() * WHITE_FACES.length)];
  const rollIdxs = G.lastRollIndices;
  for (let i = 0; i < 3; i++) {
    G.dice[rollIdxs[i]].value = flashValue;
    G.dice[rollIdxs[i]].state = 'committed';
  }
  for (let i = 3; i < rollIdxs.length; i++) {
    G.dice[rollIdxs[i]].state = 'rolled';
  }
  G.committedScore += flashValue * 10;
  G.players[G.currentPlayerIndex].suicidePactToken = true;
  G.phase = 'choosing';
  G.evalResult = null;
  G.mustClearFlash = false;
  G.mustRollAll = false;
  refreshTurnScore();
  renderDice();
  renderScoreBoard();
  updateButtons();
  setMessage(
    `🤝 SUICIDE PACT! Flash of ${flashValue}s (+${flashValue * 10} pts)`,
    'Pact token earned — roll remaining dice or bank.'
  );
  setMessageClass('msg-flash');
  saveGameState();
}

function handleSampler() {
  // 25 pts committed when player presses Roll (onRoll calls calcCurrentRollScore)
  G.mustRollAll = true;
  G.mustClearFlash = false;
  G.lastRollIndices.forEach(gi => { G.dice[gi].state = 'selected'; });
  G.phase = 'choosing'; // allows Roll button
  refreshTurnScore();
  renderDice();
  updateButtons();
  setMessage('🌈 SAMPLER! +25 pts', 'All different — must roll all 5 again!');
  setMessageClass('msg-sampler');
  saveGameState();
}

function handleWimpout() {
  G.lastRollIndices.forEach(gi => { G.dice[gi].state = 'rolled'; });
  renderDice();
  const lost = G.committedScore;
  setMessage('💨 WIMPOUT!', lost > 0 ? `Lost ${lost} turn pts — pass the dice.` : 'No points scored — pass the dice.');
  setMessageClass('msg-wimpout');
  if (G.players[G.currentPlayerIndex].suicidePactToken) {
    showWimpoutPactChoice();
    return;
  }
  G.phase = 'endturn';
  showNextBtn();
  saveGameState();
}

function showWimpoutPactChoice() {
  G.phase = 'pact-wimpout-choice';
  const lost = G.committedScore;
  setMessage(
    '💨 WIMPOUT!',
    `Invoke the Pact to escape (lose ${lost} pts), or accept the wimpout?`
  );
  const btnA = document.getElementById('pact-a-btn');
  const btnB = document.getElementById('pact-b-btn');
  btnA.textContent = 'ACCEPT WIMPOUT';
  btnA.onclick = () => {
    hidePactRow();
    G.phase = 'endturn';
    showNextBtn();
    saveGameState();
  };
  btnB.textContent = 'INVOKE PACT';
  btnB.onclick = () => { hidePactRow(); invokeWimpoutPact(); };
  document.getElementById('btn-pact-row').hidden = false;
  saveGameState();
}

function invokeWimpoutPact() {
  G.players[G.currentPlayerIndex].suicidePactToken = false;
  const rollIdxs = G.lastRollIndices;
  const flashCount = Math.min(3, rollIdxs.length);
  for (let i = 0; i < flashCount; i++) {
    G.dice[rollIdxs[i]].value = 10;
    G.dice[rollIdxs[i]].state = 'committed';
  }
  for (let i = flashCount; i < rollIdxs.length; i++) {
    G.dice[rollIdxs[i]].state = 'rolled';
  }
  G.committedScore += 100;
  G.phase = 'choosing';
  G.evalResult = null;
  G.mustClearFlash = false;
  G.mustRollAll = false;
  refreshTurnScore();
  renderDice();
  renderScoreBoard();
  updateButtons();
  setMessage(
    '🤝 PACT INVOKED! Flash of 10s (+100 pts)',
    'Points saved — roll remaining dice or bank.'
  );
  setMessageClass('msg-flash');
  saveGameState();
}

function hidePactRow() {
  document.getElementById('btn-pact-row').hidden = true;
}

// ============================================================
// BANKING
// ============================================================
function onBank() {
  if (G.phase !== 'choosing') return;

  const rollScore = calcCurrentRollScore();
  const total = G.committedScore + rollScore;
  const player = G.players[G.currentPlayerIndex];

  const toRollNow = G.dice.filter(d => d.state === 'rolled').length;
  if (G.mustClearFlash) {
    setMessage('Must roll to clear the flash first!', '');
    return;
  }
  if (G.mustRollAll || (G.opts.allFiveRequired && toRollNow === 0)) {
    setMessage('Must roll all 5 dice first!', '');
    return;
  }
  if (G.opts.entryRequired && player.score === 0 && total < ENTRY_SCORE) {
    setMessage(`Need ${ENTRY_SCORE} pts to get on the board!`, `You have ${total} — keep rolling!`);
    return;
  }
  if (rollScore === 0) {
    setMessage('Select at least one scoring die first!', '');
    return;
  }

  bankAndFinish(false);
}

function bankAndFinish(instantWin) {
  const rollScore = calcCurrentRollScore();
  const total = G.committedScore + rollScore;
  const player = G.players[G.currentPlayerIndex];

  player.score += total;
  G.phase = 'endturn';
  renderScoreBoard();
  document.getElementById('turn-score-val').textContent = total;

  const hitTarget = player.score >= WINNING_SCORE || instantWin;

  if (hitTarget && !G.lastLicksActive) {
    G.lastLicksActive = true;
    G.lastLicksInitiator = G.currentPlayerIndex;
    G.lastLicksDone.clear();
    setMessage(`${player.name} reaches ${player.score} pts!`, '⚡ LAST LICKS — everyone else gets one final turn!');
    setMessageClass('msg-win');
  } else if (hitTarget && G.lastLicksActive) {
    // Another player also hit the target during last licks — just note it
    setMessage(`${player.name} scores ${player.score} pts!`, 'High score wins after all last licks!');
  } else {
    setMessage(`${player.name} banks ${total} pts!`, `Total: ${player.score}`);
  }

  showNextBtn();
  saveGameState();
}

// ============================================================
// NEXT PLAYER / GAME OVER
// ============================================================
function onNextPlayer() {
  document.getElementById('next-btn').hidden = true;
  if (checkGameOver()) return;
  advanceToNextPlayer();
}

function advanceToNextPlayer() {
  const n = G.players.length;
  let idx = G.currentPlayerIndex;
  for (let i = 0; i < n; i++) {
    idx = (idx + 1) % n;
    if (!G.players[idx].eliminated) break;
  }
  G.currentPlayerIndex = idx;
  if (G.lastLicksActive) G.lastLicksDone.add(idx);
  startTurn();
}

function checkGameOver() {
  const active = G.players.filter(p => !p.eliminated);
  if (active.length <= 1) { showGameOver(); return true; }

  if (G.lastLicksActive) {
    // All non-initiator active players must have had their lick
    const initiator = G.lastLicksInitiator;
    const needLick = G.players.filter((p, i) => i !== initiator && !p.eliminated);
    const allDone = needLick.every(p => G.lastLicksDone.has(G.players.indexOf(p)));
    if (allDone) { showGameOver(); return true; }
  }

  return false;
}

function showGameOver() {
  G.phase = 'gameover';
  clearGameState();
  document.getElementById('game-screen').hidden = true;
  document.getElementById('gameover-screen').hidden = false;

  const active = G.players.filter(p => !p.eliminated);
  const winner = active.sort((a, b) => b.score - a.score)[0];

  document.getElementById('winner-name-display').textContent = winner.name;
  document.getElementById('winner-score-display').textContent = `${winner.score} POINTS`;

  const list = document.getElementById('final-score-list');
  list.innerHTML = '';
  [...G.players].sort((a, b) => b.score - a.score).forEach(p => {
    const row = document.createElement('div');
    row.className = 'final-score-row' + (p === winner ? ' winner-row' : '');
    row.innerHTML = `
      <span class="final-score-row-name">${p.eliminated ? '💥 ' : ''}${p.name}</span>
      <span class="final-score-row-val">${p.score}</span>`;
    list.appendChild(row);
  });
}

// ============================================================
// DIE CLICK (toggle individual 5/10 dice)
// ============================================================
function onDieClick(globalIdx) {
  if (G.phase !== 'choosing') return;
  const d = G.dice[globalIdx];
  const li = G.lastRollIndices.indexOf(globalIdx);
  if (li === -1) return; // not from current roll
  if (d.state === 'flash' || d.state === 'committed') return; // locked
  if (!G.evalResult || !G.evalResult.canScore[li]) return; // not scorable
  if (G.evalResult.flashIndices.includes(li) && !G.opts.flashOptional) return; // part of flash, locked

  d.state = d.state === 'selected' ? 'rolled' : 'selected';
  refreshTurnScore();
  renderDice();
  updateButtons();
  saveGameState();
}

// ============================================================
// RENDERING
// ============================================================
function renderDice() {
  G.dice.forEach((d, i) => {
    const el = document.getElementById(`die-${i}`);
    if (!el) return;
    const cube = el.querySelector('.die-cube');

    el.className = 'die' + (d.isBlack ? ' black-die' : '');
    el.onclick = null;

    // Update which face is showing — suppress transition to avoid re-spinning
    if (cube) {
      cube.classList.add('no-transition');
      const prev = [...cube.classList].find(c => c.startsWith('show-'));
      if (prev) cube.classList.remove(prev);
      if (d.value !== null) cube.classList.add(`show-${d.value}`);
      requestAnimationFrame(() => cube.classList.remove('no-transition'));
    }

    if (d.state === 'unrolled') {
      el.classList.add('unrolled');
      return;
    }
    if (d.state === 'rolling') {
      // .rolling class + animation are added by onRoll() AFTER renderDice.
      // Just clear the old show class so the tumble starts from identity.
      return;
    }

    switch (d.state) {
      case 'committed':
        el.classList.add('committed');
        break;
      case 'flash':
        el.classList.add('flash-die');
        break;
      case 'selected':
        el.classList.add('held');
        // Allow toggling if it's from current roll and not flash
        if (G.lastRollIndices.includes(i)) {
          el.onclick = () => onDieClick(i);
        }
        break;
      case 'rolled':
        // Check if it's scorable (green glow) or non-scoring (dim)
        if (G.lastRollIndices.includes(i)) {
          const li = G.lastRollIndices.indexOf(i);
          if (G.evalResult && G.evalResult.canScore[li]) {
            el.classList.add('scorable');
            el.onclick = () => onDieClick(i);
          } else {
            el.classList.add('non-scoring');
          }
        }
        break;
    }
  });

  // Dice hint
  const hint = document.getElementById('dice-hint');
  if (G.phase === 'choosing') {
    const hasToggle = G.lastRollIndices.some(gi => {
      const d = G.dice[gi];
      const li = G.lastRollIndices.indexOf(gi);
      return d.state === 'selected' && G.evalResult && !G.evalResult.flashIndices.includes(li);
    });
    hint.textContent = hasToggle ? 'Tap gold dice to un-select · Cyan = flash (locked) · Gold = selected' : '';
  } else {
    hint.textContent = '';
  }
}

function renderScoreBoard() {
  const list = document.getElementById('score-list');
  list.innerHTML = '';
  G.players.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = 'score-chip'
      + (i === G.currentPlayerIndex ? ' active-player' : '')
      + (p.eliminated ? ' eliminated' : '');
    const tokenBadge = p.suicidePactToken ? ' 🤝' : '';
    chip.innerHTML = `
      <span class="score-chip-name">${p.eliminated ? '💥' : ''}${p.name}${tokenBadge}</span>
      <span class="score-chip-value">${p.score}</span>`;
    list.appendChild(chip);
  });
}

function renderCurrentPlayer() {
  document.getElementById('banner-name').textContent = G.players[G.currentPlayerIndex].name;
}

function updateLastLicksBanner() {
  document.getElementById('last-licks-banner')?.remove();
  if (G.lastLicksActive) {
    const b = document.createElement('div');
    b.id = 'last-licks-banner';
    b.className = 'last-licks-banner';
    b.textContent = '⚡ LAST LICKS ⚡';
    const sb = document.getElementById('score-board');
    sb.parentNode.insertBefore(b, sb);
  }
}

function updateButtons() {
  const rollBtn = document.getElementById('roll-btn');
  const bankBtn = document.getElementById('bank-btn');

  if (G.phase === 'preroll') {
    rollBtn.disabled = false;
    rollBtn.textContent = 'ROLL';
    bankBtn.disabled = true;
    return;
  }

  if (G.phase === 'rolling' || G.phase === 'endturn' ||
      G.phase === 'pact-freight-choice' || G.phase === 'pact-wimpout-choice') {
    rollBtn.disabled = true;
    bankBtn.disabled = true;
    return;
  }

  if (G.phase === 'choosing') {
    // 'rolled' state = dice from current roll not yet selected (available to re-roll)
    const toRoll = G.dice.filter(d => d.state === 'rolled').length;
    const hasSelection = G.dice.some(d => d.state === 'selected' || d.state === 'flash');
    // All dice are accounted for (nothing left to roll individually)
    const allDiceUsed = toRoll === 0;
    // Whether the bank button must be blocked (allFiveRequired forces another roll)
    const forceRollAll = G.mustRollAll || (G.opts.allFiveRequired && allDiceUsed);

    // Roll button: show ROLL ALL 5 when forced OR when there are simply no individual dice to roll
    if (G.mustRollAll || allDiceUsed) {
      rollBtn.disabled = false;
      rollBtn.textContent = 'ROLL ALL 5';
    } else {
      rollBtn.disabled = !hasSelection;
      rollBtn.textContent = toRoll < 5 ? `ROLL ${toRoll}` : 'ROLL';
    }

    // Bank button — disabled when: must clear flash, forced roll-all, entry not met, or nothing selected
    const rollScore = calcCurrentRollScore();
    const total = G.committedScore + rollScore;
    const player = G.players[G.currentPlayerIndex];
    const entryOk = !G.opts.entryRequired || player.score > 0 || total >= ENTRY_SCORE;
    const canBank = !G.mustClearFlash && !forceRollAll && entryOk && rollScore > 0;
    bankBtn.disabled = !canBank;
  }
}

function showNextBtn() {
  document.getElementById('next-btn').hidden = false;
  document.getElementById('roll-btn').disabled = true;
  document.getElementById('bank-btn').disabled = true;

  const nextIdx = (() => {
    const n = G.players.length;
    let idx = G.currentPlayerIndex;
    for (let i = 0; i < n; i++) {
      idx = (idx + 1) % n;
      if (!G.players[idx].eliminated) return idx;
    }
    return -1;
  })();

  document.getElementById('next-btn').textContent =
    nextIdx !== -1 ? `${G.players[nextIdx].name}'s Turn →` : 'See Results →';
}

function setMessage(main, sub = '') {
  const el = document.getElementById('msg-main');
  el.textContent = main;
  el.className = '';
  document.getElementById('msg-sub').textContent = sub;
  if (G) G.savedMsg = { main, sub, cls: '' };
}

function setMessageClass(cls) {
  const el = document.getElementById('msg-main');
  el.className = cls;
  if (G && G.savedMsg) G.savedMsg.cls = cls;
}

// ============================================================
// THEMING
// ============================================================
// Two separate storage keys so switching presets never overwrites custom colors.
const THEME_PRESET_KEY = 'cosmicWimpoutPreset'; // 'dark' | 'light' | 'custom'
const THEME_CUSTOM_KEY = 'cosmicWimpoutCustom'; // full vars object for custom preset

let activePreset = 'dark'; // in-memory; source of truth for button highlighting

const THEMES = {
  dark: {
    '--bg':            '#07001a',
    '--bg2':           '#0e0030',
    '--bg3':           '#160048',
    '--card':          '#1a0050',
    '--card-border':   '#3a1080',
    '--text':          '#e8d8ff',
    '--text-dim':      '#8866bb',
    '--accent':        '#c060ff',
    '--accent2':       '#7020e0',
    '--gold':          '#ffd060',
    '--gold2':         '#ffaa00',
    '--cyan':          '#40e0ff',
    '--green':         '#40ff90',
    '--red':           '#ff4060',
    '--orange':        '#ff8030',
    '--white-die-bg':  '#f0e8ff',
    '--white-die-text':'#200060',
    '--black-die-bg':  '#1a0040',
    '--black-die-text':'#e040ff',
  },
  light: {
    '--bg':            '#f2eeff',
    '--bg2':           '#e8e0ff',
    '--bg3':           '#ddd4fa',
    '--card':          '#ffffff',
    '--card-border':   '#c4a0f0',
    '--text':          '#1a0040',
    '--text-dim':      '#6040a0',
    '--accent':        '#7020e0',
    '--accent2':       '#4000b0',
    '--gold':          '#b06000',
    '--gold2':         '#d08000',
    '--cyan':          '#0080b0',
    '--green':         '#007830',
    '--red':           '#cc0030',
    '--orange':        '#c04000',
    '--white-die-bg':  '#ffffff',
    '--white-die-text':'#200060',
    '--black-die-bg':  '#1a0040',
    '--black-die-text':'#9030e0',
  },
};

const COLOR_GROUPS = [
  {
    label: 'BACKGROUNDS',
    vars: [
      { key: '--bg',          name: 'Background' },
      { key: '--bg2',         name: 'Surface' },
      { key: '--bg3',         name: 'Panel' },
      { key: '--card',        name: 'Card' },
      { key: '--card-border', name: 'Border' },
    ],
  },
  {
    label: 'TEXT & ACCENT',
    vars: [
      { key: '--text',     name: 'Text' },
      { key: '--text-dim', name: 'Dim Text' },
      { key: '--accent',   name: 'Accent' },
      { key: '--accent2',  name: 'Accent 2' },
    ],
  },
  {
    label: 'HIGHLIGHTS',
    vars: [
      { key: '--gold',   name: 'Gold' },
      { key: '--gold2',  name: 'Gold 2' },
      { key: '--cyan',   name: 'Flash' },
      { key: '--green',  name: 'Score' },
      { key: '--red',    name: 'Danger' },
      { key: '--orange', name: 'Orange' },
    ],
  },
  {
    label: 'DICE',
    vars: [
      { key: '--white-die-bg',   name: 'Die Face' },
      { key: '--white-die-text', name: 'Die Symbol' },
      { key: '--black-die-bg',   name: 'Dark Die Face' },
      { key: '--black-die-text', name: 'Dark Die Symbol' },
    ],
  },
];

function applyTheme(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  // Light theme hides the space-stars ::before pseudo-element
  document.body.classList.toggle('theme-light', vars['--bg'] === THEMES.light['--bg']);
}

function savePreset(name) {
  activePreset = name;
  try { localStorage.setItem(THEME_PRESET_KEY, name); } catch (_) {}
}

function saveCustomTheme(vars) {
  try { localStorage.setItem(THEME_CUSTOM_KEY, JSON.stringify(vars)); } catch (_) {}
}

function loadCustomTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_CUSTOM_KEY));
    if (saved && typeof saved === 'object') return saved;
  } catch (_) {}
  return null;
}

function loadSavedTheme() {
  try {
    const preset = localStorage.getItem(THEME_PRESET_KEY) || 'dark';
    activePreset = preset;
    if (preset === 'custom') {
      const custom = loadCustomTheme();
      if (custom) { applyTheme(custom); return; }
    }
    applyTheme(THEMES[preset] || THEMES.dark);
  } catch (_) {
    applyTheme(THEMES.dark);
  }
}

function currentThemeVars() {
  const style = getComputedStyle(document.documentElement);
  const result = {};
  COLOR_GROUPS.forEach(g => g.vars.forEach(({ key }) => {
    result[key] = document.documentElement.style.getPropertyValue(key).trim()
      || style.getPropertyValue(key).trim();
  }));
  return result;
}

function updatePresetButtons() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === activePreset);
  });
}

function resetCustomTheme() {
  applyTheme(THEMES.dark);
  saveCustomTheme({ ...THEMES.dark });
  savePreset('custom');
  buildThemeModal();
}

function buildThemeModal() {
  const container = document.getElementById('theme-colors');
  container.innerHTML = '';
  const vars = currentThemeVars();

  // Reset button — always visible so user can start fresh from dark defaults
  const resetBtn = document.createElement('button');
  resetBtn.className = 'theme-reset-btn';
  resetBtn.textContent = 'Reset custom to dark defaults';
  resetBtn.addEventListener('click', resetCustomTheme);
  container.appendChild(resetBtn);

  COLOR_GROUPS.forEach(group => {
    const lbl = document.createElement('div');
    lbl.className = 'color-group-label';
    lbl.textContent = group.label;
    container.appendChild(lbl);

    group.vars.forEach(({ key, name }) => {
      const val = vars[key] || '#888888';

      const row = document.createElement('label');
      row.className = 'color-row';

      const namSpan = document.createElement('span');
      namSpan.className = 'color-name';
      namSpan.textContent = name;

      const wrap = document.createElement('div');
      wrap.className = 'color-swatch-wrap';

      const preview = document.createElement('div');
      preview.className = 'color-preview';
      preview.style.background = val;

      const input = document.createElement('input');
      input.type = 'color';
      input.value = val;
      input.dataset.varKey = key;

      input.addEventListener('input', () => {
        preview.style.background = input.value;
        document.documentElement.style.setProperty(key, input.value);
        if (key === '--bg') {
          document.body.classList.toggle('theme-light', input.value === THEMES.light['--bg']);
        }
        // Any individual change → save to custom slot and activate Custom preset
        saveCustomTheme(currentThemeVars());
        savePreset('custom');
        updatePresetButtons();
      });

      wrap.appendChild(preview);
      wrap.appendChild(input);
      row.appendChild(namSpan);
      row.appendChild(wrap);
      container.appendChild(row);
    });
  });

  updatePresetButtons();
}

function openThemeModal() {
  buildThemeModal();
  document.getElementById('theme-modal').hidden = false;
}

function closeThemeModal() {
  document.getElementById('theme-modal').hidden = true;
}

// ── Test exports (no-op in browser; Jest picks these up via CommonJS) ──
/* istanbul ignore next */
if (typeof module !== 'undefined') {
  module.exports = { evaluateDice, applyRollRules, createGame,
                     getDiceThemePreview, renderDiceThemeBtn,
                     closeDiceThemePicker, showDiceThemePicker };
}
