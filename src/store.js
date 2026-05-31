// Persistencia OBLIGATORIA vía @closerclick/closer-click-store (store.closer.click):
// la config de la trivia y los blobs de imágenes viven en el vault del ecosistema
// (IndexedDB, cuota grande, compartido entre apps del mismo navegador).
// Si el iframe del store no carga (offline / bloqueado), caemos a un shim sobre
// localStorage para no perder funcionalidad (la app debe andar sin conexión).

const THREAD_CFG = 'trivia.current';
const THREAD_ASSETS = 'trivia.assets';

let backendPromise = null;

function shimBackend() {
  const key = t => 'trivia.shim.' + t;
  const read = t => { try { return JSON.parse(localStorage.getItem(key(t))) || []; } catch { return []; } };
  const write = (t, arr) => { try { localStorage.setItem(key(t), JSON.stringify(arr)); } catch {} };
  return {
    kind: 'localstorage',
    async appendMessage(t, entry) { const a = read(t); a.push(entry); write(t, a); },
    async listThread(t) { return read(t); },
    async removeThread(t) { try { localStorage.removeItem(key(t)); } catch {} },
  };
}

async function getBackend() {
  if (backendPromise) return backendPromise;
  backendPromise = (async () => {
    try {
      const mod = await import('@closerclick/closer-click-store');
      const store = await mod.Store.connect();
      // sanity-check de la API que usamos
      if (store && typeof store.appendMessage === 'function' && typeof store.listThread === 'function') {
        return { kind: 'store', store,
          appendMessage: (t, e) => store.appendMessage(t, e),
          listThread: (t, o) => store.listThread(t, o),
          removeThread: t => store.removeThread(t) };
      }
      throw new Error('store API mismatch');
    } catch (e) {
      console.warn('[trivia] store no disponible, usando localStorage:', e?.message || e);
      return shimBackend();
    }
  })();
  return backendPromise;
}

export async function storeKind() { return (await getBackend()).kind; }

// --- Config ---
export async function saveConfig(cfg) {
  const b = await getBackend();
  try { await b.removeThread(THREAD_CFG); } catch {}
  await b.appendMessage(THREAD_CFG, { id: 'cfg', ts: Date.now(), config: cfg });
}

export async function loadConfig() {
  const b = await getBackend();
  try {
    const entries = await b.listThread(THREAD_CFG, { limit: 1 });
    if (entries && entries.length) {
      const last = entries[entries.length - 1];
      if (last && last.config) return last.config;
    }
  } catch {}
  return null;
}

// --- Assets (imágenes) ---
const assetCache = new Map(); // ref → dataURI

function uid() {
  try { return crypto.randomUUID(); } catch { return 'a' + Date.now() + Math.random().toString(36).slice(2); }
}

// Guarda un data-URI como blob en el store; devuelve una ref 'store:<id>'.
export async function putAsset(dataUri) {
  const b = await getBackend();
  const id = uid();
  await b.appendMessage(THREAD_ASSETS, { id, ts: Date.now(), data: dataUri });
  const ref = 'store:' + id;
  assetCache.set(ref, dataUri);
  return ref;
}

// Resuelve una ref a algo usable en CSS/<img>: http(s)/data se devuelven tal cual;
// 'store:<id>' se busca en el store. Devuelve '' si no se encuentra.
export async function resolveAsset(ref) {
  if (!ref) return '';
  if (/^(https?:|data:)/i.test(ref)) return ref;
  if (assetCache.has(ref)) return assetCache.get(ref);
  if (ref.startsWith('store:')) {
    const id = ref.slice(6);
    const b = await getBackend();
    try {
      const entries = await b.listThread(THREAD_ASSETS, {});
      const found = (entries || []).find(e => e && e.id === id);
      if (found && found.data) { assetCache.set(ref, found.data); return found.data; }
    } catch {}
  }
  return '';
}

// Para construir el enlace de compartir: devuelve el data-URI embebible de una ref
// (http(s) se deja como URL — no se embebe; sólo store/data se materializan).
export async function materializeForShare(ref) {
  if (!ref) return '';
  if (/^https?:/i.test(ref)) return ref;          // URL: se comparte tal cual
  if (/^data:/i.test(ref)) return ref;            // data-URI: ya embebible
  if (ref.startsWith('store:')) return await resolveAsset(ref); // → data-URI local
  return '';
}
