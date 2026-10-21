/*
  Collects all mock handlers into one list for the browser worker (browser.ts).
  Each group of endpoints lives in its own file, for example authHandlers.ts.
*/
import { authHandlers } from './authHandlers.ts'

export const handlers = [...authHandlers]