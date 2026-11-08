/*
  Collects all mock handlers into one list for the browser worker (browser.ts).
  Each group of endpoints lives in its own file, for example authHandlers.ts.
*/
import { http, HttpResponse } from 'msw';
import { authHandlers } from './authHandlers.ts';
import { projectHandlers } from './projectHandlers.ts';

export const handlers = [
  ...authHandlers,
  ...projectHandlers,
  http.get('*/api/hello', () => HttpResponse.json({ message: 'Hello World' })),
];
