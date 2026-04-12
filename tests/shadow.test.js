import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCSS, layerToCSS, parsePreset, PRESETS, DEFAULT_LAYER } from '../src/shadow.js';

// ─── layerToCSS ───────────────────────────────────────────────────────────────

test('layerToCSS basic outset shadow', () => {
  const css = layerToCSS({ offsetX: 4, offsetY: 8, blur: 12, spread: 0, color: '#000', inset: false });
  assert.equal(css, '4px 8px 12px 0px #000');
});

test('layerToCSS inset shadow', () => {
  const css = layerToCSS({ offsetX: 0, offsetY: 2, blur: 6, spread: 1, color: '#ff0000', inset: true });
  assert.equal(css, 'inset 0px 2px 6px 1px #ff0000');
});

test('layerToCSS negative offsets', () => {
  const css = layerToCSS({ offsetX: -10, offsetY: -5, blur: 4, spread: -2, color: '#abc', inset: false });
  assert.equal(css, '-10px -5px 4px -2px #abc');
});

test('layerToCSS defaults when fields missing', () => {
  const css = layerToCSS({});
  assert.equal(css, '0px 0px 0px 0px #000000');
});

test('layerToCSS all-zero values', () => {
  const css = layerToCSS({ offsetX: 0, offsetY: 0, blur: 0, spread: 0, color: '#000', inset: false });
  assert.equal(css, '0px 0px 0px 0px #000');
});

// ─── generateCSS ─────────────────────────────────────────────────────────────

test('generateCSS single layer', () => {
  const css = generateCSS([{ offsetX: 2, offsetY: 4, blur: 8, spread: 0, color: '#333', inset: false }]);
  assert.equal(css, '2px 4px 8px 0px #333');
});

test('generateCSS multiple layers joined by comma', () => {
  const css = generateCSS([
    { offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: '#111', inset: false },
    { offsetX: 0, offsetY: 8, blur: 16, spread: 0, color: '#222', inset: false },
  ]);
  assert.equal(css, '0px 2px 4px 0px #111, 0px 8px 16px 0px #222');
});

test('generateCSS with inset layer', () => {
  const css = generateCSS([
    { offsetX: 0, offsetY: 0, blur: 0, spread: 1, color: 'white', inset: true },
  ]);
  assert.equal(css, 'inset 0px 0px 0px 1px white');
});

test('generateCSS empty array → none', () => {
  assert.equal(generateCSS([]), 'none');
});

test('generateCSS null/undefined → none', () => {
  assert.equal(generateCSS(null), 'none');
  assert.equal(generateCSS(undefined), 'none');
});

test('generateCSS three-layer mix (outset, outset, inset)', () => {
  const css = generateCSS([
    { offsetX: 0,  offsetY: 4,  blur: 8,  spread: 0,  color: 'rgba(0,0,0,0.1)', inset: false },
    { offsetX: 0,  offsetY: 12, blur: 24, spread: 0,  color: 'rgba(0,0,0,0.1)', inset: false },
    { offsetX: 0,  offsetY: 0,  blur: 0,  spread: 1,  color: 'rgba(255,255,255,0.3)', inset: true },
  ]);
  assert.ok(css.includes(', '));
  assert.ok(css.includes('inset'));
  const parts = css.split(', ');
  assert.equal(parts.length, 3);
});

// ─── parsePreset ─────────────────────────────────────────────────────────────

test('parsePreset returns deep copy for known names', () => {
  const layers = parsePreset('Soft');
  assert.ok(Array.isArray(layers));
  assert.ok(layers.length >= 1);
  // Mutating the copy should not affect the original
  layers[0].offsetX = 999;
  const layers2 = parsePreset('Soft');
  assert.notEqual(layers2[0].offsetX, 999);
});

test('parsePreset returns null for unknown name', () => {
  assert.equal(parsePreset('NonExistent'), null);
  assert.equal(parsePreset(''), null);
});

test('all preset names are parseable', () => {
  for (const p of PRESETS) {
    const layers = parsePreset(p.name);
    assert.ok(layers !== null, `preset ${p.name} should be parseable`);
  }
});

// ─── PRESETS ──────────────────────────────────────────────────────────────────

test('PRESETS has at least 5 entries', () => {
  assert.ok(PRESETS.length >= 5);
});

test('each PRESET generates valid non-none CSS', () => {
  for (const p of PRESETS) {
    const css = generateCSS(p.layers);
    assert.ok(css !== 'none', `preset ${p.name} should produce valid CSS`);
    assert.ok(css.includes('px'), `preset ${p.name} CSS should contain px values`);
  }
});

test('Neumorphism preset has two layers (light + dark)', () => {
  const layers = parsePreset('Neumorphism');
  assert.equal(layers.length, 2);
});

test('Glassmorphism preset has inset layer', () => {
  const layers = parsePreset('Glassmorphism');
  assert.ok(layers.some((l) => l.inset === true));
});

test('Brutalist preset blur is 0', () => {
  const layers = parsePreset('Brutalist');
  assert.ok(layers.every((l) => l.blur === 0));
});

// ─── DEFAULT_LAYER ────────────────────────────────────────────────────────────

test('DEFAULT_LAYER has required fields', () => {
  const required = ['offsetX', 'offsetY', 'blur', 'spread', 'color', 'inset'];
  for (const key of required) {
    assert.ok(Object.prototype.hasOwnProperty.call(DEFAULT_LAYER, key), `DEFAULT_LAYER missing ${key}`);
  }
});

test('DEFAULT_LAYER inset is false', () => {
  assert.equal(DEFAULT_LAYER.inset, false);
});
