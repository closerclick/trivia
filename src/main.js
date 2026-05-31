import './style.css';
import { h, clear } from './dom.js';
import { t, getLang, toggleLang } from './i18n.js';
import { defaultConfig, mergeConfig } from './state.js';
import { applyPalette } from './palette.js';
import { loadConfig, saveConfig, resolveAsset } from './store.js';
import { parseSharedConfig, buildShareLink } from './share.js';
import { renderEditor } from './editor.js';
import { renderPlay } from './play.js';

const BRAND = 'Trivia';
const app = document.getElementById('app');

let cfg = defaultConfig();

// ---- shell ----
const bgLayer = h('div', { class: 'bg-layer' });
const topbar = h('header', { class: 'topbar' });
const view = h('main', { class: 'view' });
const toast = h('div', { class: 'toast' });
const support = h('closer-click-support', {
  href: 'https://ko-fi.com/closerclick', repo: 'closerclick/trivia', discord: 'https://discord.gg/D648uq7cth',
});
clear(app).append(bgLayer, topbar, view, support, toast);

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
    h('div', { class: 'brand' }, svgIcon(), h('span', {}, BRAND)),
    h('div', { class: 'spacer' }),
    h('button', { class: 'btn btn-ghost sm', title: 'es/en', onclick: () => { toggleLang(); showEditor(); } }, getLang() === 'es' ? 'EN' : 'ES'),
    h('button', { class: 'btn btn-ghost sm install', id: 'btnInstall', style: { display: 'none' } }, t('install')),
    h('button', { class: 'btn btn-soft', onclick: () => showPlay({ published: false }) }, t('play')),
    h('button', { class: 'btn btn-primary', onclick: doPublish }, t('publish')),
  );
  wireInstall();
}

function showEditor() {
  document.body.classList.remove('mode-play');
  topbar.style.display = '';
  renderTopbar();
  clear(view).append(renderEditor(cfg, commit));
  applyTheme(cfg);
}

async function showPlay({ published, playCfg }) {
  const c = playCfg || cfg;
  document.body.classList.add('mode-play');
  topbar.style.display = 'none';
  await applyTheme(c);
  const images = { logo: await resolvedLogo(c) };
  clear(view).append(renderPlay(c, {
    published,
    images,
    brandName: BRAND,
    onExit: () => showEditor(),
  }));
  if (!published) {
    view.append(h('button', { class: 'play-back', title: t('backToEdit'), onclick: () => showEditor() }, '‹ ' + t('edit')));
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
  showEditor();
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
