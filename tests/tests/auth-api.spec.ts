import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:8080/api'
const TEST_USER_EMAIL = 'test-user@example.com'
const TEST_USER_PASSWORD = 'TestPassword123'

test('current user without a token returns 401 UNAUTHENTICATED', async ({ request }) => {
  const response = await request.get(`${API_URL}/auth/user`)
  expect(response.status()).toBe(401)

  const body = await response.json()
  expect(body.error.code).toBe('UNAUTHENTICATED')
})

test('login with an unknown email returns 401 INVALID_CREDENTIALS', async ({ request }) => {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: 'nobody-here@example.com', password: 'WrongPassword123' },
  })
  expect(response.status()).toBe(401)

  const body = await response.json()
  expect(body.error.code).toBe('INVALID_CREDENTIALS')
})

test('login without a password returns 422 VALIDATION_ERROR', async ({ request }) => {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: 'person@example.com' },
  })
  expect(response.status()).toBe(422)

  const body = await response.json()
  expect(body.error.code).toBe('VALIDATION_ERROR')
})

test('login with the test user returns 200, a token and the user', async ({ request }) => {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
  })
  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(typeof body.token).toBe('string')
  expect(body.user.email).toBe(TEST_USER_EMAIL)
  expect(body.user).not.toHaveProperty('passwordHash')
})