'use strict';

const { evaluateDice, applyRollRules, createGame } = require('../game.js');

// Build a minimal dice array from an existing createGame result and set states
function makeDice(stateOverrides = {}) {
  const G = createGame(['A', 'B']);
  G.dice.forEach((d, i) => {
    if (stateOverrides[i]) d.state = stateOverrides[i];
  });
  return G.dice;
}

const d = (value, isBlack = false) => ({ value, isBlack });

// Shorthand: evaluate a set of rolled dice then apply rules
function rollAndApply(rolledDice, opts, committedIndices = []) {
  const G = createGame(['A', 'B'], opts);
  // Mark some dice as committed (simulating previous sub-rolls)
  committedIndices.forEach(i => { G.dice[i].state = 'committed'; });

  const rollIndices = rolledDice.map((_, li) => li + committedIndices.length);
  rollIndices.forEach((gi, li) => {
    G.dice[gi].value = rolledDice[li].value;
    G.dice[gi].isBlack = rolledDice[li].isBlack || false;
    G.dice[gi].state = 'rolled';
  });

  const er = evaluateDice(rolledDice, null);
  return {
    er,
    rules: applyRollRules(er, G.opts, rollIndices, G.dice),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// clearFlashRequired rule
// ─────────────────────────────────────────────────────────────────────────────
describe('applyRollRules – clearFlashRequired', () => {
  test('flash + clearFlashRequired:true → mustClearFlash=true', () => {
    const { rules } = rollAndApply([d(4), d(4), d(4), d(2)], { clearFlashRequired: true });
    expect(rules.mustClearFlash).toBe(true);
    expect(rules.clearingFlashValue).toBe(4);
  });

  test('flash + clearFlashRequired:false → mustClearFlash stays false', () => {
    const { rules } = rollAndApply([d(4), d(4), d(4), d(2)], { clearFlashRequired: false });
    expect(rules.mustClearFlash).toBe(false);
    expect(rules.clearingFlashValue).toBeNull();
  });

  test('no flash → mustClearFlash is false regardless of rule', () => {
    const { rules } = rollAndApply([d(5), d(2), d(3)], { clearFlashRequired: true });
    expect(rules.mustClearFlash).toBe(false);
  });

  test('clearingFlashValue matches the flash face value', () => {
    const { rules } = rollAndApply([d(6), d(6), d(6)], { clearFlashRequired: true });
    expect(rules.clearingFlashValue).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// flashOptional rule
// ─────────────────────────────────────────────────────────────────────────────
describe('applyRollRules – flashOptional', () => {
  test('flash + flashOptional:true → flash dice get "selected" state (not "flash")', () => {
    const { er, rules } = rollAndApply(
      [d(4), d(4), d(4), d(2)],
      { flashOptional: true, clearFlashRequired: true }
    );
    // The flash dice local indices
    er.flashIndices.forEach(li => {
      expect(rules.diceStates[li]).toBe('selected');
    });
  });

  test('flash + flashOptional:false → flash dice get "flash" state (locked)', () => {
    const { er, rules } = rollAndApply(
      [d(4), d(4), d(4), d(2)],
      { flashOptional: false, clearFlashRequired: true }
    );
    er.flashIndices.forEach(li => {
      expect(rules.diceStates[li]).toBe('flash');
    });
  });

  test('flashOptional:true suppresses mustClearFlash even when clearFlashRequired:true', () => {
    const { rules } = rollAndApply(
      [d(3), d(3), d(3)],
      { flashOptional: true, clearFlashRequired: true }
    );
    expect(rules.mustClearFlash).toBe(false);
    expect(rules.clearingFlashValue).toBeNull();
  });

  test('flashOptional:false does not affect clearFlashRequired:false', () => {
    const { rules } = rollAndApply(
      [d(3), d(3), d(3)],
      { flashOptional: false, clearFlashRequired: false }
    );
    expect(rules.mustClearFlash).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// allFiveRequired rule
// ─────────────────────────────────────────────────────────────────────────────
describe('applyRollRules – allFiveRequired', () => {
  test('all 5 dice score + allFiveRequired:true → mustRollAll=true', () => {
    // Roll all 5 dice, all scoring (flash of 3s + 5 + 10)
    const dice = [d(3), d(3), d(3), d(5), d(10)];
    const G = createGame(['A', 'B'], { allFiveRequired: true });
    const rollIndices = [0, 1, 2, 3, 4];
    rollIndices.forEach((gi, li) => {
      G.dice[gi].value = dice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(dice, null);
    const rules = applyRollRules(er, G.opts, rollIndices, G.dice);
    expect(rules.mustRollAll).toBe(true);
  });

  test('all 5 dice score + allFiveRequired:false → mustRollAll=false', () => {
    const dice = [d(3), d(3), d(3), d(5), d(10)];
    const G = createGame(['A', 'B'], { allFiveRequired: false });
    const rollIndices = [0, 1, 2, 3, 4];
    rollIndices.forEach((gi, li) => {
      G.dice[gi].value = dice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(dice, null);
    const rules = applyRollRules(er, G.opts, rollIndices, G.dice);
    expect(rules.mustRollAll).toBe(false);
  });

  test('not all dice score → mustRollAll=false even with allFiveRequired:true', () => {
    // 3 dice roll, only 2 score: one non-scorer remains
    const dice = [d(5), d(10), d(2)];
    const G = createGame(['A', 'B'], { allFiveRequired: true });
    // dice 0,1,2 are rolled; 3,4 are unrolled (not all used)
    [0, 1, 2].forEach((gi, li) => {
      G.dice[gi].value = dice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(dice, null);
    const rules = applyRollRules(er, G.opts, [0, 1, 2], G.dice);
    expect(rules.mustRollAll).toBe(false);
  });

  test('some dice committed + new roll scores all remaining → mustRollAll=true', () => {
    // dice 0,1 are committed; dice 2,3,4 are rolled and all score
    const G = createGame(['A', 'B'], { allFiveRequired: true });
    G.dice[0].state = 'committed';
    G.dice[1].state = 'committed';
    const rolledDice = [d(5), d(10), d(3)];
    // But 3 doesn't individually score — only 5 and 10 do.
    // We need a flash scenario where all 3 remaining dice score.
    // Use flash of 3s on just 3 dice (not freight — only 3 dice)
    const flashDice = [d(6), d(6), d(6)];
    [2, 3, 4].forEach((gi, li) => {
      G.dice[gi].value = flashDice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(flashDice, null);
    const rules = applyRollRules(er, G.opts, [2, 3, 4], G.dice);
    expect(rules.mustRollAll).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// diceStates correctness
// ─────────────────────────────────────────────────────────────────────────────
describe('applyRollRules – diceStates', () => {
  test('non-scoring dice get "rolled" state', () => {
    const dice = [d(5), d(2), d(3)];
    const G = createGame(['A', 'B']);
    const rollIndices = [0, 1, 2];
    [0, 1, 2].forEach((gi, li) => {
      G.dice[gi].value = dice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(dice, null);
    const rules = applyRollRules(er, G.opts, rollIndices, G.dice);
    expect(rules.diceStates[1]).toBe('rolled'); // the 2
    expect(rules.diceStates[2]).toBe('rolled'); // the 3
  });

  test('individual scorer (5/10) gets "selected" state', () => {
    const dice = [d(5), d(2)];
    const G = createGame(['A', 'B']);
    [0, 1].forEach((gi, li) => {
      G.dice[gi].value = dice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(dice, null);
    const rules = applyRollRules(er, G.opts, [0, 1], G.dice);
    expect(rules.diceStates[0]).toBe('selected'); // the 5
  });

  test('wimpout result: all dice stay "rolled" (caller handles wimpout separately)', () => {
    // applyRollRules is only called for normal results; but we test defensively
    const dice = [d(2), d(3), d(4)];
    const G = createGame(['A', 'B']);
    [0, 1, 2].forEach((gi, li) => {
      G.dice[gi].value = dice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(dice, null);
    // er.type is 'wimpout' — canScore all false
    const rules = applyRollRules(er, G.opts, [0, 1, 2], G.dice);
    expect(rules.diceStates.every(s => s === 'rolled')).toBe(true);
    expect(rules.mustClearFlash).toBe(false);
    expect(rules.mustRollAll).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Combined rule interactions
// ─────────────────────────────────────────────────────────────────────────────
describe('applyRollRules – combined rule interactions', () => {
  test('flashOptional:true + allFiveRequired:true: flash dice selected, mustRollAll if all used', () => {
    const dice = [d(4), d(4), d(4), d(5), d(10)];
    const G = createGame(['A', 'B'], { flashOptional: true, allFiveRequired: true });
    const rollIndices = [0, 1, 2, 3, 4];
    rollIndices.forEach((gi, li) => {
      G.dice[gi].value = dice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(dice, null);
    const rules = applyRollRules(er, G.opts, rollIndices, G.dice);

    // Flash dice should be 'selected' (optional), not 'flash'
    er.flashIndices.forEach(li => expect(rules.diceStates[li]).toBe('selected'));
    // All dice score → mustRollAll
    expect(rules.mustRollAll).toBe(true);
    // No clearFlash since flashOptional
    expect(rules.mustClearFlash).toBe(false);
  });

  test('all rules disabled: flash → no mustClearFlash, no mustRollAll even if all used', () => {
    const dice = [d(4), d(4), d(4), d(5), d(10)];
    const G = createGame(['A', 'B'], {
      clearFlashRequired: false,
      allFiveRequired: false,
      flashOptional: false,
    });
    const rollIndices = [0, 1, 2, 3, 4];
    rollIndices.forEach((gi, li) => {
      G.dice[gi].value = dice[li].value;
      G.dice[gi].state = 'rolled';
    });
    const er = evaluateDice(dice, null);
    const rules = applyRollRules(er, G.opts, rollIndices, G.dice);
    expect(rules.mustClearFlash).toBe(false);
    expect(rules.mustRollAll).toBe(false);
  });
});
