//Every request in the app will go through this one file, so error handling,
// the server address and the token are written once, not copied into every component.
// It also turns server errors into one ApiError that the forms can read.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

//An error that keeps the HTTP status and the API error code, so forms can react to them
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}


// The error format the API sends back: { error: { code, message } }
interface ErrorBody {
  error?: { code?: string; message?: string };
}

// Optional settings for one request
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}
// The one function every API call goes through
export async function request<T>(
  path: string,
  { method = 'GET', body, token, signal }: RequestOptions = {}
): Promise<T> {
    // Build the headers: JSON for requests with a body, and the token when logged in
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      signal,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // an aborted request is not an error to show; let the caller handle it
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Please try again.');
  }

  if (response.status === 204) return null as T; // success without a body

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // the response had no JSON body
  }
// Turn a failed response into an ApiError with the server's code and message
  if (!response.ok) {
    const apiError = (data as ErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      apiError?.code ?? 'UNKNOWN_ERROR',
      apiError?.message ?? 'Something went wrong. Please try again.'
    );
  }
  return data as T;
}