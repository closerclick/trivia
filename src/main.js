import './style.css';
import { h, clear } from './dom.js';
import { t, getLang, toggleLang } from './i18n.js';
import { defaultConfig, mergeConfig } from './state.js';
import { applyPalette } from './palette.js';
import { loadConfig, saveConfig, resolveAsset } from './store.js';
import { parseSharedConfig, buildShareLink } from './share.js';
import { renderEditor } from './editor.js';
import { renderPlay } from './play.js';
import { getUiMode, setUiMode } from './playstate.js';
import { createBackNav } from '@closerclick/closer-click-nav';

// Navegación "volver" unificada del ecosistema (registra <closer-click-back> y
// captura el botón físico de Android / gesto de iOS / atrás del navegador).
const nav = createBackNav();
// El JUEGO es el home; la EDICIÓN es una "capa" sobre él: en edición, volver
// (físico/chevron) regresa al juego. En el juego (sin capa) volver va a
// closer.click.
let editLayer = null;

const BRAND = 'Trivia';
const ICON_GEAR = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
const app = document.getElementById('app');

let cfg = defaultConfig();

// ---- shell ----
const bgLayer = h('div', { class: 'bg-layer' });
const topbar = h('header', { class: 'topbar' });
const view = h('main', { class: 'view' });
const toast = h('div', { class: 'toast' });
const support = h('closer-click-support', {
  class: 'topbar-coin',
  href: 'https://ko-fi.com/closerclick', repo: 'closerclick/trivia', discord: 'https://discord.gg/D648uq7cth',
});
clear(app).append(bgLayer, topbar, view, toast);

// La moneda de support vive en la topbar (a la derecha, como en las demás apps)
// durante el modo edición; en modo juego (sin topbar) flota arriba a la derecha.
function coinInTopbar() {
  support.removeAttribute('floating');
  support.className = 'topbar-coin';
  topbar.append(support);
}
function coinFloating() {
  support.className = '';
  support.setAttribute('floating', '');
  app.append(support);
}

// ---- tema (paleta + fondos) ----
async function applyTheme(c) {
  const brand = applyPalette(document.documentElement, c.theme.color, c.theme.mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', brand);
  document.documentElement.style.setProperty('color-scheme', c.theme.mode === 'light' ? 'light' : 'dark');

  const [web, mob] = await Promise.all([resolveAsset(c.theme.bgWeb), resolveAsset(c.theme.bgMobile)]);
  const css = v => v ? `url("${String(v).replace(/"/g, '\\"')}")` : 'none';
  document.documentElement.style.setProperty('--bg-web-img', css(web));
  document.documentElement.style.setProperty('--bg-mobile-img', css(mob || web));
}
async function resolvedLogo(c) { return await resolveAsset(c.theme.logo); }

function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(showToast._t); showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---- persistencia (debounced) ----
let saveTimer = null;
function commit() {
  applyTheme(cfg);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveConfig(cfg).catch(() => {}); }, 400);
}

// ---- vistas ----
function svgIcon() {
  return h('img', { class: 'brand-logo', src: 'icon.svg', alt: '', width: '30', height: '30' });
}

function renderTopbar() {
  clear(topbar).append(
    // Chevron de volver arriba a la izquierda (estándar del ecosistema): sin
    // capa interna lleva a la página anterior / closer.click.
    h('closer-click-back', { class: 'cc-back', lang: getLang() }),
    // Engrane: toggle a modo juego (mismo lugar que el de la pantalla de juego,
    // que vuelve a edición).
    h('button', { class: 'btn btn-ghost icon-btn', title: t('play'), 'aria-label': t('play'), onclick: () => showPlay({ published: false }), html: ICON_GEAR }),
    h('div', { class: 'brand' }, svgIcon(), h('span', {}, BRAND)),
    h('div', { class: 'spacer' }),
    h('button', { class: 'btn btn-ghost sm', title: 'es/en', onclick: () => { toggleLang(); showEditor(); } }, getLang() === 'es' ? 'EN' : 'ES'),
    h('button', { class: 'btn btn-ghost sm install', id: 'btnInstall', style: { display: 'none' } }, t('install')),
  );
  coinInTopbar();
  wireInstall();
}

function showEditor() {
  setUiMode('edit');
  document.body.classList.remove('mode-play');
  topbar.style.display = '';
  renderTopbar();
  clear(view).append(renderEditor(cfg, commit));
  applyTheme(cfg);
  // La edición es una capa sobre el juego: volver (físico/chevron) regresa al
  // juego en vez de salir del sitio.
  if (!editLayer) editLayer = nav.open(() => showPlay({ published: false }));
}

async function showPlay({ published, playCfg }) {
  // Volver al juego cierra la capa de edición (si fue el botón físico, ya está
  // cerrada y esto es un no-op seguro).
  if (editLayer) { const l = editLayer; editLayer = null; l.close(); }
  const c = playCfg || cfg;
  if (!published) setUiMode('play');
  document.body.classList.add('mode-play');
  topbar.style.display = 'none';
  coinFloating();
  await applyTheme(c);
  const images = { logo: await resolvedLogo(c) };
  clear(view).append(renderPlay(c, {
    published,
    images,
    brandName: BRAND,
    onExit: () => showEditor(),
  }));
  // Chevron de volver flotante arriba-izquierda: el juego es el home, así que
  // volver va a closer.click. En modo editable queda a la izquierda del engrane.
  view.append(h('closer-click-back', {
    floating: '', class: 'play-back', lang: getLang(),
    style: 'top:calc(env(safe-area-inset-top) + 12px);left:calc(env(safe-area-inset-left) + 12px);color:var(--text);--cc-back-size:42px;--cc-back-radius:11px;--cc-back-bg:color-mix(in srgb, var(--surface) 80%, transparent);--cc-back-bg-hover:color-mix(in srgb, var(--text) 10%, var(--surface))'
  }));
  if (!published) {
    // Engrane a la derecha del chevron → entrar al modo edición.
    view.append(h('button', { class: 'play-gear', title: t('edit'), 'aria-label': t('edit'), onclick: () => showEditor(), html: ICON_GEAR }));
  }
}

async function doPublish() {
  try {
    const { url, dropped } = await buildShareLink(cfg);
    try { await navigator.clipboard.writeText(url); } catch {}
    showToast(dropped ? t('linkDropped') : t('linkCopied'));
  } catch {}
  showPlay({ published: false });
}

// ---- PWA install ----
let deferredPrompt = null;
function alreadyInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function wireInstall() {
  const btn = document.getElementById('btnInstall');
  if (!btn) return;
  if (deferredPrompt && !alreadyInstalled()) btn.style.display = '';
  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); await deferredPrompt.userChoice;
    deferredPrompt = null; btn.style.display = 'none';
  });
}
if (!alreadyInstalled()) {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    const btn = document.getElementById('btnInstall'); if (btn) btn.style.display = '';
  });
}
window.addEventListener('appinstalled', () => { deferredPrompt = null; const b = document.getElementById('btnInstall'); if (b) b.style.display = 'none'; });

// ---- boot ----
async function boot() {
  const shared = parseSharedConfig();
  if (shared) {
    cfg = mergeConfig(shared);
    await showPlay({ published: true, playCfg: cfg });
    return;
  }
  const saved = await loadConfig();
  if (saved) cfg = mergeConfig(saved);
  // Por defecto arranca en modo juego; un refresco respeta dónde estaba el
  // usuario (juego o edición).
  if (getUiMode() === 'edit') showEditor();
  else await showPlay({ published: false });
}
boot();

// Si el #fragment cambia en caliente (p. ej. pegan un enlace publicado en una
// pestaña ya abierta), entrar al modo limpio sin recargar.
window.addEventListener('hashchange', () => {
  const shared = parseSharedConfig();
  if (shared) { cfg = mergeConfig(shared); showPlay({ published: true, playCfg: cfg }); }
});

// ---- service worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

// expuesto para tests E2E (no afecta el uso normal)
window.__trivia = { getConfig: () => cfg, parseSharedConfig, buildShareLink };
