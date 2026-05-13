---
title: Global mutable state object for game model
status: accepted
date: 2026-05-13
decision-makers: []
consulted: []
informed: []
rca-keywords: [state, global, mutable, model, architecture, testability]
error-codes: []
components: [game.js]
severity-hint: medium
---

# Global Mutable State Object for Game Model

## Context and Problem Statement

The game must track players, scores, dice values and states, turn phase, flash-clearing
obligations, last-licks rounds, and house-rule options. How should this state be
structured and accessed?

## Decision Drivers

- All game logic lives in a single file with no module system (see ADR-0001).
- State is read and mutated from many functions (roll, bank, evaluate, render).
- State must be serialisable for localStorage persistence (see ADR-0004).
- Testability: pure evaluation functions (`evaluateDice`, `applyRollRules`) should be
  unit-testable without DOM setup.

## Considered Options

1. Single global mutable object `G` initialised by `createGame()`.
2. Redux-style store with actions and reducers.
3. Class-based `Game` instance with methods.
4. Functional state threading (pass state through every function, return new state).

## Decision Outcome

Chosen option: **Single global mutable object `G`**, because it is the simplest approach
for a frameworkless single-file app. `createGame()` returns a fresh object; all
subsequent logic reads and writes `G` directly.

### Consequences

- Good: `createGame()` is a pure factory with a clear schema, making it easy to
  understand the full shape of game state in one place.
- Good: Core logic functions (`evaluateDice`, `applyRollRules`) are designed as pure
  functions that accept parameters rather than reading `G` directly, enabling isolated
  unit testing.
- Bad: Most UI and turn-management functions mutate `G` as a side effect, making them
  difficult to test without full DOM setup.
- Bad: `G = null` is used to represent "no active game"; any function that accesses `G`
  properties without a null guard risks a runtime error.
- Neutral: The `createGame` factory and pure evaluation functions are exported via a
  `module.exports` guard for Jest, but rendering functions are not exported.

## Confirmation

Inspect `createGame()` to verify it returns a fresh object with no closures over external
mutable state. Confirm that `evaluateDice` and `applyRollRules` accept all inputs as
parameters and do not reference `G`.
