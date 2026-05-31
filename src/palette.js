// Deriva TODA la paleta a partir de un solo color + modo claro/oscuro.
// Devuelve un mapa de variables CSS que el resto de la app consume.

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

export function hexToRgb(hex) {
  let h = String(hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) h = '7c3aed';
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
export function rgbToHex({ r, g, b }) {
  const h = n => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}
export function hslToHex({ h, s, l }) {
  h = ((h % 360) + 360) % 360 / 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex({ r: r * 255, g: g * 255, b: b * 255 });
}

// Luminancia relativa (WCAG) para decidir texto contrastante sobre el color.
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function onColor(hex) { return luminance(hex) > 0.45 ? '#11131a' : '#ffffff'; }

export function derivePalette(color, mode) {
  const base = rgbToHex(hexToRgb(color));
  const { h, s } = rgbToHsl(hexToRgb(base));
  const brand = base;
  const brand2 = hslToHex({ h, s: clamp(s, 0, 100), l: clamp(rgbToHsl(hexToRgb(base)).l - 12, 8, 92) });
  const onBrand = onColor(brand);

  if (mode === 'light') {
    return {
      '--brand': brand, '--brand-2': brand2, '--on-brand': onBrand,
      '--bg': hslToHex({ h, s: clamp(s, 8, 40), l: 96 }),
      '--surface': '#ffffff',
      '--surface-2': hslToHex({ h, s: clamp(s, 8, 30), l: 93 }),
      '--text': hslToHex({ h, s: clamp(s, 6, 25), l: 12 }),
      '--muted': hslToHex({ h, s: clamp(s, 4, 18), l: 40 }),
      '--border': 'rgba(17,19,26,.12)',
      '--shadow': 'rgba(17,19,26,.10)',
      '--correct': '#16a34a', '--wrong': '#dc2626',
      '--overlay': 'rgba(255,255,255,.72)',
    };
  }
  // dark (default)
  return {
    '--brand': brand, '--brand-2': brand2, '--on-brand': onBrand,
    '--bg': hslToHex({ h, s: clamp(s, 10, 32), l: 8 }),
    '--surface': hslToHex({ h, s: clamp(s, 8, 26), l: 13 }),
    '--surface-2': hslToHex({ h, s: clamp(s, 8, 24), l: 18 }),
    '--text': hslToHex({ h, s: clamp(s, 4, 15), l: 96 }),
    '--muted': hslToHex({ h, s: clamp(s, 4, 14), l: 66 }),
    '--border': 'rgba(255,255,255,.12)',
    '--shadow': 'rgba(0,0,0,.45)',
    '--correct': '#22c55e', '--wrong': '#ef4444',
    '--overlay': 'rgba(0,0,0,.66)',
  };
}

// Aplica la paleta a un elemento (root). Devuelve el theme-color para el <meta>.
export function applyPalette(el, color, mode) {
  const p = derivePalette(color, mode);
  for (const k in p) el.style.setProperty(k, p[k]);
  return p['--brand'];
}
