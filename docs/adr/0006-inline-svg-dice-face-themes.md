---
title: Inline SVG constants for swappable dice face themes
status: accepted
date: 2026-05-13
decision-makers: []
consulted: []
informed: []
rca-keywords: [svg, dice, theme, artwork, inline, face]
error-codes: []
components: [game.js]
severity-hint: low
---

# Inline SVG Constants for Swappable Dice Face Themes

## Context and Problem Statement

Each die has seven possible face values (2, 3, 4, 5, 6, 10, sun). The game ships three
visual themes for dice artwork: Cosmic (geometric shapes), Animal Tracks (paw prints),
and Arcade (pixel art). How should these art assets be stored and applied?

## Decision Drivers

- Each theme must define SVG artwork for all seven face values.
- Theme switching must be instant (no network fetch).
- SVG colours must respond to the active colour theme (dark/light/custom).
- Per-player dice theme selection: each player can choose a different dice set.

## Considered Options

1. Inline SVG strings as JavaScript constants (`FACE_SVGS`, `ANIMAL_TRACK_SVGS`,
   `ARCADE_SVGS`), stamped into face elements via `innerHTML`.
2. External `.svg` files loaded via `fetch()` or `<img>` tags.
3. Icon font with ligatures or Unicode code points per face.
4. Canvas-rendered bitmaps cached in an off-screen buffer.

## Decision Outcome

Chosen option: **Inline SVG strings as JS constants**, because they are available
synchronously (no fetch), and inserting them as `innerHTML` means the SVG inherits
`currentColor` from the parent `.die-face` element, which is governed by the CSS theme
variables `--white-die-text` and `--black-die-text`.

### Consequences

- Good: Zero network requests for artwork; all three theme sets ship in `game.js`.
- Good: `currentColor` inheritance means a single CSS variable change recolours all dice
  artwork across all themes.
- Good: `refreshDiceFaces(setKey)` iterates all five dice and stamps the correct SVG per
  face, so switching a player's dice set is a single function call.
- Bad: The three SVG constant blocks add approximately 350 lines to `game.js`, inflating
  file size and making the logic harder to locate by scrolling.
- Bad: SVG filter IDs (e.g. `f-deer2`, `f-turkey`) are global to the document; if two
  dice themes with the same filter ID were rendered simultaneously, they would collide
  (mitigated because only one theme is active per the current player).
- Neutral: The `DICE_SETS` lookup object maps string keys (`cosmic`, `tracks`, `arcade`)
  to the corresponding SVG map, with `FACE_SVGS` (cosmic) as the fallback.

## Confirmation

Switch between dice themes in the setup screen and verify that all seven faces render
correctly and respond to colour theme changes.
