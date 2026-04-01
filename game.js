'use strict';

// ============================================================
// CONSTANTS
// ============================================================
const WHITE_FACES = [2, 3, 4, 5, 6, 10];
const BLACK_FACES = [2, 3, 4, 5, 6, 'sun'];
const WINNING_SCORE = 500;
const ENTRY_SCORE = 35;
const ROLL_MS = 600;

function faceDisplay(val) {
  return val === 'sun' ? '☀' : String(val);
}

// ============================================================
// STATE
// ============================================================
let G = null;

// ============================================================
// BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-game-btn').addEventListener('click', onStartGame);
  document.getElementById('add-player-btn').addEventListener('click', onAddPlayer);
  document.getElementById('roll-btn').addEventListener('click', onRoll);
  document.getElementById('bank-btn').addEventListener('click', onBank);
  document.getElementById('next-btn').addEventListener('click', onNextPlayer);
  document.getElementById('play-again-btn').addEventListener('click', showSetupScreen);
});

// ============================================================
// SETUP SCREEN
// ============================================================
function showSetupScreen() {
  G = null;
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
    entryRequired:    document.getElementById('opt-entry').checked,
    clearFlashRequired: document.getElementById('opt-clear-flash').checked,
    allFiveRequired:  document.getElementById('opt-all-five').checked,
  };
  G = createGame(names, opts);
  document.getElementById('setup-screen').hidden = true;
  document.getElementById('game-screen').hidden = false;
  document.getElementById('gameover-screen').hidden = true;
  renderScoreBoard();
  startTurn();
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

  // Direct flash: 3+ of same value
  for (const [vStr, cnt] of Object.entries(counts)) {
    const v = Number(vStr);
    if (v === clearingValue) continue;
    if (cnt >= 3) {
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
    if (v === 'sun') return false;                // sun alone = nothing
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

  if (flashValue !== null) {
    const allHeld = flashIndices.every(li => G.dice[gIdxs[li]].state === 'flash' || G.dice[gIdxs[li]].state === 'selected');
    if (allHeld) score += flashValue * 10;
  }

  gIdxs.forEach((gi, li) => {
    if (flashIndices.includes(li)) return;
    const d = G.dice[gi];
    if (d.state !== 'selected') return;
    if (d.value === 5)  score += 5;
    if (d.value === 10) score += 10;
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
}

// ============================================================
// ROLLING
// ============================================================
function onRoll() {
  if (G.phase !== 'preroll' && G.phase !== 'choosing') return;

  // Determine if we must roll all 5 (sampler flag OR all dice accounted for)
  const diceToRollCount = G.dice.filter(d => d.state === 'rolled').length;
  const rollAll = G.mustRollAll || (G.phase === 'choosing' && G.opts.allFiveRequired && diceToRollCount === 0);
  G.mustRollAll = false;

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
    // Full re-roll: reset all dice
    G.dice.forEach(d => { d.value = null; d.state = 'unrolled'; });
    rollIndices = [0, 1, 2, 3, 4];
  } else {
    // Roll only non-committed dice (state 'rolled' = available to re-roll)
    rollIndices = G.dice.map((d, i) => d.state !== 'committed' ? i : null).filter(i => i !== null);
  }

  // ── Animate ──
  rollIndices.forEach(i => {
    const el = document.getElementById(`die-${i}`);
    if (el) {
      G.dice[i].value = null;
      G.dice[i].state = 'rolling';
      el.classList.add('rolling');
    }
  });
  renderDice();
  updateButtons();

  setTimeout(() => {
    rollIndices.forEach(i => {
      document.getElementById(`die-${i}`)?.classList.remove('rolling');
    });
    resolveRoll(rollIndices);
  }, ROLL_MS);
}

function resolveRoll(rollIndices) {
  const clearingValue = G.clearingFlashValue;
  G.clearingFlashValue = null;
  G.lastRollIndices = rollIndices;

  // Roll the dice
  rollIndices.forEach(i => {
    G.dice[i].value = rollDie(G.dice[i].isBlack);
    G.dice[i].state = 'rolled';
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

  rollIndices.forEach((gi, li) => {
    if (!er.canScore[li]) {
      G.dice[gi].state = 'rolled'; // non-scoring, stays as rolled (dim in render)
    } else if (er.flashIndices.includes(li)) {
      G.dice[gi].state = 'flash'; // flash die (auto-selected, locked)
    } else {
      G.dice[gi].state = 'selected'; // individual scorer, auto-selected (can toggle)
    }
  });

  // Flash requires clearing roll before banking (if rule enabled)
  if (er.flashValue !== null && G.opts.clearFlashRequired) {
    G.mustClearFlash = true;
    G.clearingFlashValue = er.flashValue;
  }

  // Check if all 5 dice are now accounted for (committed + selected/flash)
  const allUsed = G.dice.every(d => d.state === 'committed' || d.state === 'selected' || d.state === 'flash');
  if (allUsed && G.opts.allFiveRequired) {
    G.mustRollAll = true;
  }

  refreshTurnScore();
  renderDice();
  updateButtons();

  if (er.flashValue !== null) {
    setMessage(`Flash of ${er.flashValue}s! (+${er.flashValue * 10} pts)`,
      G.mustRollAll ? 'All dice used — must roll all 5 to clear!' : 'Must roll remaining dice to clear.');
    document.getElementById('msg-main').className = 'msg-flash';
  } else if (allUsed && G.opts.allFiveRequired) {
    setMessage('All dice scored! Must roll all 5 again.', 'Banking disabled until you roll.');
    document.getElementById('msg-main').className = 'msg-sampler';
  } else {
    const hasToggleable = rollIndices.some(gi => {
      const li = rollIndices.indexOf(gi);
      return er.canScore[li] && !er.flashIndices.includes(li);
    });
    setMessage('Scoring dice selected', hasToggleable ? 'Tap 5s or 10s to toggle · Gold = locked in · Cyan = flash' : 'Roll remaining or Bank.');
  }
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
    document.getElementById('msg-main').className = 'msg-freight';
    setTimeout(() => bankAndFinish(true), 1400);
    return;
  }
  if (er.sub === 'supernova') {
    G.players[G.currentPlayerIndex].eliminated = true;
    renderScoreBoard();
    setMessage('💥 SUPERNOVA! Five 10s!', `${G.players[G.currentPlayerIndex].name} is eliminated!`);
    document.getElementById('msg-main').className = 'msg-wimpout';
    showNextBtn();
    return;
  }
  // Normal freight train — don't pre-add; bankAndFinish computes total
  refreshTurnScore();
  setMessage(`🚂 FREIGHT TRAIN! Five ${er.value}s — ${er.score} pts`, 'Auto-banking…');
  document.getElementById('msg-main').className = 'msg-freight';
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
  document.getElementById('msg-main').className = 'msg-sampler';
}

function handleWimpout() {
  G.phase = 'endturn';
  G.lastRollIndices.forEach(gi => { G.dice[gi].state = 'rolled'; });
  renderDice();
  const lost = G.committedScore;
  setMessage('💨 WIMPOUT!', lost > 0 ? `Lost ${lost} turn pts — pass the dice.` : 'No points scored — pass the dice.');
  document.getElementById('msg-main').className = 'msg-wimpout';
  showNextBtn();
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
    document.getElementById('msg-main').className = 'msg-win';
  } else if (hitTarget && G.lastLicksActive) {
    // Another player also hit the target during last licks — just note it
    setMessage(`${player.name} scores ${player.score} pts!`, 'High score wins after all last licks!');
  } else {
    setMessage(`${player.name} banks ${total} pts!`, `Total: ${player.score}`);
  }

  showNextBtn();
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
  if (G.evalResult.flashIndices.includes(li)) return; // part of flash, locked

  d.state = d.state === 'selected' ? 'rolled' : 'selected';
  refreshTurnScore();
  renderDice();
  updateButtons();
}

// ============================================================
// RENDERING
// ============================================================
function renderDice() {
  G.dice.forEach((d, i) => {
    const el = document.getElementById(`die-${i}`);
    if (!el) return;
    const face = el.querySelector('.die-face');

    el.className = 'die' + (d.isBlack ? ' black-die' : '');
    el.onclick = null;

    if (d.state === 'unrolled' || d.state === 'rolling') {
      el.classList.add('unrolled');
      face.textContent = d.state === 'rolling' ? '?' : '';
      return;
    }

    face.textContent = faceDisplay(d.value);

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
    const forceRollAll = G.mustRollAll || (G.opts.allFiveRequired && toRoll === 0);

    // Roll button
    if (forceRollAll) {
      rollBtn.disabled = false;
      rollBtn.textContent = 'ROLL ALL 5';
    } else {
      rollBtn.disabled = false;
      rollBtn.textContent = toRoll < 5 ? `ROLL ${toRoll}` : 'ROLL';
    }

    // Bank button — disabled when: must clear flash, forced roll-all, not enough to get in, or nothing selected
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
}
