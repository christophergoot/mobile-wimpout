---
title: LocalStorage for game state persistence
status: accepted
date: 2026-05-13
decision-makers: []
consulted: []
informed: []
rca-keywords: [persistence, state, localstorage, restore, save, refresh]
error-codes: []
components: [game.js]
severity-hint: medium
---

# LocalStorage for Game State Persistence

## Context and Problem Statement

A pass-and-play mobile dice game is prone to accidental page refreshes, tab switches, or
browser restarts. Players expect to return to their in-progress game without losing turn
progress. How should game state be persisted?

## Decision Drivers

- Must survive page refresh and browser restart on mobile.
- No server or database is available (static-hosted client-only app).
- State must capture the full game: players, scores, dice, phase, options, and last-licks
  tracking.
- Save/restore must not interfere with animations or in-flight rolls.

## Considered Options

1. `localStorage` with JSON serialisation of the `G` state object.
2. `sessionStorage` (lost on tab close).
3. IndexedDB via a wrapper library.
4. No persistence (accept data loss on refresh).

## Decision Outcome

Chosen option: **`localStorage` with JSON serialisation**, because it is synchronous,
universally supported, and sufficient for the small payload (~2 KB). The game calls
`saveGameState()` at every meaningful state transition (end of roll, bank, next player).

### Consequences

- Good: Full round-trip restore works -- `restoreGameState()` on DOMContentLoaded
  re-renders the scoreboard, dice, messages, and button states.
- Good: Mid-animation snapshots are normalised: if saved during the `rolling` phase, the
  snapshot resets to `preroll` with `committedScore = 0` to avoid a corrupt intermediate
  state.
- Bad: `Set` objects (`lastLicksDone`) must be spread to an array on save and
  reconstructed on load, adding a manual serialisation step.
- Bad: `localStorage` is capped at ~5 MB per origin; not a concern for this payload, but
  no quota-exceeded error handling exists.
- Neutral: Two separate keys are used -- `cosmicWimpoutGame` for game state and
  `cosmicWimpoutOpts` for house-rule preferences -- so starting a new game does not
  discard option selections.

## Confirmation

Start a 2-player game, roll once, force-reload the browser, and verify the game resumes
at the correct player and turn score.
