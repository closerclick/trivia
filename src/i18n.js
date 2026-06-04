// Bilingüe es/en (§9). La preferencia de idioma es una pref efímera de UI →
// localStorage. El contenido de la trivia va en el idioma que cargue el usuario.
const DICT = {
  es: {
    play: 'Jugar', publish: 'Publicar', edit: 'Editar', install: 'Instalar',
    copyLink: 'Copiar enlace', linkCopied: '¡Enlace copiado!',
    linkDropped: 'Enlace copiado (las imágenes subidas no se incluyen; usa URLs para compartirlas).',

    secContent: 'Preguntas', secAppearance: 'Apariencia', secGame: 'Juego',

    title: 'Título de la trivia', titlePh: 'Mi trivia',
    jsonLabel: 'JSON de preguntas', jsonPh: 'Pega aquí el JSON de preguntas…',
    genPrompt: 'Generar prompt para IA', loadSample: 'Cargar ejemplo', clear: 'Vaciar',
    validCount: '{n} pregunta(s) válida(s)', invalidJson: 'JSON inválido: {err}',
    noQuestions: 'Sin preguntas todavía',

    color: 'Color principal', theme: 'Tema', dark: 'Oscuro', light: 'Claro',
    logo: 'Logo', bgWeb: 'Fondo (web)', bgMobile: 'Fondo (móvil)',
    imgUrlPh: 'URL de imagen (https://…)', upload: 'Subir', remove: 'Quitar',
    uploadHint: 'Las imágenes subidas se guardan en tu store (local a tu navegador). Para que se vean al compartir el enlace, usa una URL.',

    gameMode: 'Modo de juego', modeQuiz: 'Quiz (puntaje)', modeFlash: 'Flashcards',
    modeQuizDesc: 'Opción múltiple y verdadero/falso con puntaje.',
    modeFlashDesc: 'Pregunta → revelar respuesta. Sin puntaje (repaso).',
    count: 'Preguntas a mostrar', countAll: 'Todas',
    shuffleQ: 'Barajar preguntas', shuffleO: 'Barajar opciones',
    showCorrect: 'Mostrar la respuesta correcta',

    start: 'Empezar', next: 'Siguiente', reveal: 'Mostrar respuesta',
    finish: 'Ver resultado', question: 'Pregunta {i} de {n}',
    correct: '¡Correcto!', incorrect: 'Incorrecto',
    yourScore: 'Tu puntaje', resultLine: '{score} de {n}', done: '¡Listo!',
    playAgain: 'Jugar de nuevo', endGame: 'Finalizar', backToEdit: 'Volver a editar',
    makeYours: 'Crea tu propia trivia',
    tTrue: 'Verdadero', tFalse: 'Falso',
    noQuestionsPlay: 'Esta trivia no tiene preguntas.',

    promptTitle: 'Prompt para generar el JSON con IA',
    promptIntro: 'Ajusta el tema y la cantidad, copia el prompt y pégalo en tu IA preferida. Te devolverá el JSON; pégalo en «JSON de preguntas».',
    topic: 'Tema', howMany: 'Cantidad', includeTF: 'Incluir verdadero/falso',
    copy: 'Copiar', copied: '¡Copiado!', close: 'Cerrar',
    topicPh: 'Capitales del mundo',
  },
  en: {
    play: 'Play', publish: 'Publish', edit: 'Edit', install: 'Install',
    copyLink: 'Copy link', linkCopied: 'Link copied!',
    linkDropped: 'Link copied (uploaded images are not included; use URLs to share them).',

    secContent: 'Questions', secAppearance: 'Appearance', secGame: 'Game',

    title: 'Trivia title', titlePh: 'My trivia',
    jsonLabel: 'Questions JSON', jsonPh: 'Paste the questions JSON here…',
    genPrompt: 'Generate AI prompt', loadSample: 'Load sample', clear: 'Clear',
    validCount: '{n} valid question(s)', invalidJson: 'Invalid JSON: {err}',
    noQuestions: 'No questions yet',

    color: 'Primary color', theme: 'Theme', dark: 'Dark', light: 'Light',
    logo: 'Logo', bgWeb: 'Background (web)', bgMobile: 'Background (mobile)',
    imgUrlPh: 'Image URL (https://…)', upload: 'Upload', remove: 'Remove',
    uploadHint: 'Uploaded images are saved in your store (local to your browser). To show them when sharing the link, use a URL.',

    gameMode: 'Game mode', modeQuiz: 'Quiz (scored)', modeFlash: 'Flashcards',
    modeQuizDesc: 'Multiple choice and true/false with score.',
    modeFlashDesc: 'Question → reveal answer. No score (study).',
    count: 'Questions to show', countAll: 'All',
    shuffleQ: 'Shuffle questions', shuffleO: 'Shuffle options',
    showCorrect: 'Show the correct answer',

    start: 'Start', next: 'Next', reveal: 'Reveal answer',
    finish: 'See result', question: 'Question {i} of {n}',
    correct: 'Correct!', incorrect: 'Incorrect',
    yourScore: 'Your score', resultLine: '{score} of {n}', done: 'Done!',
    playAgain: 'Play again', endGame: 'Finish', backToEdit: 'Back to edit',
    makeYours: 'Create your own trivia',
    tTrue: 'True', tFalse: 'False',
    noQuestionsPlay: 'This trivia has no questions.',

    promptTitle: 'Prompt to generate the JSON with AI',
    promptIntro: 'Set the topic and count, copy the prompt and paste it into your favorite AI. It will return the JSON; paste it into “Questions JSON”.',
    topic: 'Topic', howMany: 'Count', includeTF: 'Include true/false',
    copy: 'Copy', copied: 'Copied!', close: 'Close',
    topicPh: 'World capitals',
  },
};

const LS_LANG = 'trivia.lang';
let lang = (() => {
  try { const s = localStorage.getItem(LS_LANG); if (s === 'es' || s === 'en') return s; } catch {}
  return (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
})();

export function getLang() { return lang; }
export function setLang(l) {
  lang = l === 'en' ? 'en' : 'es';
  try { localStorage.setItem(LS_LANG, lang); } catch {}
}
export function toggleLang() { setLang(lang === 'es' ? 'en' : 'es'); return lang; }

export function t(key, params) {
  let s = (DICT[lang] && DICT[lang][key]) ?? (DICT.es[key]) ?? key;
  if (params) for (const k in params) s = s.replaceAll('{' + k + '}', params[k]);
  return s;
}
