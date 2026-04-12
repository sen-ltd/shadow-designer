import { generateCSS, parsePreset, PRESETS, DEFAULT_LAYER } from './shadow.js';
import { MESSAGES } from './i18n.js';

const $ = (id) => document.getElementById(id);

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  lang: 'ja',
  darkMode: true,
  layers: [
    { offsetX: 0, offsetY: 4, blur: 24, spread: 0, color: '#000000', inset: false },
  ],
  box: {
    width: 200,
    height: 120,
    bg: '#ffffff',
    radius: 12,
  },
  canvasBg: '#e8ecf0',
};

// ─── URL persistence ──────────────────────────────────────────────────────────

function readQuery() {
  const q = new URLSearchParams(location.search);
  if (q.has('lang')) state.lang = q.get('lang') === 'en' ? 'en' : 'ja';
  if (q.has('dark')) state.darkMode = q.get('dark') !== '0';
}

function writeQuery() {
  const q = new URLSearchParams();
  q.set('lang', state.lang);
  q.set('dark', state.darkMode ? '1' : '0');
  history.replaceState(null, '', `${location.pathname}?${q.toString()}`);
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

function applyMessages() {
  const m = MESSAGES[state.lang];
  document.title = m.title;
  document.documentElement.lang = state.lang;
  $('title').textContent = m.title;
  $('subtitle').textContent = m.subtitle;
  $('lang-label').textContent = m.langLabel;
  $('theme-btn').textContent = state.darkMode ? m.lightMode : m.darkMode;
  $('preview-label').textContent = m.previewLabel;
  $('box-width-label').textContent = m.boxWidthLabel;
  $('box-height-label').textContent = m.boxHeightLabel;
  $('box-bg-label').textContent = m.boxBgLabel;
  $('box-radius-label').textContent = m.boxRadiusLabel;
  $('canvas-bg-label').textContent = m.canvasBgLabel;
  $('layers-label').textContent = m.layersLabel;
  $('add-layer-btn').textContent = m.addLayer;
  $('output-label').textContent = m.outputLabel;
  $('copy-btn').textContent = m.copyLabel;
  $('presets-label').textContent = m.presetsLabel;
  $('footer').textContent = m.footer;
}

function buildLangOptions() {
  const sel = $('lang-select');
  sel.innerHTML = '';
  for (const lang of ['ja', 'en']) {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang.toUpperCase();
    if (lang === state.lang) opt.selected = true;
    sel.appendChild(opt);
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
  const m = MESSAGES[state.lang];
  $('theme-btn').textContent = state.darkMode ? m.lightMode : m.darkMode;
}

// ─── Layer rendering ──────────────────────────────────────────────────────────

function makeNumberInput(value, min, max, step, onInput) {
  const wrap = document.createElement('div');
  wrap.className = 'num-wrap';

  const range = document.createElement('input');
  range.type = 'range';
  range.min = min;
  range.max = max;
  range.step = step;
  range.value = value;

  const num = document.createElement('input');
  num.type = 'number';
  num.min = min;
  num.max = max;
  num.step = step;
  num.value = value;
  num.className = 'num-input';

  range.addEventListener('input', (e) => {
    const v = Number(e.target.value);
    num.value = v;
    onInput(v);
  });
  num.addEventListener('input', (e) => {
    const v = Math.min(max, Math.max(min, Number(e.target.value)));
    range.value = v;
    onInput(v);
  });

  wrap.appendChild(range);
  wrap.appendChild(num);
  return wrap;
}

function renderLayers() {
  const container = $('layers');
  container.innerHTML = '';
  const m = MESSAGES[state.lang];

  state.layers.forEach((layer, i) => {
    const card = document.createElement('div');
    card.className = 'layer-card';

    // ── header row: title + inset + remove ───────────────────────────────────
    const header = document.createElement('div');
    header.className = 'layer-header';

    const title = document.createElement('span');
    title.className = 'layer-title';
    title.textContent = `#${i + 1}`;
    header.appendChild(title);

    const insetLabel = document.createElement('label');
    insetLabel.className = 'inset-label';
    const insetCb = document.createElement('input');
    insetCb.type = 'checkbox';
    insetCb.checked = layer.inset;
    insetCb.addEventListener('change', (e) => {
      state.layers[i].inset = e.target.checked;
      update();
    });
    insetLabel.appendChild(insetCb);
    insetLabel.appendChild(document.createTextNode(' ' + m.insetLabel));
    header.appendChild(insetLabel);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.title = m.removeLayer;
    removeBtn.disabled = state.layers.length <= 1;
    removeBtn.addEventListener('click', () => {
      state.layers.splice(i, 1);
      update();
    });
    header.appendChild(removeBtn);
    card.appendChild(header);

    // ── sliders grid ─────────────────────────────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'layer-grid';

    const fields = [
      { key: 'offsetX', labelKey: 'offsetXLabel', min: -100, max: 100, step: 1 },
      { key: 'offsetY', labelKey: 'offsetYLabel', min: -100, max: 100, step: 1 },
      { key: 'blur',    labelKey: 'blurLabel',    min: 0,    max: 100, step: 1 },
      { key: 'spread',  labelKey: 'spreadLabel',  min: -50,  max: 50,  step: 1 },
    ];

    for (const f of fields) {
      const fieldWrap = document.createElement('div');
      fieldWrap.className = 'field';

      const lbl = document.createElement('label');
      lbl.className = 'field-label';
      lbl.textContent = m[f.labelKey];
      fieldWrap.appendChild(lbl);

      const ctrl = makeNumberInput(layer[f.key], f.min, f.max, f.step, (v) => {
        state.layers[i][f.key] = v;
        update();
      });
      fieldWrap.appendChild(ctrl);
      grid.appendChild(fieldWrap);
    }

    // Color field
    const colorWrap = document.createElement('div');
    colorWrap.className = 'field';
    const colorLbl = document.createElement('label');
    colorLbl.className = 'field-label';
    colorLbl.textContent = m.colorLabel;
    colorWrap.appendChild(colorLbl);

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'color-input';
    // Attempt to show color (rgba not supported by <input type="color">)
    colorInput.value = rgbaToHex(layer.color);
    colorInput.addEventListener('input', (e) => {
      state.layers[i].color = e.target.value;
      update();
    });
    colorWrap.appendChild(colorInput);
    grid.appendChild(colorWrap);

    card.appendChild(grid);
    container.appendChild(card);
  });
}

/**
 * Attempt to extract a hex color from a color value that might be rgba().
 * Falls back to #000000 if parsing fails.
 */
function rgbaToHex(color) {
  if (color && color.startsWith('#')) return color;
  // Try to parse rgba(r,g,b,a) → #rrggbb
  const m = color && color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return '#' + [m[1], m[2], m[3]]
      .map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
      .join('');
  }
  return '#000000';
}

// ─── Presets ──────────────────────────────────────────────────────────────────

function renderPresets() {
  const container = $('presets');
  container.innerHTML = '';

  for (const p of PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-btn';
    btn.textContent = p.name;
    // Show a mini preview of the shadow
    const shadow = generateCSS(p.layers);
    btn.style.boxShadow = shadow;
    btn.addEventListener('click', () => {
      state.layers = parsePreset(p.name);
      update();
    });
    container.appendChild(btn);
  }
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function updatePreview() {
  const canvas = $('preview-canvas');
  canvas.style.background = state.canvasBg;

  const box = $('preview-box');
  box.style.width = state.box.width + 'px';
  box.style.height = state.box.height + 'px';
  box.style.background = state.box.bg;
  box.style.borderRadius = state.box.radius + 'px';
  box.style.boxShadow = generateCSS(state.layers);
}

// ─── Output ───────────────────────────────────────────────────────────────────

function updateOutput() {
  const css = generateCSS(state.layers);
  $('output').textContent = `box-shadow: ${css};`;
}

// ─── Box controls ─────────────────────────────────────────────────────────────

function syncBoxControls() {
  $('box-width').value = state.box.width;
  $('box-height').value = state.box.height;
  $('box-bg').value = rgbaToHex(state.box.bg);
  $('box-radius').value = state.box.radius;
  $('canvas-bg').value = rgbaToHex(state.canvasBg);
}

// ─── Master update ────────────────────────────────────────────────────────────

function update() {
  syncBoxControls();
  renderLayers();
  renderPresets();
  updatePreview();
  updateOutput();
  writeQuery();
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

function wireEvents() {
  // Lang
  $('lang-select').addEventListener('change', (e) => {
    state.lang = e.target.value;
    applyMessages();
    update();
  });

  // Theme
  $('theme-btn').addEventListener('click', () => {
    state.darkMode = !state.darkMode;
    applyTheme();
    applyMessages();
    writeQuery();
  });

  // Add layer
  $('add-layer-btn').addEventListener('click', () => {
    state.layers.push({ ...DEFAULT_LAYER });
    update();
  });

  // Box controls
  $('box-width').addEventListener('input', (e) => {
    state.box.width = Math.max(40, Math.min(400, Number(e.target.value)));
    update();
  });
  $('box-height').addEventListener('input', (e) => {
    state.box.height = Math.max(20, Math.min(300, Number(e.target.value)));
    update();
  });
  $('box-bg').addEventListener('input', (e) => {
    state.box.bg = e.target.value;
    update();
  });
  $('box-radius').addEventListener('input', (e) => {
    state.box.radius = Math.max(0, Math.min(100, Number(e.target.value)));
    update();
  });
  $('canvas-bg').addEventListener('input', (e) => {
    state.canvasBg = e.target.value;
    update();
  });

  // Copy
  $('copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('output').textContent);
      const m = MESSAGES[state.lang];
      const btn = $('copy-btn');
      const orig = btn.textContent;
      btn.textContent = m.copiedLabel;
      setTimeout(() => (btn.textContent = orig), 1400);
    } catch (_) {}
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

readQuery();
applyTheme();
applyMessages();
buildLangOptions();
wireEvents();
update();
