import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:8080/api'

// Every test creates its own new user, so tests never depend on each other
function newUser() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
  return {
    name: `pw-${id}`,
    email: `pw-${id}@example.com`,
    password: 'TestPassword123',
  }
}

test('register a new user returns 201 and the user without a password', async ({ request }) => {
  const user = newUser()

  const response = await request.post(`${API_URL}/auth/register`, { data: user })

  expect(response.status()).toBe(201)
  const body = await response.json()
  expect(body.id).toBeTruthy()
  expect(body.name).toBe(user.name)
  expect(body.email).toBe(user.email)
  expect(body).not.toHaveProperty('password')
  expect(body).not.toHaveProperty('passwordHash')
})

test('register with an email that is already used returns 409 EMAIL_ALREADY_REGISTERED', async ({ request }) => {
  const user = newUser()
  await request.post(`${API_URL}/auth/register`, { data: user })

  // same email, different name
  const response = await request.post(`${API_URL}/auth/register`, {
    data: { ...user, name: `${user.name}-other` },
  })

  expect(response.status()).toBe(409)
  const body = await response.json()
  expect(body.error.code).toBe('EMAIL_ALREADY_REGISTERED')
})

test('register with a name that is already used returns 409 USERNAME_ALREADY_TAKEN', async ({ request }) => {
  const user = newUser()
  await request.post(`${API_URL}/auth/register`, { data: user })

  // same name, different email
  const response = await request.post(`${API_URL}/auth/register`, {
    data: { ...user, email: `other-${user.email}` },
  })

  expect(response.status()).toBe(409)
  const body = await response.json()
  expect(body.error.code).toBe('USERNAME_ALREADY_TAKEN')
})

test('register with an invalid email returns 422 VALIDATION_ERROR', async ({ request }) => {
  const user = newUser()

  const response = await request.post(`${API_URL}/auth/register`, {
    data: { ...user, email: 'not-an-email' },
  })

  expect(response.status()).toBe(422)
  const body = await response.json()
  expect(body.error.code).toBe('VALIDATION_ERROR')
})

test('register with a too short password returns 422 VALIDATION_ERROR', async ({ request }) => {
  const user = newUser()

  const response = await request.post(`${API_URL}/auth/register`, {
    data: { ...user, password: 'short' },
  })

  expect(response.status()).toBe(422)
  const body = await response.json()
  expect(body.error.code).toBe('VALIDATION_ERROR')
})

test('register without a body returns 400 INVALID_REQUEST', async ({ request }) => {
  const response = await request.post(`${API_URL}/auth/register`)

  expect(response.status()).toBe(400)
  const body = await response.json()
  expect(body.error.code).toBe('INVALID_REQUEST')
})

test('a newly registered user can log in', async ({ request }) => {
  const user = newUser()
  await request.post(`${API_URL}/auth/register`, { data: user })

  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: user.email, password: user.password },
  })

  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(typeof body.token).toBe('string')
  expect(body.user.email).toBe(user.email)
})