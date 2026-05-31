// Trivia de ejemplo para que la app no arranque vacía y para demostrar el formato.
export function sampleTrivia(lang) {
  if (lang === 'en') {
    return {
      title: 'General knowledge',
      questions: [
        { q: 'What is the capital of France?', type: 'multiple', options: ['Madrid', 'Paris', 'Rome', 'Berlin'], answer: 1, explanation: 'Paris has been the capital of France since the Middle Ages.' },
        { q: 'The Pacific is the largest ocean on Earth.', type: 'boolean', answer: true },
        { q: 'Which planet is known as the Red Planet?', type: 'multiple', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], answer: 2 },
        { q: 'Water boils at 50 °C at sea level.', type: 'boolean', answer: false, explanation: 'It boils at 100 °C at sea level.' },
        { q: 'How many continents are there?', type: 'multiple', options: ['5', '6', '7', '8'], answer: 2 },
      ],
    };
  }
  return {
    title: 'Cultura general',
    questions: [
      { q: '¿Cuál es la capital de Francia?', type: 'multiple', options: ['Madrid', 'París', 'Roma', 'Berlín'], answer: 1, explanation: 'París es la capital de Francia desde la Edad Media.' },
      { q: 'El Pacífico es el océano más grande de la Tierra.', type: 'boolean', answer: true },
      { q: '¿Qué planeta es conocido como el Planeta Rojo?', type: 'multiple', options: ['Venus', 'Júpiter', 'Marte', 'Saturno'], answer: 2 },
      { q: 'El agua hierve a 50 °C a nivel del mar.', type: 'boolean', answer: false, explanation: 'Hierve a 100 °C a nivel del mar.' },
      { q: '¿Cuántos continentes hay?', type: 'multiple', options: ['5', '6', '7', '8'], answer: 2 },
    ],
  };
}
