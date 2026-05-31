// Pantalla de juego (modo limpio). Modos: 'quiz' (puntaje) y 'flashcards' (revelar).
// Soporta preguntas 'multiple' y 'boolean'. Texto de usuario siempre como TextNode.
import { h, clear } from './dom.js';
import { t } from './i18n.js';
import { buildSession } from './state.js';

const ICON_CHECK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 6L20 5"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

// opts: { published, onExit, images:{logo}, brandName }
export function renderPlay(cfg, opts = {}) {
  const session = buildSession(cfg);
  const flash = cfg.mode === 'flashcards';
  const root = h('div', { class: 'play' });

  let i = 0, score = 0;

  function go(node) { clear(root); root.append(node); root.scrollTop = 0; }

  function screenStart() {
    const logo = opts.images && opts.images.logo;
    go(h('div', { class: 'screen start' },
      logo ? h('img', { class: 'play-logo', src: logo, alt: '' }) : null,
      h('h1', { class: 'play-title' }, cfg.title || opts.brandName || 'Trivia'),
      session.length
        ? h('p', { class: 'play-sub' },
            `${session.length} ${t('secContent').toLowerCase()} · ${flash ? t('modeFlash') : t('modeQuiz')}`)
        : h('p', { class: 'play-sub' }, t('noQuestionsPlay')),
      session.length
        ? h('button', { class: 'btn btn-primary btn-lg', onclick: () => { i = 0; score = 0; screenQuestion(); } }, t('start'))
        : exitButton(),
    ));
  }

  function optionList(q) {
    if (q.type === 'boolean') {
      return [
        { label: t('tTrue'), value: true },
        { label: t('tFalse'), value: false },
      ];
    }
    return q.options.map((label, idx) => ({ label, value: idx }));
  }
  function isCorrect(q, value) {
    return q.type === 'boolean' ? value === q.answer : value === q.answer;
  }
  function correctValue(q) { return q.answer; }

  function screenQuestion() {
    const q = session[i];
    const opts2 = optionList(q);
    let answered = false;

    const optsWrap = h('div', { class: 'options' });
    const feedback = h('div', { class: 'feedback' });
    const footer = h('div', { class: 'q-footer' });

    function lockAndShow(pickedValue) {
      if (answered) return;
      answered = true;
      const right = pickedValue == null ? false : isCorrect(q, pickedValue);
      if (!flash && right) score++;

      [...optsWrap.children].forEach(btn => {
        const v = btn._value;
        btn.disabled = true;
        const isRight = isCorrect(q, v);
        if (cfg.showCorrect && isRight) btn.classList.add('correct');
        if (pickedValue != null && v === pickedValue && !isRight) btn.classList.add('wrong');
      });

      if (!flash) {
        feedback.append(h('div', { class: 'fb-line ' + (right ? 'ok' : 'no') },
          h('span', { class: 'fb-ic', html: right ? ICON_CHECK : ICON_X }),
          right ? t('correct') : t('incorrect')));
      }
      if (q.explanation && (cfg.showCorrect || flash)) {
        feedback.append(h('div', { class: 'fb-exp' }, q.explanation));
      }

      clear(footer);
      const last = i >= session.length - 1;
      footer.append(h('button', { class: 'btn btn-primary', onclick: () => {
        if (last) screenResult(); else { i++; screenQuestion(); }
      } }, last ? t('finish') : t('next')));
    }

    opts2.forEach(o => {
      const btn = h('button', { class: 'opt', onclick: () => lockAndShow(o.value) }, o.label);
      btn._value = o.value;
      optsWrap.append(btn);
    });

    if (flash) {
      clear(footer);
      footer.append(h('button', { class: 'btn btn-ghost', onclick: () => {
        // revelar: marca la correcta y muestra explicación, sin puntaje
        [...optsWrap.children].forEach(btn => {
          btn.disabled = true;
          if (isCorrect(q, btn._value)) btn.classList.add('correct');
        });
        lockAndShow(null);
      } }, t('reveal')));
    }

    go(h('div', { class: 'screen question' },
      h('div', { class: 'q-top' },
        h('div', { class: 'q-progress' }, t('question', { i: i + 1, n: session.length })),
        h('div', { class: 'q-bar' }, h('div', { class: 'q-bar-fill', style: { width: ((i) / session.length * 100) + '%' } })),
      ),
      h('h2', { class: 'q-text' }, q.q),
      optsWrap,
      feedback,
      footer,
    ));
  }

  function screenResult() {
    const pct = session.length ? Math.round(score / session.length * 100) : 0;
    go(h('div', { class: 'screen result' },
      flash
        ? h('h1', { class: 'play-title' }, t('done'))
        : h('div', { class: 'score-ring', style: { '--pct': pct } },
            h('div', { class: 'score-num' }, String(score)),
            h('div', { class: 'score-of' }, '/ ' + session.length)),
      flash ? null : h('p', { class: 'play-sub' }, t('yourScore') + ': ' + t('resultLine', { score, n: session.length })),
      h('div', { class: 'result-actions' },
        h('button', { class: 'btn btn-primary', onclick: () => { i = 0; score = 0; screenQuestion(); } }, t('playAgain')),
        exitButton(),
      ),
    ));
  }

  function exitButton() {
    if (opts.published) {
      // Quitar el #fragment y recargar para entrar al editor en limpio.
      return h('button', { class: 'btn btn-ghost', onclick: () => {
        history.replaceState(null, '', location.origin + location.pathname);
        location.reload();
      } }, t('makeYours'));
    }
    return h('button', { class: 'btn btn-ghost', onclick: () => opts.onExit && opts.onExit() }, t('backToEdit'));
  }

  screenStart();
  return root;
}
