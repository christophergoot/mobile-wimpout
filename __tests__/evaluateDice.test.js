'use strict';

const { evaluateDice } = require('../game.js');

// Helper to build a die object
const d = (value, isBlack = false) => ({ value, isBlack });

// ─────────────────────────────────────────────────────────────────────────────
// FREIGHT TRAIN  (requires all 5 dice)
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – freight train', () => {
  test('five of the same value (not 6 or 10) → normal freight', () => {
    const dice = [d(3), d(3), d(3), d(3), d(3)];
    const r = evaluateDice(dice, null);
    expect(r.type).toBe('freight');
    expect(r.sub).toBe('normal');
    expect(r.score).toBe(300);
    expect(r.value).toBe(3);
  });

  test('five 4s → freight score 400', () => {
    const r = evaluateDice([d(4), d(4), d(4), d(4), d(4)], null);
    expect(r.type).toBe('freight');
    expect(r.score).toBe(400);
  });

  test('five 6s → instant win freight', () => {
    const r = evaluateDice([d(6), d(6), d(6), d(6), d(6)], null);
    expect(r.type).toBe('freight');
    expect(r.sub).toBe('win');
    expect(r.score).toBe(600);
  });

  test('five 10s → supernova (elimination)', () => {
    const r = evaluateDice([d(10), d(10), d(10), d(10), d(10)], null);
    expect(r.type).toBe('freight');
    expect(r.sub).toBe('supernova');
    expect(r.score).toBe(0);
  });

  test('four of a kind + sun → freight train', () => {
    const r = evaluateDice([d(5), d(5), d(5), d(5), d('sun', true)], null);
    expect(r.type).toBe('freight');
    expect(r.score).toBe(500);
  });

  test('four 2s + sun → freight (2×100)', () => {
    const r = evaluateDice([d(2), d(2), d(2), d(2), d('sun', true)], null);
    expect(r.type).toBe('freight');
    expect(r.score).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLER  (all 5 different faces)
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – sampler', () => {
  test('all 5 different white-die values → sampler +25', () => {
    const r = evaluateDice([d(2), d(3), d(4), d(5), d(6)], null);
    expect(r.type).toBe('sampler');
    expect(r.score).toBe(25);
    expect(r.flashValue).toBeNull();
  });

  test('sampler with 10 included', () => {
    const r = evaluateDice([d(3), d(4), d(5), d(6), d(10)], null);
    expect(r.type).toBe('sampler');
    expect(r.score).toBe(25);
  });

  test('five dice with sun counts as 5 unique → sampler', () => {
    // sun is distinct from numeric values
    const r = evaluateDice([d(2), d(3), d(4), d(5), d('sun', true)], null);
    expect(r.type).toBe('sampler');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLASH  (3+ of same numeric value)
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – flash detection', () => {
  test('three of the same value → flash', () => {
    const r = evaluateDice([d(4), d(4), d(4)], null);
    expect(r.type).toBe('normal');
    expect(r.flashValue).toBe(4);
    expect(r.flashIndices).toHaveLength(3);
  });

  test('four of the same value → flash (all 4 in flashIndices)', () => {
    const r = evaluateDice([d(6), d(6), d(6), d(6)], null);
    expect(r.flashValue).toBe(6);
    expect(r.flashIndices).toHaveLength(4);
  });

  test('flash dice are marked canScore=true', () => {
    const r = evaluateDice([d(3), d(3), d(3), d(2)], null);
    r.flashIndices.forEach(i => expect(r.canScore[i]).toBe(true));
  });

  test('clearingValue blocks a flash of that value', () => {
    // three 4s, but 4 is the clearing value → no flash
    const r = evaluateDice([d(4), d(4), d(4), d(2)], 4);
    expect(r.flashValue).toBeNull();
  });

  test('clearingValue does not affect other flashes', () => {
    // three 3s + one 4 with clearingValue=4 → flash of 3s still fires
    const r = evaluateDice([d(3), d(3), d(3), d(4)], 4);
    expect(r.flashValue).toBe(3);
  });

  test('clearingValue blocks individual scoring of that face', () => {
    // if clearing value is 5, a lone 5 cannot score
    const r = evaluateDice([d(5), d(2), d(3)], 5);
    const fiveIdx = 0;
    expect(r.canScore[fiveIdx]).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUN WILDCARD FLASH
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – sun wildcard', () => {
  test('pair + sun → flash of that pair value', () => {
    const r = evaluateDice([d(4), d(4), d('sun', true)], null);
    expect(r.flashValue).toBe(4);
    expect(r.flashIndices).toHaveLength(3); // both 4s + sun
  });

  test('sun flash picks highest-scoring pair when multiple pairs exist', () => {
    // pairs of 3 and 10; should pick 10 (higher flash value)
    const r = evaluateDice([d(3), d(3), d(10), d(10), d('sun', true)], null);
    expect(r.flashValue).toBe(10);
  });

  test('sun alone (no pairs) → no flash from sun', () => {
    const r = evaluateDice([d(2), d(3), d(4), d('sun', true)], null);
    expect(r.flashValue).toBeNull();
  });

  test('sun alone counts as an individual scorer (scores as 10)', () => {
    const r = evaluateDice([d('sun', true), d(2), d(3)], null);
    const sunIdx = 0;
    expect(r.canScore[sunIdx]).toBe(true);
    expect(r.type).toBe('normal'); // not wimpout
  });

  test('sun pair blocked by clearingValue → no flash', () => {
    const r = evaluateDice([d(6), d(6), d('sun', true)], 6);
    expect(r.flashValue).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL SCORING  (lone 5 or 10)
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – individual scoring', () => {
  test('lone 5 scores', () => {
    const r = evaluateDice([d(5), d(2), d(3)], null);
    expect(r.canScore[0]).toBe(true);
    expect(r.type).toBe('normal');
  });

  test('lone 10 scores', () => {
    const r = evaluateDice([d(10), d(4), d(6)], null);
    expect(r.canScore[0]).toBe(true);
  });

  test('non-scoring faces (2,3,4,6) do not individually score', () => {
    const r = evaluateDice([d(2), d(3), d(4), d(6)], null);
    expect(r.canScore.every(v => !v)).toBe(true);
    expect(r.type).toBe('wimpout');
  });

  test('two 5s without flash still both score individually', () => {
    // only 2 dice – can't freight/sampler; just individual scoring
    const r = evaluateDice([d(5), d(5)], null);
    expect(r.canScore[0]).toBe(true);
    expect(r.canScore[1]).toBe(true);
    expect(r.flashValue).toBeNull(); // 2 of a kind is not a flash
  });

  test('5 and 10 together both score', () => {
    const r = evaluateDice([d(5), d(10)], null);
    expect(r.canScore[0]).toBe(true);
    expect(r.canScore[1]).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WIMPOUT
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – wimpout', () => {
  test('no scorers on single die → wimpout', () => {
    expect(evaluateDice([d(2)], null).type).toBe('wimpout');
  });

  test('all non-scoring values → wimpout', () => {
    const r = evaluateDice([d(2), d(3), d(4), d(6), d(6)], null);
    expect(r.type).toBe('wimpout');
  });

  test('wimpout when clearingValue blocks only potential scorer (5)', () => {
    const r = evaluateDice([d(5), d(2), d(3)], 5);
    expect(r.type).toBe('wimpout');
  });

  test('three of a kind blocked by clearingValue → wimpout if no other scorers', () => {
    const r = evaluateDice([d(4), d(4), d(4)], 4);
    expect(r.type).toBe('wimpout');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MIXED ROLLS  (flash + individual scorers on same roll)
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – mixed flash + individual scorers', () => {
  test('flash of 3s + lone 10 → flash detected, 10 also canScore', () => {
    const r = evaluateDice([d(3), d(3), d(3), d(10)], null);
    expect(r.flashValue).toBe(3);
    expect(r.canScore[3]).toBe(true); // the 10
  });

  test('flash of 4s + lone 5 → both score', () => {
    const r = evaluateDice([d(4), d(4), d(4), d(5)], null);
    expect(r.flashValue).toBe(4);
    const fiveIdx = 3;
    expect(r.canScore[fiveIdx]).toBe(true);
  });

  test('canScore false for non-scorer outside flash', () => {
    const r = evaluateDice([d(4), d(4), d(4), d(2)], null);
    const twoIdx = 3;
    expect(r.canScore[twoIdx]).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUN USED AS 10  (user-specified scenarios)
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – sun usable as 10', () => {
  // Test 1 (user spec): flash that includes a wild, user opts to use wild as 10
  // and reroll the other 2 dice.
  // The evaluation must mark all three dice (pair + sun) as canScore so the
  // player can deselect the pair and keep only the sun (scoring 10).
  test('flash with sun wildcard: sun marked canScore so player can keep it as 10', () => {
    const r = evaluateDice([d(4), d(4), d('sun', true)], null);
    expect(r.flashValue).toBe(4);
    expect(r.flashIndices).toContain(2); // sun is part of the flash
    // sun is canScore=true (as a flash member); player can choose to deselect
    // the two 4s and keep sun for 10 pts (flash breaks, sun scores as 10)
    expect(r.canScore[2]).toBe(true);
    // The two 4s are also in the flash and canScore
    expect(r.canScore[0]).toBe(true);
    expect(r.canScore[1]).toBe(true);
  });

  // Test 2 (user spec): no flash, but sun can be used as a 10.
  test('no flash: sun alone is scoreable as 10', () => {
    const r = evaluateDice([d('sun', true), d(2), d(3)], null);
    expect(r.flashValue).toBeNull();
    expect(r.type).toBe('normal'); // not wimpout — sun rescues the roll
    expect(r.canScore[0]).toBe(true);  // sun
    expect(r.canScore[1]).toBe(false); // 2 (non-scorer)
    expect(r.canScore[2]).toBe(false); // 3 (non-scorer)
  });

  // Test 3 (user spec): roll includes a 10 and a wild; player keeps the 10 and
  // rerolls the wild. Both must be individually scoreable so the player can
  // choose either, either, or both.
  test('10 and sun both scoreable; player can keep 10 and reroll sun', () => {
    const r = evaluateDice([d(10), d('sun', true), d(2)], null);
    expect(r.flashValue).toBeNull();
    expect(r.canScore[0]).toBe(true);  // 10
    expect(r.canScore[1]).toBe(true);  // sun (can score as 10 or be rerolled)
    expect(r.canScore[2]).toBe(false); // 2
    // Both 10 and sun should be auto-selected; player can then deselect sun
  });

  test('sun with other non-scorers is not wimpout (sun saves the roll)', () => {
    const r = evaluateDice([d('sun', true), d(3), d(4), d(6)], null);
    expect(r.type).toBe('normal');
    expect(r.canScore[0]).toBe(true); // sun
  });

  test('sun is individually scoreable even when clearingValue is set (not a number)', () => {
    // clearingValue is always a face number, never 'sun', so sun is never blocked
    const r = evaluateDice([d('sun', true), d(4)], 4);
    expect(r.canScore[0]).toBe(true); // sun unaffected by clearing value
    expect(r.canScore[1]).toBe(false); // 4 blocked by clearingValue
  });
});
