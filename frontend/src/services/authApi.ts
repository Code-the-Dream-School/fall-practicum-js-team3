/*
  This file lists the account-related requests our app can send to the backend.
  For now there is one: registering a new user.
  The register form will call registerUser() from here, so it never has to know
  the backend address or how to send a request.
*/

import { apiRequest } from './apiClient';
import type { RegisterPayload, User } from '../types/auth';

// Sends the new account data; the server replies with the created user (no token, no login)
export const registerUser = (payload: RegisterPayload) =>
  apiRequest<User>('/auth/register', { method: 'POST', body: payload });