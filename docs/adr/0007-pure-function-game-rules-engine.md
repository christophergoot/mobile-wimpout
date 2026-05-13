---
title: Pure-function game rules engine separated from UI
status: accepted
date: 2026-05-13
decision-makers: []
consulted: []
informed: []
rca-keywords: [rules, evaluation, pure, testable, dice, scoring, flash, freight]
error-codes: []
components: [game.js]
severity-hint: low
---

# Pure-Function Game Rules Engine Separated from UI

## Context and Problem Statement

Cosmic Wimpout has non-trivial scoring rules: flashes (three of a kind), freight trains
(five of a kind), samplers (all different), supernova elimination, the sun wild card,
flash-clearing obligations, and configurable house rules. How should these rules be
implemented to ensure correctness?

## Decision Drivers

- Rules must be unit-testable without a browser or DOM.
- House-rule toggles (entry barrier, flash banking, hot dice, flashes optional, suicide
  pact) create a combinatorial space that needs isolated testing.
- The evaluation result drives both UI rendering (dice states, messages) and state
  transitions (phase changes, forced re-rolls).

## Considered Options

1. Pure functions (`evaluateDice`, `applyRollRules`) that accept inputs and return
   result objects, called by imperative UI code that applies the results.
2. Event-driven rules engine with pub/sub (emit events, listeners update state).
3. State-machine library (XState or similar) encoding all transitions declaratively.

## Decision Outcome

Chosen option: **Pure functions**, because they can be tested with plain Jest assertions
(no DOM, no mocking) and the game's state space, while non-trivial, does not warrant a
full state-machine library.

### Consequences

- Good: `evaluateDice(dice, clearingValue)` returns a typed result
  (`freight | sampler | wimpout | normal`) with per-die `canScore` flags and flash
  metadata -- fully deterministic given the same inputs.
- Good: `applyRollRules(er, opts, rollIndices, dice)` computes `mustClearFlash`,
  `mustRollAll`, and per-die states without mutating any argument.
- Good: Four dedicated test files cover `evaluateDice`, `applyRollRules`, `createGame`,
  and `diceThemeSelector` in isolation.
- Bad: The boundary between pure logic and imperative UI is not enforced
  architecturally -- `resolveRoll()` calls `evaluateDice` then immediately mutates `G`
  and the DOM, so a future refactor could accidentally inline logic that breaks purity.
- Neutral: `calcCurrentRollScore()` reads from `G` directly (not pure), but it is a
  rendering helper rather than a rules function.

## Confirmation

Run `npm test` and verify that `evaluateDice` and `applyRollRules` tests pass without
any DOM environment setup (jsdom is configured but not required for these pure functions).
