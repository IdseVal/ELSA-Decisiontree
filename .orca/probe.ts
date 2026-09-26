import path from 'node:path'
import { chromium } from '@playwright/test'
import { ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from '../tests/browser/admin.ts'
import { BASE_PORT, serveStore, stopServers } from '../tests/browser/serve.ts'

const repo = path.resolve('.')
const dir = await buildDataDir({
  trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true }],
  accounts: [{ login: 'anna', name: 'Anna', password: 'annas first password' }],
})
const origin = await serveStore(dir, BASE_PORT + 95, ADMIN_ENV, path.join(repo, '.orca', 'probe-server.log'))
console.log('serving', origin, dir)
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
page.on('console', (m) => console.log('console:', m.type(), m.text()))
page.on('pageerror', (e) => console.log('pageerror:', e.message))
console.log('login', (await login(page, origin, 'admin', ADMIN_PASSWORD)).status)
const r = await page.goto(`${origin}/admin/trees/hidden-draft/full`)
console.log('status', r?.status(), page.url())
await page.waitForTimeout(1500)
await page.screenshot({ path: '.orca/probe-1.png' })
const fields = await page.locator('[data-field]').evaluateAll((els) => els.map((e) => e.getAttribute('data-field')))
console.log('fields', fields)
const title = page.locator('h1 textarea')
await title.click()
await page.waitForTimeout(300)
await page.screenshot({ path: '.orca/probe-2.png' })
console.log('rim', await page.locator('.editor-rim').innerText().catch(() => 'none'))
await title.press('End')
await title.type(' plus twelve!')
await page.waitForTimeout(1500)
console.log('status:', await page.locator('.editor-status').innerText())
await page.screenshot({ path: '.orca/probe-3.png' })
const desc = page.locator('.editor-field--rich').first()
await desc.click()
await page.waitForTimeout(300)
console.log('desc focused textarea:', await page.locator('.editor-field--rich textarea').first().count())
await page.screenshot({ path: '.orca/probe-4.png' })
await page.keyboard.press('Tab')
await page.waitForTimeout(1200)
console.log('status:', await page.locator('.editor-status').innerText())
await page.reload()
await page.waitForTimeout(800)
console.log('title after reload:', await page.locator('h1 textarea').inputValue())
const m = await page.evaluate(() => {
  const d = document.documentElement
  const over: string[] = []
  for (const el of document.querySelectorAll('*')) {
    if (el.matches('[data-scroll-box], [data-clamp], [data-carousel-strip]')) continue
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) over.push(`${el.tagName}.${[...el.classList].join('.')} ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`)
  }
  return { sh: d.scrollHeight, sw: d.scrollWidth, ih: innerHeight, iw: innerWidth, over }
})
console.log('measure', JSON.stringify(m))
await browser.close()
await stopServers()
