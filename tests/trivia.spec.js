import { test, expect } from '@playwright/test'

// Fija el idioma (es) para textos deterministas y arranca limpio. La app ahora
// arranca en modo juego; para los tests centrados en el editor forzamos
// `mode:'edit'` (default), salvo que el test abra una trivia por #fragment.
async function open(page, { hash = '', mode = 'edit' } = {}) {
  await page.addInitScript((mode) => {
    try {
      localStorage.setItem('trivia.lang', 'es')
      localStorage.removeItem('trivia.shim.trivia.current')
      localStorage.removeItem('trivia.play')
      if (mode) localStorage.setItem('trivia.ui', JSON.stringify({ mode }))
      else localStorage.removeItem('trivia.ui')
    } catch {}
  }, mode)
  await page.goto('/' + hash)
}

test('carga el editor con sus tres secciones', async ({ page }) => {
  await open(page)
  await expect(page.locator('.card-title')).toHaveCount(3)
  await expect(page.getByText('Preguntas', { exact: true })).toBeVisible()
})

test('valida el JSON y cuenta las preguntas', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Cargar ejemplo' }).click()
  await expect(page.locator('.json-status .ok')).toContainText('5')
  // JSON inválido → error
  await page.locator('textarea.code').fill('{ esto no es json')
  await expect(page.locator('.json-status .err')).toBeVisible()
})

test('juega un quiz hasta el resultado y muestra puntaje', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Cargar ejemplo' }).click()
  await page.getByRole('button', { name: 'Jugar' }).click()
  await page.getByRole('button', { name: 'Empezar' }).click()

  // Responder cada pregunta eligiendo la primera opción.
  for (let n = 0; n < 5; n++) {
    await expect(page.locator('.q-text')).toBeVisible()
    await page.locator('.opt:not([disabled])').first().click()
    await page.locator('.q-footer .btn').click()
  }
  await expect(page.locator('.score-ring')).toBeVisible()
  await expect(page.locator('.score-num')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Jugar de nuevo' })).toBeVisible()
})

test('modo flashcards revela la respuesta sin puntaje', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Cargar ejemplo' }).click()
  // cambiar a flashcards
  await page.getByRole('button', { name: 'Flashcards' }).click()
  await page.getByRole('button', { name: 'Jugar' }).click()
  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page.locator('.q-text')).toBeVisible()
  await page.getByRole('button', { name: 'Mostrar respuesta' }).click()
  await expect(page.locator('.opt.correct')).toHaveCount(1)
})

test('la paleta deriva de un solo color', async ({ page }) => {
  await open(page)
  await page.locator('input.hex').fill('#ff0000')
  await expect.poll(async () =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim())
  ).toBe('#ff0000')
})

test('el modo claro/oscuro cambia el esquema', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Claro', exact: true }).click()
  await expect.poll(async () =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('color-scheme').trim())
  ).toBe('light')
})

test('el generador de prompt produce texto copiable', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Generar prompt para IA' }).click()
  const out = page.locator('.modal textarea')
  await expect(out).toBeVisible()
  const val = await out.inputValue()
  expect(val).toContain('"type": "multiple"')
  expect(val.length).toBeGreaterThan(100)
})

test('publish: round-trip por #fragment abre en modo limpio', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Cargar ejemplo' }).click()
  // construir el enlace compartible desde el estado actual
  const url = await page.evaluate(async () => {
    const { url } = await window.__trivia.buildShareLink(window.__trivia.getConfig())
    return url
  })
  expect(url).toContain('#t=')
  const hash = url.slice(url.indexOf('#'))

  await open(page, { hash })
  // modo limpio: sin topbar, con pantalla de inicio
  await expect(page.locator('.topbar')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Empezar' })).toBeVisible()
})

test('arranca en modo juego, con engrane para editar', async ({ page }) => {
  await open(page, { mode: 'play' })
  // sin topbar: estamos en la pantalla de juego, con el engrane visible
  await expect(page.locator('.topbar')).toBeHidden()
  await expect(page.locator('.play')).toBeVisible()
  await expect(page.locator('.play-gear')).toBeVisible()
  // el engrane entra al editor
  await page.locator('.play-gear').click()
  await expect(page.locator('.card-title')).toHaveCount(3)
})

test('persiste el progreso de la partida al refrescar', async ({ page }) => {
  // init-script mínimo: sólo fija idioma y entra al editor la primera vez, sin
  // pisar el modo/estado de juego en recargas posteriores.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('trivia.lang', 'es')
      if (!localStorage.getItem('trivia.ui')) localStorage.setItem('trivia.ui', JSON.stringify({ mode: 'edit' }))
    } catch {}
  })
  await page.goto('/')
  // cargar preguntas y entrar al juego
  await page.getByRole('button', { name: 'Cargar ejemplo' }).click()
  await expect(page.locator('.json-status .ok')).toContainText('5')
  await page.getByRole('button', { name: 'Jugar' }).click()
  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page.locator('.q-progress')).toHaveText('Pregunta 1 de 5')
  await page.locator('.opt:not([disabled])').first().click()
  await page.locator('.q-footer .btn').click()
  await expect(page.locator('.q-progress')).toHaveText('Pregunta 2 de 5')
  // refrescar: arranca en modo juego y reanuda en la pregunta 2 (no al inicio)
  await page.reload()
  await expect(page.locator('.topbar')).toBeHidden()
  await expect(page.locator('.q-progress')).toHaveText('Pregunta 2 de 5')
})

test('encode/decode de la config preserva las preguntas', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Cargar ejemplo' }).click()
  const ok = await page.evaluate(async () => {
    const { url } = await window.__trivia.buildShareLink(window.__trivia.getConfig())
    location.hash = url.slice(url.indexOf('#'))
    const parsed = window.__trivia.parseSharedConfig()
    return parsed && parsed.questions.length === 5
  })
  expect(ok).toBe(true)
})
