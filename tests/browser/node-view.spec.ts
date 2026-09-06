/**
 * The Node view in a real browser: what markup alone cannot show -- what a click does,
 * which files the browser asks for, and whether a keyboard reaches everything.
 *
 * The server serves `trees/ai-act-example` (see playwright.config.ts).
 */
import { expect, test, type Page } from '@playwright/test'

const START = '/ai-act-example/start'

/** Every image file the browser asked the server for while `act` ran. */
async function imageRequests(page: Page, act: () => Promise<unknown>): Promise<string[]> {
  const asked: string[] = []
  const listen = (request: { url: () => string }): void => {
    const match = /\/images\/([^?]+)/.exec(request.url())
    if (match?.[1]) asked.push(match[1])
  }
  page.on('request', listen)
  try {
    await act()
    // Give a lazy image that scrolled into view its chance to be requested.
    await page.waitForLoadState('networkidle')
  } finally {
    page.off('request', listen)
  }
  return asked
}

test('the walk works by clicking: yes, an Option, and back', async ({ page }) => {
  await page.goto(START)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Is your AI system within the reach of the AI Act?',
  )

  await page.getByRole('link', { name: 'Yes', exact: true }).click()
  await expect(page).toHaveURL('/ai-act-example/start/prohibited-practices')

  await page.getByRole('link', { name: 'Social scoring' }).click()
  await expect(page).toHaveURL('/ai-act-example/start/prohibited-practices/social-scoring')
  await expect(page.getByText('This step only explains.')).toBeVisible()

  await page.getByRole('link', { name: 'Back' }).click()
  await expect(page).toHaveURL('/ai-act-example/start/prohibited-practices')
})

test('no answers a different Node than yes', async ({ page }) => {
  await page.goto(START)
  await page.getByRole('link', { name: 'No', exact: true }).click()

  await expect(page).toHaveURL('/ai-act-example/start/outside-scope')
})

test('a Terminal Node shows its outcome and offers no yes or no', async ({ page }) => {
  await page.goto('/ai-act-example/start/outside-scope')

  await expect(page.locator('.outcome')).toHaveText('Does not apply')
  await expect(page.getByRole('link', { name: 'Yes', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'No', exact: true })).toHaveCount(0)
})

test('the disclaimer is in the HTML the server sends for every Node page', async ({ page }) => {
  // The response body, not the rendered DOM: the promise is that the disclaimer is in the
  // document, so a reader without JavaScript and a reader of the source both see it.
  for (const url of [
    START,
    '/ai-act-example/start/prohibited-practices',
    '/ai-act-example/start/prohibited-practices/social-scoring',
    '/ai-act-example/start/outside-scope',
  ]) {
    const response = await page.request.get(url)
    const html = await response.text()

    expect(response.status(), url).toBe(200)
    expect(html, url).toContain('<footer class="disclaimer"')
    expect(html, url).toContain('This is not legal advice.')
  }
})

test('the 404 sends its status in the response and its body in the client payload', async ({ page }) => {
  // The one exception to "complete HTML", amended into docs/specs/application.md 4.3 by the
  // owner on PR #17: Next.js answers a notFound() from a dynamically rendered route with its
  // own error shell plus an RSC payload. This pins both halves of what is actually served, so
  // the day a Next.js release renders the boundary into the document, this fails loudly and
  // the exception can be taken back out of the spec.
  const response = await page.request.get('/ai-act-example/no-such-node')
  const html = await response.text()

  expect(response.status()).toBe(404)
  expect(html).toContain('<html id="__next_error__">')
  expect(html).not.toContain('<h1')
  expect(html).not.toContain('<footer class="disclaimer"')
  // The page did render on the server -- it travels as data next to the shell, not as markup.
  expect(html).toContain('This step does not exist')

  // With JavaScript, the client bundle paints the page the spec describes.
  await page.goto('/ai-act-example/no-such-node')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This step does not exist')
  await expect(page.locator('.disclaimer')).toContainText('This is not legal advice.')
})

test('clicking a thumbnail shows the image larger with its description and credit', async ({ page }) => {
  await page.goto(START)
  const enlarged = page.locator('dialog.enlarged')
  await expect(enlarged).toBeHidden()

  await page.locator('.thumbnail').first().click()

  await expect(enlarged).toBeVisible()
  // The overlay is announced by the image it shows, not as a bare "dialog".
  await expect(
    page.getByRole('dialog', { name: 'Map of the European Union member states' }),
  ).toBeVisible()
  await expect(enlarged).toContainText('Map of the European Union member states')
  await expect(enlarged).toContainText('Map: Example Cartography, CC BY 4.0')
  const enlargedImage = enlarged.locator('img')
  await expect(enlargedImage).toHaveAttribute('src', '/images/eu-map.png')

  // The example Tree's images are 8x8 placeholders, so "larger" cannot be measured from
  // this fixture. What the view promises is that the enlarged image is not cropped into
  // the thumbnail's fixed box but may grow to two thirds of the window.
  const thumbnailBox = await page.locator('.thumbnail img').first().evaluate((image) => {
    const style = getComputedStyle(image)
    return { width: style.width, height: style.height, fit: style.objectFit }
  })
  const room = await enlargedImage.evaluate((image) => getComputedStyle(image).maxHeight)

  expect(thumbnailBox).toEqual({ width: '136px', height: '96px', fit: 'cover' })
  expect(parseFloat(room)).toBeGreaterThan(parseFloat(thumbnailBox.height))
})

test('Escape closes the enlarged image, and so does a click outside it', async ({ page }) => {
  await page.goto(START)
  const enlarged = page.locator('dialog.enlarged')

  await page.locator('.thumbnail').first().click()
  await expect(enlarged).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(enlarged).toBeHidden()

  await page.locator('.thumbnail').first().click()
  await expect(enlarged).toBeVisible()
  // The backdrop of a modal dialog reports the dialog itself as the click target.
  await page.mouse.click(4, 4)
  await expect(enlarged).toBeHidden()
})

test('the browser asks for the images of the Node on screen and no others', async ({ page }) => {
  const onStart = await imageRequests(page, async () => {
    await page.goto(START)
    await page.mouse.wheel(0, 2000)
  })

  expect(new Set(onStart)).toEqual(new Set(['eu-map.png']))

  const onOptions = await imageRequests(page, async () => {
    await page.goto('/ai-act-example/prohibited-practices')
    await page.mouse.wheel(0, 2000)
  })

  // The Options of this Node carry one image; the previous Node's image is not asked for.
  expect(new Set(onOptions)).toEqual(new Set(['scoreboard.png']))
})

test('enlarging a thumbnail fetches nothing new', async ({ page }) => {
  await page.goto(START)
  await page.waitForLoadState('networkidle')

  const whileEnlarging = await imageRequests(page, async () => {
    await page.locator('.thumbnail').first().click()
    await expect(page.locator('dialog.enlarged')).toBeVisible()
  })

  expect(whileEnlarging).toEqual([])
})

test('a keyboard reaches the thumbnail, the enlarged view and the Answers', async ({ page }) => {
  await page.goto(START)

  // Tab through the page and collect what the browser stops at.
  const stops: string[] = []
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab')
    stops.push(
      await page.evaluate(() => {
        const active = document.activeElement
        return active ? `${active.tagName.toLowerCase()}.${active.className}`.trim() : ''
      }),
    )
  }

  expect(stops).toContain('a.thumbnail')
  expect(stops).toContain('a.answer answer--yes')
  expect(stops).toContain('a.answer answer--no')

  // The thumbnail opens with the keyboard, and the enlarged view closes with it.
  await page.locator('.thumbnail').first().focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('dialog.enlarged')).toBeVisible()
  await expect(page.locator('button.close')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('dialog.enlarged')).toBeHidden()
  await expect(page.locator('.thumbnail').first()).toBeFocused()
})

test('the Options of a Node are reachable by keyboard', async ({ page }) => {
  await page.goto('/ai-act-example/prohibited-practices')

  await page.locator('.option').first().focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL('/ai-act-example/prohibited-practices/social-scoring')
})

test('an unknown Node answers 404 with a way back to the start', async ({ page }) => {
  const response = await page.goto('/ai-act-example/no-such-node')

  expect(response?.status()).toBe(404)
  await page.getByRole('link', { name: 'Start' }).click()
  await expect(page).toHaveURL(START)
})

test('the address of the Tree redirects to its root Node', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(START)

  await page.goto('/ai-act-example')
  await expect(page).toHaveURL(START)
})

test('the image route serves a Tree image with the headers that make it safe', async ({ page }) => {
  const response = await page.request.get('/images/eu-map.png')
  const headers = response.headers()
  const body = await response.body()

  expect(response.status()).toBe(200)
  expect(headers['content-type']).toBe('image/png')
  expect(headers['cache-control']).toBe('public, max-age=3600')
  // A Tree's images come from third-party authors: an SVG opened on its own must be able to
  // run nothing on this origin, and no browser may guess a different type than the route says.
  expect(headers['content-security-policy']).toBe("default-src 'none'; sandbox")
  expect(headers['x-content-type-options']).toBe('nosniff')
  // The bytes are the file, not an error page: the PNG signature.
  expect([...body.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
})

test('the image route answers 404 for a name the Tree does not have', async ({ page }) => {
  for (const name of [
    'nope.png',
    'eu-map.PNG',
    '..%2F..%2Fpackage.json',
    '%2e%2e%2f%2e%2e%2fpackage.json',
    'eu-map.png%00.txt',
  ]) {
    const response = await page.request.get(`/images/${name}`)

    expect(response.status(), name).toBe(404)
    expect(response.headers()['content-type'] ?? '', name).not.toContain('image')
  }
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('a Node page is whole: its Answers, its thumbnail and its disclaimer all work', async ({ page }) => {
    await page.goto(START)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Is your AI system within the reach of the AI Act?',
    )
    await expect(page.locator('.disclaimer')).toContainText('This is not legal advice.')
    await expect(page.getByRole('link', { name: 'Yes', exact: true })).toHaveAttribute(
      'href',
      '/ai-act-example/start/prohibited-practices',
    )
    await expect(page.getByRole('link', { name: 'No', exact: true })).toHaveAttribute(
      'href',
      '/ai-act-example/start/outside-scope',
    )
    // The enlarge is a client component; without it the thumbnail is still a link to the file.
    await expect(page.locator('.thumbnail').first()).toHaveAttribute('href', '/images/eu-map.png')

    await page.getByRole('link', { name: 'Yes', exact: true }).click()
    await expect(page).toHaveURL('/ai-act-example/start/prohibited-practices')

    // With the enlarge unavailable the click is not intercepted, so it opens the file.
    await page.goto(START)
    await page.locator('.thumbnail').first().click()
    await expect(page).toHaveURL('/images/eu-map.png')
  })
})

test('nothing about the reader is stored', async ({ page, context }) => {
  await page.goto(START)
  await page.locator('.thumbnail').first().click()

  expect(await context.cookies()).toEqual([])
  expect(
    await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 })
})
