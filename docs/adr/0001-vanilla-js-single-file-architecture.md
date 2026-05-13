---
title: Vanilla JS single-file architecture with no build step
status: accepted
date: 2026-05-13
decision-makers: []
consulted: []
informed: []
rca-keywords: [architecture, build, bundler, framework, vanilla, monolith]
error-codes: []
components: [game.js]
severity-hint: low
---

# Vanilla JS Single-File Architecture with No Build Step

## Context and Problem Statement

Cosmic Wimpout is a pass-and-play mobile dice game. The project needs a UI architecture
that supports animated 3D dice, theming, multi-player state management, and game
persistence. What front-end architecture should be used?

## Decision Drivers

- The game is a single-screen interactive app with no routing or multi-page navigation.
- Target audience is mobile browsers with pass-and-play usage (no server needed).
- Minimising deployment complexity (static hosting, no CI pipeline required).
- Fast initial load time on mobile networks.

## Considered Options

1. Vanilla JavaScript -- single `game.js` file loaded via `<script>` tag.
2. React or Vue SPA with a bundler (Vite, webpack).
3. Lightweight framework (Preact, Svelte) with a build step.

## Decision Outcome

Chosen option: **Vanilla JavaScript -- single file**, because the game has a small surface
area (one screen, five dice, a setup form), no routing, and no complex component tree. A
framework would add bundle size, a build step, and dependency maintenance overhead with
no proportional benefit.

### Consequences

- Good: Zero build tooling required; `index.html` + `game.js` + `style.css` deploy
  anywhere as static files.
- Good: No dependency supply-chain risk for production runtime (devDependencies are
  test-only).
- Bad: All game logic, rendering, and UI lives in a single 2000+ line file, which
  increases cognitive load for new contributors.
- Bad: No component abstraction; UI updates are imperative DOM manipulation, making
  large-scale refactors harder.
- Neutral: Jest tests import `game.js` via CommonJS (`module.exports` guard at EOF),
  coupling the test harness to a Node/CJS environment.

## Confirmation

Verify that `index.html` references only `game.js` (no transpiled bundles) and that
`package.json` contains no build or transpile script -- only `test` and `prepare`.
