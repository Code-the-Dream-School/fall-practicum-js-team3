/*
  Starts the fake backend in the browser, using the handlers from handlers.ts.
  It is only loaded when VITE_USE_MOCKS is 'true' (see main.tsx).
*/
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers.ts'

export const worker = setupWorker(...handlers)