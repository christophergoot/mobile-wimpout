---
title: CSS custom properties for runtime theming
status: accepted
date: 2026-05-13
decision-makers: []
consulted: []
informed: []
rca-keywords: [theme, css, custom-properties, variables, dark-mode, light-mode]
error-codes: []
components: [game.js, style.css]
severity-hint: low
---

# CSS Custom Properties for Runtime Theming

## Context and Problem Statement

The game supports dark, light, and fully custom colour themes that users can switch at
runtime without reloading the page. How should theme colours be managed?

## Decision Drivers

- Theme changes must be instant (no page reload, no CSS file swap).
- Users can edit individual colours via `<input type="color">` pickers.
- Two built-in presets (dark, light) plus a persistent custom slot.
- No build-time CSS-in-JS or preprocessor.

## Considered Options

1. CSS custom properties (variables) on `:root`, toggled via `style.setProperty()`.
2. Swapping `<link>` stylesheet references (one CSS file per theme).
3. CSS-in-JS library (e.g. styled-components, Emotion).
4. Class-based theme switching (`.theme-dark`, `.theme-light` selectors).

## Decision Outcome

Chosen option: **CSS custom properties on `:root`**, because `style.setProperty()` is a
single DOM call per variable and triggers an immediate repaint with no layout thrashing.
The custom theme is serialised as a plain `{ "--var": "#hex" }` JSON object in
`localStorage`, making persistence trivial.

### Consequences

- Good: 18 CSS variables cover all colours (backgrounds, text, accents, die faces);
  changing any one variable cascades to every rule that references it.
- Good: Custom theme persistence is a single `JSON.stringify` / `JSON.parse` round-trip
  in `localStorage` under `cosmicWimpoutCustom`.
- Bad: Two separate storage keys (`cosmicWimpoutPreset` and `cosmicWimpoutCustom`) are
  needed to avoid preset switches overwriting hand-tuned custom colours.
- Bad: The light-theme star-field toggle (`body.theme-light::before { display: none }`)
  is coupled to an exact hex comparison (`vars["--bg"] === THEMES.light["--bg"]`), which
  breaks if the light background colour is customised.
- Neutral: `COLOR_GROUPS` organises the 18 variables into four labelled sections for the
  modal UI (Backgrounds, Text and Accent, Highlights, Dice).

## Confirmation

Open the theme modal, pick Custom, change any colour, reload the page, and confirm the
custom colour persists and the preset button highlights "CUSTOM".
