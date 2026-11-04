/*
  This file lists the account-related requests our app can send to the backend.
  For now there is one: registering a new user.
  The register form will call registerUser() from here, so it never has to know
  the backend address or how to send a request.
*/

import { apiRequest } from './apiClient';
import type {LoginPayload, LoginResponse, RegisterPayload, User } from '../types/auth';

// Sends the new account data; the server replies with the created user (no token, no login)
export const registerUser = (payload: RegisterPayload) =>
  apiRequest<User>('/auth/register', { method: 'POST', body: payload });

/** Logs in (POST /auth/login). Returns the user and the token to use in later requests. */
export const loginUser = (payload: LoginPayload) =>
  apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: payload });

/** Ends the session (POST /auth/logout). Needs the token. */
export const logoutUser = (token: string) =>
  apiRequest<null>('/auth/logout', { method: 'POST', token });

/** Returns the logged-in user (GET /auth/user). Used to restore the session after a page reload. */
export const fetchCurrentUser = (token: string, signal?: AbortSignal) =>
  apiRequest<User>('/auth/user', { token, signal });