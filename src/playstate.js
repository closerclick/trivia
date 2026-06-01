// Estado de UI/juego persistente (sobrevive a refrescos). Es estado efímero y
// local del navegador → localStorage (igual que el idioma), NO el store del
// ecosistema (ese guarda la config de la trivia, no el progreso de una partida).

const LS_UI = 'trivia.ui';     // { mode: 'play' | 'edit' }
const LS_PLAY = 'trivia.play'; // { sig, screen, i, score, session }

// --- modo de UI (en qué pantalla estaba el usuario) ---
export function getUiMode() {
  try { const s = JSON.parse(localStorage.getItem(LS_UI)); if (s && (s.mode === 'play' || s.mode === 'edit')) return s.mode; } catch {}
  return 'play'; // por defecto: arranca en modo juego
}
export function setUiMode(mode) {
  try { localStorage.setItem(LS_UI, JSON.stringify({ mode: mode === 'edit' ? 'edit' : 'play' })); } catch {}
}

// --- progreso de la partida ---
// Firma barata de la config jugable: si cambia (editaron preguntas, modo, etc.)
// el progreso guardado deja de ser válido y se descarta.
export function configSig(cfg) {
  const q = JSON.stringify(cfg.questions || []);
  let h = 5381;
  for (let i = 0; i < q.length; i++) h = ((h << 5) + h + q.charCodeAt(i)) | 0;
  return [cfg.mode, cfg.count, cfg.shuffleQuestions ? 1 : 0, cfg.shuffleOptions ? 1 : 0,
    cfg.showCorrect ? 1 : 0, (cfg.questions || []).length, h].join(':');
}

export function loadPlay(sig) {
  try {
    const s = JSON.parse(localStorage.getItem(LS_PLAY));
    if (s && s.sig === sig && Array.isArray(s.session)) return s;
  } catch {}
  return null;
}
export function savePlay(state) {
  try { localStorage.setItem(LS_PLAY, JSON.stringify(state)); } catch {}
}
export function clearPlay() {
  try { localStorage.removeItem(LS_PLAY); } catch {}
}
