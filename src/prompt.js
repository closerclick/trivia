// Generador de prompt para pegar en una IA y obtener el JSON de preguntas.
// El tipo de cada pregunta ("multiple" o "boolean") se define POR PREGUNTA en su
// JSON; no hay un modo global. El prompt documenta ambos para que la IA elija.
export function generatePrompt({ topic, count, lang }) {
  const n = Math.max(1, Math.min(100, parseInt(count, 10) || 10));
  const tp = (topic || '').trim() || (lang === 'en' ? 'general knowledge' : 'cultura general');

  if (lang === 'en') {
    return `Create a trivia quiz about "${tp}" with ${n} questions.
Return ONLY valid JSON, no extra text, no markdown fences, with this exact shape:

{
  "title": "Quiz title",
  "questions": [
    {
      "q": "Question text",
      "type": "multiple",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Short explanation (optional)"
    },
    {
      "q": "A true/false statement",
      "type": "boolean",
      "answer": true,
      "explanation": "Optional"
    }
  ]
}

Rules:
- Each question sets its own "type": use "multiple" or "boolean" per question as fits the content.
- "type": "multiple" → 3 or 4 entries in "options"; "answer" is the 0-based INDEX of the correct option.
- "type": "boolean" → no "options"; "answer" is true or false.
- Vary the position of the correct answer; exactly one correct answer per question.
- Clear, unambiguous questions and concise options.
- Write the questions in English.
- Output the ${n} questions inside "questions".`;
  }

  return `Genera una trivia sobre "${tp}" con ${n} preguntas.
Devuelve SOLO JSON válido, sin texto adicional, sin bloques de markdown, con esta forma exacta:

{
  "title": "Título de la trivia",
  "questions": [
    {
      "q": "Texto de la pregunta",
      "type": "multiple",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": 0,
      "explanation": "Explicación breve (opcional)"
    },
    {
      "q": "Una afirmación de verdadero o falso",
      "type": "boolean",
      "answer": true,
      "explanation": "Opcional"
    }
  ]
}

Reglas:
- Cada pregunta define su propio "type": usa "multiple" o "boolean" según convenga al contenido.
- "type": "multiple" → 3 o 4 elementos en "options"; "answer" es el ÍNDICE (empezando en 0) de la opción correcta.
- "type": "boolean" → sin "options"; "answer" es true o false.
- Varía la posición de la respuesta correcta; exactamente una correcta por pregunta.
- Preguntas claras y sin ambigüedad, opciones concisas.
- Escribe las preguntas en español.
- Genera las ${n} preguntas dentro de "questions".`;
}
