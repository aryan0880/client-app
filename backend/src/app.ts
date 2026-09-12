import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import scanRoutes from './routes/scan.routes';
import historyRoutes from './routes/history.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const REQUIRED_ENV: Array<string> = ['JWT_SECRET'];
if (process.env.NODE_ENV === 'production') {
  REQUIRED_ENV.push('DATABASE_URL');
}
const missing = REQUIRED_ENV.filter((k) => !process.env[k] || process.env[k]!.trim() === '');
if (missing.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Set them in your hosting provider dashboard or .env file.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const parseAllowedOrigins = (): string[] => {
  const raw = process.env.CORS_ALLOW_ORIGINS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const defaultAllowedOrigins: RegExp[] = [
  /^capacitor:\/\/localhost$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/10\.0\.2\.2(:\d+)?$/,
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const explicit = parseAllowedOrigins();
    if (explicit.length > 0) {
      if (explicit.includes(origin)) {
        callback(null, true);
        return;
      }
      if (NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
      return;
    }
    if (defaultAllowedOrigins.some((re) => re.test(origin))) {
      callback(null, true);
      return;
    }
    if (NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}. Add it to CORS_ALLOW_ORIGINS env var.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  maxAge: 86400,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '15mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests, please try again later.', statusCode: 429 } }
});
app.use('/api', limiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'FoodScan AI Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/upload', uploadRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 FoodScan AI Backend API running on http://localhost:${PORT} [${NODE_ENV}]`);
});

export default app;
