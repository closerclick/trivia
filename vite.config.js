import { defineConfig } from 'vite'

// base './' → rutas relativas, para servir bajo el subdominio trivia.closer.click
// (y también bajo el mirror closerclick.github.io/trivia/). Los assets PWA viven
// en public/ y se copian tal cual a la raíz de dist/.
export default defineConfig({
  base: './',
  server: { port: 3200, host: true }
})
