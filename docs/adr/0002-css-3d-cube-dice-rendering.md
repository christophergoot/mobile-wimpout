---
title: CSS 3D cube transforms for dice rendering
status: accepted
date: 2026-05-13
decision-makers: []
consulted: []
informed: []
rca-keywords: [dice, animation, css, 3d, transform, cube, rendering]
error-codes: []
components: [game.js, style.css]
severity-hint: low
---

# CSS 3D Cube Transforms for Dice Rendering

## Context and Problem Statement

The game requires animated dice that tumble and land on a specific face. Each die has six
faces with distinct SVG artwork. How should dice be rendered and animated?

## Decision Drivers

- Dice must show a tumbling animation before landing on the correct face.
- Per-die SVG artwork must be swappable at runtime (three dice theme sets exist).
- Performance must be smooth on mid-range mobile devices.
- No external animation library or Canvas/WebGL dependency is desired.

## Considered Options

1. CSS 3D transforms -- six `<div>` faces arranged as a cube with `transform-style: preserve-3d`.
2. HTML5 Canvas with frame-by-frame sprite rendering.
3. WebGL / Three.js for true 3D dice physics.
4. Flat 2D animated transitions (fade/slide between face images).

## Decision Outcome

Chosen option: **CSS 3D transforms**, because browser compositors hardware-accelerate
CSS transforms on mobile, and the approach allows each face to be a standard DOM element
whose content (`innerHTML`) is swapped when the dice theme changes. No JavaScript
animation loop is required -- tumble keyframes and face-show rotations are pure CSS.

### Consequences

- Good: GPU-accelerated on all modern mobile browsers; no JavaScript `requestAnimationFrame`
  loop needed for the tumble.
- Good: Face content is plain DOM, so SVG artwork is inserted via `innerHTML` and
  inherits `currentColor` theming for free.
- Bad: `translateZ(33px)` is hard-coded to half the die's mid-range pixel size; a
  `@media` override recalculates it for small screens (`27px` at `max-width: 360px`),
  adding maintenance cost if die sizes change.
- Bad: `backface-visibility: hidden` is required on every face to prevent bleed-through;
  some older WebKit versions render this inconsistently.
- Neutral: Three tumble-variant keyframes (`tumble-a`, `tumble-b`, `tumble-c`) are
  assigned randomly per die per roll for visual variety.

## Confirmation

Inspect that each `.die` wrapper contains a `.die-cube` child with six `.face-*` children,
and that `style.css` defines `show-VALUE` classes whose rotations are the inverse of each
face's positional transform.
