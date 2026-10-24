/*
  Auth store: remembers who is logged in, so any component can read it.

  What it holds:
  - user: the logged-in user, or null when nobody is logged in
  - token: the key the server gave us at login, sent with later requests
  - isLoading: true until the app has checked at startup whether the saved token is still valid

  What it does:
  - login(): sends the credentials, then saves the user and the token
  - logout(): tells the server, then forgets the user and the token
  - loadUser(): at startup, asks the server who the saved token belongs to

  The token is also saved in the browser (localStorage), so a page reload keeps you logged in.
*/
import { create } from 'zustand'
import { fetchCurrentUser, loginUser, logoutUser } from '../services/authApi'
import type { LoginPayload, User } from '../types/auth'

// The name under which the token is saved in the browser
const TOKEN_STORAGE_KEY = 'blockcad_token'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  loadUser: (signal?: AbortSignal) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_STORAGE_KEY), // a token saved from an earlier visit, if any
  isLoading: true,

  async login(credentials) {
    // If the server refuses, this throws, and the login form shows the error
    const { token, user } = await loginUser(credentials)
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    set({ token, user })
  },

  async logout() {
    const { token } = get()
    try {
      if (token) await logoutUser(token)
    } catch {
      // Even if the server call fails, the user must still be logged out here
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    set({ token: null, user: null })
  },

  async loadUser(signal) {
    const { token } = get()
    if (!token) {
      // Nobody was logged in, so there is nothing to check
      set({ isLoading: false })
      return
    }
    try {
      const user = await fetchCurrentUser(token, signal)
      set({ user, isLoading: false })
    } catch {
      // The request was cancelled because the component went away
      // isLoading stays true on purpose: the startup effect in AppRoutes runs loadUser
      // again (for example in React StrictMode), and that new call sets isLoading to false.
      if (signal?.aborted) return
      // The token is invalid or expired: forget it
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      set({ token: null, user: null, isLoading: false })
    }
  },
}))