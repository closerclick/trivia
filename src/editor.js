// Editor de configuración de la trivia (vista por defecto).
import { h, clear } from './dom.js';
import { t, getLang } from './i18n.js';
import { parseQuestionsInput } from './state.js';
import { sampleTrivia } from './sample.js';
import { generatePrompt } from './prompt.js';
import { putAsset, resolveAsset } from './store.js';

function section(titleKey, ...kids) {
  return h('section', { class: 'card' },
    h('h2', { class: 'card-title' }, t(titleKey)),
    h('div', { class: 'card-body' }, ...kids));
}

function field(labelKey, control) {
  // div (no <label>): envolver varios botones/controles en un <label> contamina
  // el nombre accesible de cada control. El click-to-focus no se necesita acá.
  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, t(labelKey)), control);
}

function segmented(options, current, onPick) {
  const wrap = h('div', { class: 'segmented' });
  options.forEach(o => {
    const b = h('button', {
      class: 'seg' + (o.value === current ? ' active' : ''),
      onclick: () => { [...wrap.children].forEach(c => c.classList.remove('active')); b.classList.add('active'); onPick(o.value); },
    }, o.label);
    wrap.append(b);
  });
  return wrap;
}

function toggle(labelKey, checked, onToggle) {
  const input = h('input', { type: 'checkbox', ...(checked ? { checked: true } : {}) });
  input.addEventListener('change', () => onToggle(input.checked));
  return h('label', { class: 'switch-row' },
    h('span', {}, t(labelKey)),
    h('span', { class: 'switch' }, input, h('span', { class: 'slider' })));
}

// cfg: config mutable; commit(): persiste + reaplica tema.
export function renderEditor(cfg, commit) {
  const root = h('div', { class: 'editor' });

  // ---------- Preguntas ----------
  const status = h('div', { class: 'json-status' });
  function refreshStatus() {
    clear(status);
    const txt = cfg.questionsText || '';
    if (!txt.trim()) { status.append(h('span', { class: 'muted' }, t('noQuestions'))); return; }
    try {
      const { title, questions } = parseQuestionsInput(txt);
      cfg.questions = questions;
      if (title && !cfg.title) { cfg.title = title; titleInput.value = title; }
      status.append(h('span', { class: 'ok' }, t('validCount', { n: questions.length })));
    } catch (e) {
      status.append(h('span', { class: 'err' }, t('invalidJson', { err: e.message })));
    }
  }

  const titleInput = h('input', { class: 'input', type: 'text', placeholder: t('titlePh'), value: cfg.title || '' });
  titleInput.addEventListener('input', () => { cfg.title = titleInput.value; commit(); });

  const textarea = h('textarea', { class: 'input textarea code', rows: '8', placeholder: t('jsonPh') }, cfg.questionsText || '');
  textarea.addEventListener('input', () => { cfg.questionsText = textarea.value; refreshStatus(); commit(); });

  const contentSection = section('secContent',
    field('title', titleInput),
    field('jsonLabel', textarea),
    status,
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn btn-soft', onclick: () => openPromptModal(cfg) }, t('genPrompt')),
      h('button', { class: 'btn btn-soft', onclick: () => {
        const s = sampleTrivia(getLang());
        cfg.title = s.title; titleInput.value = s.title;
        cfg.questionsText = JSON.stringify(s, null, 2); textarea.value = cfg.questionsText;
        refreshStatus(); commit();
      } }, t('loadSample')),
      h('button', { class: 'btn btn-soft', onclick: () => {
        cfg.questionsText = ''; textarea.value = ''; cfg.questions = []; refreshStatus(); commit();
      } }, t('clear')),
    ),
  );

  // ---------- Apariencia ----------
  const colorInput = h('input', { class: 'color', type: 'color', value: cfg.theme.color || '#7c3aed' });
  const hexInput = h('input', { class: 'input hex', type: 'text', value: cfg.theme.color || '#7c3aed', maxlength: '7' });
  colorInput.addEventListener('input', () => { cfg.theme.color = colorInput.value; hexInput.value = colorInput.value; commit(); });
  hexInput.addEventListener('input', () => {
    const v = hexInput.value.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(v)) { const hx = v.startsWith('#') ? v : '#' + v; cfg.theme.color = hx; colorInput.value = hx; commit(); }
  });

  function assetRow(labelKey, fieldName) {
    const row = h('div', { class: 'asset-row' });
    const fileInput = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const dataUri = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
      const ref = await putAsset(dataUri);   // → store (obligatorio); fallback localStorage
      cfg.theme[fieldName] = ref; commit(); build();
    });

    async function build() {
      clear(row);
      const ref = cfg.theme[fieldName] || '';
      const preview = h('div', { class: 'asset-preview' });
      const resolved = ref ? await resolveAsset(ref) : '';
      if (resolved) preview.style.backgroundImage = `url("${resolved.replace(/"/g, '\\"')}")`;

      const uploaded = /^(store:|data:)/.test(ref);
      const controls = h('div', { class: 'asset-controls' });
      if (uploaded) {
        controls.append(h('span', { class: 'chip' }, t('upload') + ' ✓'));
      } else {
        const urlInput = h('input', { class: 'input', type: 'url', placeholder: t('imgUrlPh'), value: ref });
        urlInput.addEventListener('input', () => { cfg.theme[fieldName] = urlInput.value.trim(); commit(); preview.style.backgroundImage = urlInput.value.trim() ? `url("${urlInput.value.trim().replace(/"/g, '\\"')}")` : ''; });
        controls.append(urlInput);
      }
      const actions = h('div', { class: 'asset-actions' },
        h('button', { class: 'btn btn-soft sm', onclick: () => fileInput.click() }, t('upload')),
        ref ? h('button', { class: 'btn btn-ghost sm', onclick: () => { cfg.theme[fieldName] = ''; commit(); build(); } }, t('remove')) : null,
      );
      row.append(h('span', { class: 'field-label' }, t(labelKey)), h('div', { class: 'asset-main' }, preview, controls, actions), fileInput);
    }
    build();
    return row;
  }

  const appearanceSection = section('secAppearance',
    field('color', h('div', { class: 'color-row' }, colorInput, hexInput)),
    field('theme', segmented(
      [{ value: 'dark', label: t('dark') }, { value: 'light', label: t('light') }],
      cfg.theme.mode, v => { cfg.theme.mode = v; commit(); })),
    assetRow('logo', 'logo'),
    assetRow('bgWeb', 'bgWeb'),
    assetRow('bgMobile', 'bgMobile'),
    h('p', { class: 'hint' }, t('uploadHint')),
  );

  // ---------- Juego ----------
  const modeDesc = h('p', { class: 'hint' }, cfg.mode === 'flashcards' ? t('modeFlashDesc') : t('modeQuizDesc'));
  const countInput = h('input', { class: 'input num', type: 'number', min: '0', step: '1', value: String(cfg.count || 0) });
  countInput.addEventListener('input', () => { cfg.count = Math.max(0, parseInt(countInput.value, 10) || 0); commit(); });

  const gameSection = section('secGame',
    field('gameMode', segmented(
      [{ value: 'quiz', label: t('modeQuiz') }, { value: 'flashcards', label: t('modeFlash') }],
      cfg.mode, v => { cfg.mode = v; modeDesc.textContent = v === 'flashcards' ? t('modeFlashDesc') : t('modeQuizDesc'); commit(); })),
    modeDesc,
    field('count', h('div', { class: 'count-row' }, countInput, h('span', { class: 'muted' }, '0 = ' + t('countAll')))),
    toggle('shuffleQ', cfg.shuffleQuestions, v => { cfg.shuffleQuestions = v; commit(); }),
    toggle('shuffleO', cfg.shuffleOptions, v => { cfg.shuffleOptions = v; commit(); }),
    toggle('showCorrect', cfg.showCorrect, v => { cfg.showCorrect = v; commit(); }),
  );

  root.append(contentSection, appearanceSection, gameSection);
  refreshStatus();
  return root;
}

// ---------- Modal del generador de prompt ----------
function openPromptModal(cfg) {
  const lang = getLang();
  const topic = h('input', { class: 'input', type: 'text', placeholder: t('topicPh') });
  const count = h('input', { class: 'input num', type: 'number', min: '1', max: '100', value: '10' });
  const incl = h('input', { type: 'checkbox', checked: true });
  const out = h('textarea', { class: 'input textarea code', rows: '12', readonly: true });

  function regen() {
    out.value = generatePrompt({ topic: topic.value, count: count.value, lang, includeBoolean: incl.checked });
  }
  topic.addEventListener('input', regen);
  count.addEventListener('input', regen);
  incl.addEventListener('change', regen);
  regen();

  const copyBtn = h('button', { class: 'btn btn-primary', onclick: async () => {
    try { await navigator.clipboard.writeText(out.value); } catch { out.select(); document.execCommand('copy'); }
    copyBtn.textContent = t('copied');
    setTimeout(() => { copyBtn.textContent = t('copy'); }, 1400);
  } }, t('copy'));

  const overlay = h('div', { class: 'modal' },
    h('div', { class: 'modal-box' },
      h('div', { class: 'modal-head' },
        h('h2', {}, t('promptTitle')),
        h('button', { class: 'modal-x', onclick: close }, '✕')),
      h('div', { class: 'modal-body' },
        h('p', { class: 'hint' }, t('promptIntro')),
        h('div', { class: 'prompt-grid' },
          field('topic', topic),
          field('howMany', count)),
        h('label', { class: 'switch-row' },
          h('span', {}, t('includeTF')),
          h('span', { class: 'switch' }, incl, h('span', { class: 'slider' }))),
        out,
      ),
      h('div', { class: 'modal-foot' }, copyBtn,
        h('button', { class: 'btn btn-ghost', onclick: close }, t('close'))),
    ));
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  function close() { overlay.remove(); }
  document.body.append(overlay);
}
