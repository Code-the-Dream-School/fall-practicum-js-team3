/*
  Mock authentication API (development only).

  A "mock" is a fake backend that runs inside the browser, so the frontend can be
  built and tested before the real backend is ready. It is switched on with
  VITE_USE_MOCKS=true and is never used in production.

  Each handler below imitates one real endpoint and answers exactly as the API
  documentation says: the same status codes, error codes and field names.
  Passwords are never stored: the mock only checks that one was sent. So login accepts any
  password for an email that registered earlier.
  Right now it contains registration, login, logout and the current user.
*/

import { http, HttpResponse } from 'msw'
import type { LoginPayload, RegisterPayload, User } from '../types/auth.ts'

// The fake database of accounts. It lives in memory and is emptied when the page reloads
const registeredUsers: User[] = []

// Builds an error answer in the same format as the real API: { error: { code, message } }
const errorResponse = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status })

// The fake token for a user. The real backend signs a JWT; the mock only needs something recognizable
const mockTokenFor = (user: User) => `mock-token-${user.id}`

// Finds the user a request belongs to, from the "Authorization: Bearer <token>" header
const findUserByToken = (request: Request) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  return registeredUsers.find((user) => mockTokenFor(user) === token)
}

export const authHandlers = [
// POST /api/auth/register: creates a new account
  http.post('*/api/auth/register', async ({ request }) => {
    const { name, email, password } = (await request.json()) as Partial<RegisterPayload>

    // 1. A required field is missing -> 422 Validation error
    if (!name || !email || !password) {
      return errorResponse(422, 'VALIDATION_ERROR', 'name, email and password are required.')
    }

    // 2. This email already has an account -> 409 Conflict
    if (registeredUsers.some((user) => user.email === email.toLowerCase())) {
      return errorResponse(409, 'EMAIL_ALREADY_REGISTERED', 'Email is already in use.')
    }

    // 3. Everything is fine -> save the user
    const newUser: User = {
      id: `user_${registeredUsers.length + 1}`,
      name,
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
    }
    registeredUsers.push(newUser)

    // 4. Answer 201 Created with the user, without the password and without a token:
    //    registering does not log the user in
    return HttpResponse.json(
      { id: newUser.id, name: newUser.name, email: newUser.email, createdAt: newUser.createdAt },
      { status: 201 },
    )
  }),

// POST /api/auth/login: signs a registered user in
  http.post('*/api/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as Partial<LoginPayload>

    // 1. A required field is missing -> 422 Validation error
    if (!email || !password) {
      return errorResponse(422, 'VALIDATION_ERROR', 'email and password are required.')
    }

    // 2. No account with this email -> 401. The message does not say which part was wrong
    const user = registeredUsers.find((registered) => registered.email === email.toLowerCase())
    if (!user) {
      return errorResponse(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
    }

    // 3. Success -> 200 with the token and the user. Passwords are not stored, so any password works
    return HttpResponse.json({ token: mockTokenFor(user), user })
  }),

  // POST /api/auth/logout: ends the session
  http.post('*/api/auth/logout', ({ request }) => {
    // 401 when there is no valid token, as the API documentation says
    if (!findUserByToken(request)) {
      return errorResponse(401, 'UNAUTHENTICATED', 'No valid session.')
    }
    // 204 No Content: success without a body
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/auth/user: returns the logged-in user
  http.get('*/api/auth/user', ({ request }) => {
    const user = findUserByToken(request)
    if (!user) {
      return errorResponse(401, 'UNAUTHENTICATED', 'No valid session.')
    }
    return HttpResponse.json(user)
  }),
]