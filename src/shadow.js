// CSS box-shadow builder. Produces valid `box-shadow` strings from an array
// of layer objects.
//
// Layer shape:
//   {
//     offsetX: number,   // px
//     offsetY: number,   // px
//     blur:    number,   // px (≥ 0)
//     spread:  number,   // px (positive = expand, negative = contract)
//     color:   string,   // any valid CSS color
//     inset:   boolean,  // if true, prepend "inset"
//   }

/**
 * Convert a single layer object to its CSS fragment.
 * @param {object} layer
 * @returns {string}
 */
export function layerToCSS(layer) {
  const { offsetX = 0, offsetY = 0, blur = 0, spread = 0, color = '#000000', inset = false } = layer;
  const parts = inset ? ['inset'] : [];
  parts.push(`${offsetX}px`, `${offsetY}px`, `${blur}px`, `${spread}px`, color);
  return parts.join(' ');
}

/**
 * Generate a full box-shadow CSS value from an array of layers.
 * Returns 'none' for an empty or invalid array.
 * @param {object[]} layers
 * @returns {string}
 */
export function generateCSS(layers) {
  if (!Array.isArray(layers) || layers.length === 0) return 'none';
  return layers.map(layerToCSS).join(', ');
}

/**
 * Return a deep copy of the named preset's layers array, or null if unknown.
 * @param {string} name
 * @returns {object[]|null}
 */
export function parsePreset(name) {
  const preset = PRESETS.find((p) => p.name === name);
  if (!preset) return null;
  return JSON.parse(JSON.stringify(preset.layers));
}

/** Default layer used when adding a new blank layer. */
export const DEFAULT_LAYER = {
  offsetX: 4,
  offsetY: 4,
  blur: 8,
  spread: 0,
  color: '#000000',
  inset: false,
};

export const PRESETS = [
  {
    name: 'Soft',
    layers: [
      { offsetX: 0, offsetY: 4, blur: 24, spread: 0, color: 'rgba(0,0,0,0.18)', inset: false },
    ],
  },
  {
    name: 'Neumorphism',
    layers: [
      { offsetX: 6, offsetY: 6, blur: 12, spread: 0, color: 'rgba(0,0,0,0.20)', inset: false },
      { offsetX: -6, offsetY: -6, blur: 12, spread: 0, color: 'rgba(255,255,255,0.70)', inset: false },
    ],
  },
  {
    name: 'Glassmorphism',
    layers: [
      { offsetX: 0, offsetY: 8, blur: 32, spread: 0, color: 'rgba(255,255,255,0.15)', inset: false },
      { offsetX: 0, offsetY: 0, blur: 0, spread: 1, color: 'rgba(255,255,255,0.30)', inset: true },
    ],
  },
  {
    name: 'Layered',
    layers: [
      { offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: 'rgba(0,0,0,0.07)', inset: false },
      { offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: 'rgba(0,0,0,0.07)', inset: false },
      { offsetX: 0, offsetY: 12, blur: 24, spread: 0, color: 'rgba(0,0,0,0.07)', inset: false },
    ],
  },
  {
    name: 'Brutalist',
    layers: [
      { offsetX: 4, offsetY: 4, blur: 0, spread: 0, color: '#000000', inset: false },
    ],
  },
];
