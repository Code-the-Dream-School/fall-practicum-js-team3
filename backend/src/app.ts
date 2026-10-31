import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ApiError } from './errors/ApiError';
import authRoutes from './routes/authRoutes';

const app: Application = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

// Shared security and request middleware.
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
    });
  },
}));

// Auth routes.
app.use('/api/auth', authRoutes);

// Preserve the canvas frontend's existing API request.
app.get('/api/hello', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello World' });
});

// Health check.
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Centralized error handler.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const parserStatus =
    typeof err === 'object' && err !== null && 'status' in err && typeof err.status === 'number'
      ? err.status
      : 500;

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  const statusCode = parserStatus >= 400 && parserStatus < 500 ? parserStatus : 500;
  const message = statusCode === 400
    ? 'Invalid JSON request body.'
    : statusCode === 413
      ? 'Request body is too large.'
      : statusCode < 500
        ? 'Request could not be processed.'
        : 'Server error.';
  const code = statusCode === 400
    ? 'INVALID_REQUEST'
    : statusCode === 413
      ? 'PAYLOAD_TOO_LARGE'
      : statusCode === 415
        ? 'UNSUPPORTED_MEDIA_TYPE'
        : statusCode === 429
          ? 'RATE_LIMITED'
          : statusCode < 500
            ? 'REQUEST_REJECTED'
            : 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: { code, message },
  });
});

export default app;
