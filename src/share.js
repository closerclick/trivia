// Compartir una trivia por el #fragment de la URL (no llega al servidor ni es
// indexable, §SEO). Las imágenes por URL se conservan; las subidas (store/data)
// se embeben como data-URI sólo si caben en un presupuesto razonable; si no, se
// descartan y se avisa (para compartirlas, usar URLs).
import { materializeForShare } from './store.js';

const MAX_FRAGMENT = 1_600_000; // ~1.6 MB de fragmento; suficiente para imágenes chicas

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64decode(b64) {
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin = atob(b64 + pad);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encoded(cfg) { return '#t=' + b64encode(JSON.stringify(cfg)); }

export async function buildShareConfig(cfg) {
  const theme = cfg.theme || {};
  const logo = await materializeForShare(theme.logo);
  const bgWeb = await materializeForShare(theme.bgWeb);
  const bgMobile = await materializeForShare(theme.bgMobile);

  const out = {
    v: 1,
    title: cfg.title || '',
    questions: cfg.questions || [],
    mode: cfg.mode, count: cfg.count,
    shuffleQuestions: cfg.shuffleQuestions,
    shuffleOptions: cfg.shuffleOptions,
    showCorrect: cfg.showCorrect,
    theme: { color: theme.color, mode: theme.mode, logo, bgWeb, bgMobile },
  };

  // Presupuesto: si el fragmento se pasa, soltar imágenes data: (no URLs) por peso.
  let dropped = false;
  const isData = v => /^data:/i.test(v || '');
  const order = ['bgMobile', 'bgWeb', 'logo'];
  for (const k of order) {
    if (encoded(out).length <= MAX_FRAGMENT) break;
    if (isData(out.theme[k])) { out.theme[k] = ''; dropped = true; }
  }
  return { cfg: out, dropped };
}

export async function buildShareLink(cfg) {
  const { cfg: shareCfg, dropped } = await buildShareConfig(cfg);
  const base = location.origin + location.pathname;
  return { url: base + encoded(shareCfg), dropped };
}

// Lee la trivia publicada del #fragment (si la hay). Devuelve cfg o null.
export function parseSharedConfig() {
  const hash = location.hash || '';
  if (!hash.startsWith('#t=')) return null;
  try {
    const cfg = JSON.parse(b64decode(hash.slice(3)));
    if (cfg && typeof cfg === 'object' && Array.isArray(cfg.questions)) return cfg;
  } catch {}
  return null;
}

export { b64encode, b64decode };
