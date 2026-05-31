# Trivia

Trivia **configurable** del ecosistema [Closer Click](https://closer.click/). Pegás
un **JSON de preguntas**, elegís un **color** (de ahí se deriva toda la paleta) y
**modo claro/oscuro**, ponés tu **logo** y **fondos** para móvil y web, elegís el
**modo de juego** (quiz con puntaje, verdadero/falso o flashcards) y cuántas
preguntas mostrar, y **publicás** un enlace limpio para jugar.

- **Generador de prompt para IA**: copiás un prompt listo para pegar en cualquier
  IA y te devuelve el JSON de preguntas con el formato correcto.
- **Bilingüe** es/en (la interfaz; las preguntas van en el idioma que cargues).
- **PWA**: instalable y funciona sin conexión.

## Privacidad

Tus trivias (preguntas, imágenes, configuración) **persisten en tu navegador** a
través de [`store.closer.click`](https://store.closer.click) (vault del ecosistema,
IndexedDB con cuota grande); las prefs efímeras de UI van en `localStorage`. **Nada
se envía a ningún servidor.** El enlace para compartir codifica la trivia en el
**`#fragment`** de la URL, que no llega al servidor ni es indexable. Las imágenes
**subidas** se guardan en tu store (local a tu navegador): para que se vean al
compartir, usá **URLs** de imagen.

## Stack

Vite **sin framework** (JS plano). Es la plantilla de referencia del ecosistema
para apps Vite sin Vue. Deploy a `trivia.closer.click` por GitHub Pages (Actions).

```bash
npm install
npm run dev      # desarrollo
npm run build    # genera dist/ (lo que se publica)
```

## Filosofía

El eje del ecosistema **[CloserClick](https://closer.click)** es el **autohosteo** y
el **control sobre la propia información**: qué comparto, cómo lo comparto y cuándo
lo comparto.

> **Tu información, en tu servidor, bajo tus reglas.**
> Lo que es tuyo, se queda contigo. Tú decides **qué** compartes, **cómo** lo
> compartes y **cuándo** lo compartes. Sin intermediarios, sin nubes ajenas, sin
> letra pequeña.

---
