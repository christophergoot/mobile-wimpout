'use strict';

const {
  getDiceThemePreview,
  renderDiceThemeBtn,
  closeDiceThemePicker,
  showDiceThemePicker,
} = require('../game.js');

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeBtn(set = 'cosmic') {
  const wrap = document.createElement('div');
  wrap.className = 'dice-theme-wrap';
  const btn = document.createElement('button');
  btn.className = 'dice-theme-btn';
  btn.dataset.set = set;
  wrap.appendChild(btn);
  document.body.appendChild(wrap);
  return btn;
}

afterEach(() => {
  document.body.innerHTML = '';
  // remove any stray document-level click listeners by replacing the node
  // (jsdom resets between test files anyway, but clean up within the suite)
});

// ─── getDiceThemePreview ─────────────────────────────────────────────────────

describe('getDiceThemePreview', () => {
  test('returns a non-empty SVG string for cosmic', () => {
    const svg = getDiceThemePreview('cosmic');
    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
  });

  test('returns a non-empty SVG string for tracks', () => {
    const svg = getDiceThemePreview('tracks');
    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
  });

  test('returns a non-empty SVG string for arcade', () => {
    const svg = getDiceThemePreview('arcade');
    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
  });

  test('falls back to cosmic SVG for unknown key', () => {
    const svg = getDiceThemePreview('unknown');
    const cosmicSvg = getDiceThemePreview('cosmic');
    expect(svg).toBe(cosmicSvg);
  });

  test('each theme returns a distinct SVG', () => {
    const cosmic = getDiceThemePreview('cosmic');
    const tracks = getDiceThemePreview('tracks');
    const arcade = getDiceThemePreview('arcade');
    expect(cosmic).not.toBe(tracks);
    expect(cosmic).not.toBe(arcade);
    expect(tracks).not.toBe(arcade);
  });
});

// ─── renderDiceThemeBtn ──────────────────────────────────────────────────────

describe('renderDiceThemeBtn', () => {
  test('injects SVG content into the button', () => {
    const btn = makeBtn('cosmic');
    renderDiceThemeBtn(btn);
    expect(btn.innerHTML).toContain('<svg');
  });

  test('sets aria-label to the theme name', () => {
    const btn = makeBtn('cosmic');
    renderDiceThemeBtn(btn);
    expect(btn.getAttribute('aria-label')).toBe('Dice style: Cosmic');
  });

  test('capitalises the label correctly for each theme', () => {
    for (const [set, expected] of [['cosmic','Cosmic'],['tracks','Tracks'],['arcade','Arcade']]) {
      const btn = makeBtn(set);
      renderDiceThemeBtn(btn);
      expect(btn.getAttribute('aria-label')).toBe(`Dice style: ${expected}`);
    }
  });

  test('uses cosmic as default when data-set is missing', () => {
    const btn = makeBtn();
    btn.removeAttribute('data-set');
    renderDiceThemeBtn(btn);
    expect(btn.getAttribute('aria-label')).toBe('Dice style: Cosmic');
    // compare against a reference button rendered with the same theme
    const ref = makeBtn('cosmic');
    renderDiceThemeBtn(ref);
    expect(btn.innerHTML).toBe(ref.innerHTML);
  });

  test('updates innerHTML to match the selected theme', () => {
    const btn = makeBtn('arcade');
    renderDiceThemeBtn(btn);
    const ref = makeBtn('arcade');
    renderDiceThemeBtn(ref);
    expect(btn.innerHTML).toBe(ref.innerHTML);
  });
});

// ─── closeDiceThemePicker ────────────────────────────────────────────────────

describe('closeDiceThemePicker', () => {
  test('removes all .dice-theme-picker elements', () => {
    const picker = document.createElement('div');
    picker.className = 'dice-theme-picker';
    document.body.appendChild(picker);
    closeDiceThemePicker();
    expect(document.querySelectorAll('.dice-theme-picker')).toHaveLength(0);
  });

  test('removes .active class from all .dice-theme-btn elements', () => {
    const btn = makeBtn();
    btn.classList.add('active');
    closeDiceThemePicker();
    expect(btn.classList.contains('active')).toBe(false);
  });

  test('is a no-op when nothing is open', () => {
    expect(() => closeDiceThemePicker()).not.toThrow();
  });
});

// ─── showDiceThemePicker ─────────────────────────────────────────────────────

describe('showDiceThemePicker', () => {
  test('appends a .dice-theme-picker to the wrap', () => {
    const btn = makeBtn('cosmic');
    showDiceThemePicker(btn);
    expect(btn.closest('.dice-theme-wrap').querySelectorAll('.dice-theme-picker')).toHaveLength(1);
  });

  test('picker contains exactly 3 options', () => {
    const btn = makeBtn('cosmic');
    showDiceThemePicker(btn);
    const options = btn.closest('.dice-theme-wrap').querySelectorAll('.dice-theme-option');
    expect(options).toHaveLength(3);
  });

  test('adds .active class to the button', () => {
    const btn = makeBtn('cosmic');
    showDiceThemePicker(btn);
    expect(btn.classList.contains('active')).toBe(true);
  });

  test('marks the currently selected option with .selected', () => {
    const btn = makeBtn('tracks');
    showDiceThemePicker(btn);
    const wrap = btn.closest('.dice-theme-wrap');
    const selected = wrap.querySelectorAll('.dice-theme-option.selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].querySelector('.dice-theme-option-label').textContent).toBe('Tracks');
  });

  test('options show labels for all three themes', () => {
    const btn = makeBtn('cosmic');
    showDiceThemePicker(btn);
    const labels = Array.from(
      btn.closest('.dice-theme-wrap').querySelectorAll('.dice-theme-option-label')
    ).map(el => el.textContent);
    expect(labels).toEqual(['Cosmic', 'Tracks', 'Arcade']);
  });

  test('clicking an option updates the button data-set and closes the picker', () => {
    const btn = makeBtn('cosmic');
    showDiceThemePicker(btn);
    const wrap = btn.closest('.dice-theme-wrap');
    const arcadeOpt = Array.from(wrap.querySelectorAll('.dice-theme-option'))
      .find(el => el.querySelector('.dice-theme-option-label').textContent === 'Arcade');
    arcadeOpt.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(btn.dataset.set).toBe('arcade');
    expect(wrap.querySelectorAll('.dice-theme-picker')).toHaveLength(0);
    expect(btn.classList.contains('active')).toBe(false);
  });

  test('clicking an option re-renders the button SVG for the new theme', () => {
    const btn = makeBtn('cosmic');
    renderDiceThemeBtn(btn);
    showDiceThemePicker(btn);
    const wrap = btn.closest('.dice-theme-wrap');
    const tracksOpt = Array.from(wrap.querySelectorAll('.dice-theme-option'))
      .find(el => el.querySelector('.dice-theme-option-label').textContent === 'Tracks');
    tracksOpt.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // compare against a reference button rendered for tracks
    const ref = makeBtn('tracks');
    renderDiceThemeBtn(ref);
    expect(btn.innerHTML).toBe(ref.innerHTML);
  });

  test('calling showDiceThemePicker twice only leaves one picker open', () => {
    const btn = makeBtn('cosmic');
    showDiceThemePicker(btn);
    showDiceThemePicker(btn);
    expect(document.querySelectorAll('.dice-theme-picker')).toHaveLength(1);
  });
});
