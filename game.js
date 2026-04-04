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

  // ── 2: Two galaxy-arm swirls ──
  2: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none">
    <path stroke="currentColor" stroke-width="2.8" stroke-linecap="round"
          d="M8,12 C8,4 16,2 20,8 C24,14 22,22 16,22"/>
    <path stroke="currentColor" stroke-width="2.8" stroke-linecap="round"
          d="M32,28 C32,36 24,38 20,32 C16,26 18,18 24,18"/>
  </svg>`,

  // ── 3: Three upward triangles ──
  3: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <polygon fill="currentColor" points="20,4 28,17 12,17"/>
    <polygon fill="currentColor" points="9,36 17,23 1,23"/>
    <polygon fill="currentColor" points="31,36 39,23 23,23"/>
  </svg>`,

  // ── 4: Four lightning bolts (2×2 grid) ──
  4: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <polyline fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="13,3 8,11 13,11 8,19"/>
    <polyline fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="32,3 27,11 32,11 27,19"/>
    <polyline fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="13,21 8,29 13,29 8,37"/>
    <polyline fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="32,21 27,29 32,29 27,37"/>
  </svg>`,

  // ── 6: Six 4-pointed stars (2×3 grid) ──
  6: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <polygon fill="currentColor" points="11,2.5 12.6,6.4 16.5,8 12.6,9.6 11,13.5 9.4,9.6 5.5,8 9.4,6.4"/>
    <polygon fill="currentColor" points="29,2.5 30.6,6.4 34.5,8 30.6,9.6 29,13.5 27.4,9.6 23.5,8 27.4,6.4"/>
    <polygon fill="currentColor" points="11,14.5 12.6,18.4 16.5,20 12.6,21.6 11,25.5 9.4,21.6 5.5,20 9.4,18.4"/>
    <polygon fill="currentColor" points="29,14.5 30.6,18.4 34.5,20 30.6,21.6 29,25.5 27.4,21.6 23.5,20 27.4,18.4"/>
    <polygon fill="currentColor" points="11,26.5 12.6,30.4 16.5,32 12.6,33.6 11,37.5 9.4,33.6 5.5,32 9.4,30.4"/>
    <polygon fill="currentColor" points="29,26.5 30.6,30.4 34.5,32 30.6,33.6 29,37.5 27.4,33.6 23.5,32 27.4,30.4"/>
  </svg>`,

  // ── Flaming Sun: 8 organic flame rays + layered sun body ──
  sun: `<svg viewBox="0 0 40 40" width="100%" height="100%">
    <g transform="translate(20,20)">
      <path fill="#ff8c00" d="M-3,-8 C-5,-13 -1,-19 0,-19 C1,-19 5,-13 3,-8 Z"/>
      <path fill="#ff8c00" d="M-3,-8 C-5,-13 -1,-19 0,-19 C1,-19 5,-13 3,-8 Z" transform="rotate(45)"/>
      <path fill="#ff8c00" d="M-3,-8 C-5,-13 -1,-19 0,-19 C1,-19 5,-13 3,-8 Z" transform="rotate(90)"/>
      <path fill="#ff8c00" d="M-3,-8 C-5,-13 -1,-19 0,-19 C1,-19 5,-13 3,-8 Z" transform="rotate(135)"/>
      <path fill="#ff8c00" d="M-3,-8 C-5,-13 -1,-19 0,-19 C1,-19 5,-13 3,-8 Z" transform="rotate(180)"/>
      <path fill="#ff8c00" d="M-3,-8 C-5,-13 -1,-19 0,-19 C1,-19 5,-13 3,-8 Z" transform="rotate(225)"/>
      <path fill="#ff8c00" d="M-3,-8 C-5,-13 -1,-19 0,-19 C1,-19 5,-13 3,-8 Z" transform="rotate(270)"/>
      <path fill="#ff8c00" d="M-3,-8 C-5,-13 -1,-19 0,-19 C1,-19 5,-13 3,-8 Z" transform="rotate(315)"/>
      <circle r="9"   fill="#ffb300"/>
      <circle r="5.5" fill="#ffe100"/>
      <circle r="2.5" cx="-1.5" cy="-1.5" fill="white" opacity="0.55"/>
    </g>
  </svg>`,
};

function faceSVG(val) {
  if (FACE_SVGS[val]) return FACE_SVGS[val];
  return `<span class="die-num">${val}</span>`;
}

// ============================================================
// FACE MAPPING  (which value lives on each geometric face)
// ============================================================
// Cube face → die value assignment.  show-VALUE CSS classes rotate the cube
// so the matching face points toward the viewer.
const FACE_VALUES_WHITE = { 'face-front': 2, 'face-back': 3, 'face-right': 4, 'face-left': 5, 'face-top': 6, 'face-bottom': 10 };
const FACE_VALUES_BLACK = { 'face-front': 2, 'face-back': 3, 'face-right': 4, 'face-left': 5, 'face-top': 6, 'face-bottom': 'sun' };

/** Stamp SVG content on all 6 faces of every die — called once at startup. */
function initDiceFaces() {
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById(`die-${i}`);
    if (!el) continue;
    const faceMap = i === 4 ? FACE_VALUES_BLACK : FACE_VALUES_WHITE;
    Object.entries(faceMap).forEach(([cls, val]) => {
      const faceEl = el.querySelector(`.${cls}`);
      if (faceEl) faceEl.innerHTML = `<span class="die-face">${faceSVG(val)}</span>`;
    });
  }
}

// ============================================================
// STATE
// ============================================================
let G = null;

// ============================================================
// BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initDiceFaces();
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
    </div>
    <div class="player-field">
      <span class="player-num">2</span>
      <input type="text" class="player-name-input" placeholder="Player 2" maxlength="14" autocomplete="off">
    </div>`;
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
    <button class="remove-player-btn" onclick="removePlayer(this)">✕</button>`;
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
  const opts = {
    entryRequired:      document.getElementById('opt-entry').checked,
    clearFlashRequired: document.getElementById('opt-clear-flash').checked,
    allFiveRequired:    document.getElementById('opt-all-five').checked,
    flashOptional:      document.getElementById('opt-flash-optional').checked,
  };
  G = createGame(names, opts);
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
function createGame(playerNames, opts = {}) {
  return {
    players: playerNames.map(name => ({ name, score: 0, eliminated: false })),
    opts: {
      entryRequired:      opts.entryRequired      !== false,
      clearFlashRequired: opts.clearFlashRequired !== false,
      allFiveRequired:    opts.allFiveRequired    !== false,
      flashOptional:      !!opts.flashOptional,
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
  const canScore = vals.map((v, i) => {
    if (flashIndices.includes(i)) return true;   // part of flash
    if (v === clearingValue) return false;        // forbidden
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
  setMessage(`🚂 FREIGHT TRAIN! Five ${er.value}s — ${er.score} pts`, 'Auto-banking…');
  setMessageClass('msg-freight');
  setTimeout(() => bankAndFinish(false), 1400);
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
  G.phase = 'endturn';
  G.lastRollIndices.forEach(gi => { G.dice[gi].state = 'rolled'; });
  renderDice();
  const lost = G.committedScore;
  setMessage('💨 WIMPOUT!', lost > 0 ? `Lost ${lost} turn pts — pass the dice.` : 'No points scored — pass the dice.');
  setMessageClass('msg-wimpout');
  showNextBtn();
  saveGameState();
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
    chip.innerHTML = `
      <span class="score-chip-name">${p.eliminated ? '💥' : ''}${p.name}</span>
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

  if (G.phase === 'rolling' || G.phase === 'endturn') {
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
  module.exports = { evaluateDice, applyRollRules, createGame };
}
