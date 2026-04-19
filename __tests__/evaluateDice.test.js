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
// FLASH  (3 or more of same numeric value — 4-of-a-kind IS a flash using 3 dice)
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateDice – flash detection', () => {
  test('three of the same value → flash', () => {
    const r = evaluateDice([d(4), d(4), d(4)], null);
    expect(r.type).toBe('normal');
    expect(r.flashValue).toBe(4);
    expect(r.flashIndices).toHaveLength(3);
  });

  // Bug fix: four of the same value IS a flash (uses first 3 dice)
  test('four of the same value → flash using 3 dice', () => {
    const r = evaluateDice([d(6), d(6), d(6), d(6)], null);
    expect(r.flashValue).toBe(6);
    expect(r.flashIndices).toHaveLength(3);
    expect(r.type).toBe('normal');
  });

  // Bug regression: four 6s + one 10 → flash of sixes (reported: flash not recognized)
  test('four sixes + lone ten → flash of sixes, ten scores individually', () => {
    const r = evaluateDice([d(6), d(6), d(10), d(6), d(6)], null);
    expect(r.flashValue).toBe(6);
    expect(r.flashIndices).toHaveLength(3);
    expect(r.canScore[2]).toBe(true); // the 10 still scores individually
  });

  test('four of a kind → flash (not wimpout), 4th die does not score', () => {
    const r = evaluateDice([d(4), d(4), d(4), d(4)], null);
    expect(r.flashValue).toBe(4);
    expect(r.flashIndices).toHaveLength(3);
    expect(r.type).toBe('normal');
    // The 4th die (index 3) is outside the flash and 4 is not an individual scorer
    expect(r.canScore[3]).toBe(false);
  });

  test('four of a kind + lone 5 → flash detected, 5 also scores individually', () => {
    const r = evaluateDice([d(3), d(3), d(3), d(3), d(5)], null);
    expect(r.flashValue).toBe(3);
    expect(r.flashIndices).toHaveLength(3);
    expect(r.canScore[4]).toBe(true);  // the 5 scores
    expect(r.type).toBe('normal');
  });

  test('three of a kind + one duplicate (4 dice total) still flashes on the triple', () => {
    // Rolling 4 dice: three 6s + one 2 is still a flash of 6s (count === 3)
    const r = evaluateDice([d(6), d(6), d(6), d(2)], null);
    expect(r.flashValue).toBe(6);
    expect(r.flashIndices).toHaveLength(3);
  });

  test('flash dice are marked canScore=true', () => {
    const r = evaluateDice([d(3), d(3), d(3), d(2)], null);
    r.flashIndices.forEach(i => expect(r.canScore[i]).toBe(true));
  });

  // Bug fix: clearingValue only suppresses a flash when fewer than 3 dice show that value.
  // Rolling 3+ of the clearing value constitutes a genuine new flash.
  test('clearingValue does NOT block a flash when 3 or more of that value are rolled', () => {
    const r = evaluateDice([d(4), d(4), d(4), d(2)], 4);
    expect(r.flashValue).toBe(4);
    expect(r.flashIndices).toHaveLength(3);
  });

  test('clearingValue blocks a flash when fewer than 3 of that value are rolled', () => {
    // two 4s while clearing flash of 4s → not enough for a new flash
    const r = evaluateDice([d(4), d(4), d(2)], 4);
    expect(r.flashValue).toBeNull();
  });

  test('clearingValue does not affect other flashes', () => {
    // three 3s + one 4 with clearingValue=4 → flash of 3s still fires
    const r = evaluateDice([d(3), d(3), d(3), d(4)], 4);
    expect(r.flashValue).toBe(3);
  });

  test('clearingValue does NOT block individual scoring of that face', () => {
    // A lone 5 rolled while clearing a flash of 5s still scores individually
    const r = evaluateDice([d(5), d(2), d(3)], 5);
    const fiveIdx = 0;
    expect(r.canScore[fiveIdx]).toBe(true);
    expect(r.type).toBe('normal');
  });

  // Bug regression: rolling 5,5,5,4,3 while clearing a flash of 5s should be a flash,
  // not just three individual 5s (15 pts). (reported: only scored 15 points)
  test('three of clearing value in full roll → new flash of that value', () => {
    const r = evaluateDice([d(5), d(5), d(5), d(4), d(3)], 5);
    expect(r.flashValue).toBe(5);
    expect(r.flashIndices).toHaveLength(3);
    expect(r.type).toBe('normal');
  });

  test('flash-proving: rerolling after flash of 5s, one die shows 5 → proves flash, can bank 55', () => {
    // Scenario: player had flash of 5s (3 dice committed = 50 pts), rerolls 2 dice.
    // One of the 2 rerolled dice is a 5. clearingValue=5, only 1 five → no new flash,
    // but the individual 5 should score (+5 pts), allowing bank of 50+5=55 pts.
    const r = evaluateDice([d(5), d(3)], 5);
    expect(r.flashValue).toBeNull();    // no new flash of 5s
    expect(r.canScore[0]).toBe(true);   // the 5 scores individually
    expect(r.canScore[1]).toBe(false);  // 3 does not score
    expect(r.type).toBe('normal');      // not a wimpout
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

  test('clearingValue=5 with no other scorers and no 5 → wimpout', () => {
    // Only non-scorers (2, 3, 4) — no 5 or 10, clearingValue does not matter
    const r = evaluateDice([d(2), d(3), d(4)], 5);
    expect(r.type).toBe('wimpout');
  });

  // Bug fix: three of the clearing value → new flash (not wimpout)
  test('three of clearing value → flash (not wimpout)', () => {
    const r = evaluateDice([d(4), d(4), d(4)], 4);
    expect(r.flashValue).toBe(4);
    expect(r.type).toBe('normal');
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
