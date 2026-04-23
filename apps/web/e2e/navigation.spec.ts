import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('homepage loads with hero and CTA buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('The Registry for')).toBeVisible()
    await expect(page.getByText('Trustless AI Agents')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse Registry' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Register Agent' })).toBeVisible()
  })

  test('agents page loads and shows registry', async ({ page }) => {
    await page.goto('/agents')
    await expect(page.getByText('Statemate')).toBeVisible()
    await expect(page.getByPlaceholder('Search agents')).toBeVisible()
  })

  test('register page shows connect wallet prompt', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Register Agent')).toBeVisible()
    await expect(page.getByText('Connect Your Wallet')).toBeVisible()
  })

  test('explorer page loads with event log', async ({ page }) => {
    await page.goto('/explorer')
    await expect(page.getByText('Transaction Explorer')).toBeVisible()
    await expect(page.getByText('Event Log')).toBeVisible()
  })

  test('reputation page loads with dashboard', async ({ page }) => {
    await page.goto('/reputation')
    await expect(page.getByText('Reputation Dashboard')).toBeVisible()
    await expect(page.getByText('Top Agents')).toBeVisible()
  })

  test('validation page loads with steps', async ({ page }) => {
    await page.goto('/validation')
    await expect(page.getByText('Validation Center')).toBeVisible()
    await expect(page.getByText('Request Validation')).toBeVisible()
  })

  test('docs page loads with API reference', async ({ page }) => {
    await page.goto('/docs')
    await expect(page.getByText('API & SDK Reference')).toBeVisible()
    await expect(page.getByText('SDK Quick Start')).toBeVisible()
  })

  test('payments page loads with form', async ({ page }) => {
    await page.goto('/payments')
    await expect(page.getByText('Agent Payments')).toBeVisible()
    await expect(page.getByText('Connect your wallet to send payments')).toBeVisible()
  })

  test('agent detail page loads for agent #1', async ({ page }) => {
    await page.goto('/agents/1')
    await expect(page.getByText('Agent #1')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('API Routes', () => {
  test('GET /api/v1/agents returns JSON', async ({ request }) => {
    const response = await request.get('/api/v1/agents?pageSize=2')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('hasMore')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('GET /api/v1/agents/1 returns agent detail', async ({ request }) => {
    const response = await request.get('/api/v1/agents/1')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('agentId', '1')
    expect(data).toHaveProperty('owner')
    expect(data).toHaveProperty('tokenURI')
  })

  test('GET /api/v1/agents/999999 returns 404', async ({ request }) => {
    const response = await request.get('/api/v1/agents/999999')
    expect(response.status()).toBe(404)
  })
})
