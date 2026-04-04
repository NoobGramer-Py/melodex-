require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const convertRouter = require('./routes/convert');
const songsRouter = require('./routes/songs');
const playlistsRouter = require('./routes/playlists');
const artistsRouter = require('./routes/artists');

const app = express();
const PORT = process.env.PORT || 5173;

// Ensure temp directory exists
const tempDir = process.env.TEMP_DIR || '/tmp/melodex-conversions';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Strict rate limiter for conversion starting — prevent server overload
const conversionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 conversions per 15 mins
  message: { error: 'Conversion limit reached. Please try again in 15 minutes.' },
});

// More permissive limiter for search — allow for "live feel" without blocking users
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 1 search per second on average
  message: { error: 'Too many searches. Please wait a moment.' },
});

// Apply limiters accurately
app.use('/api/convert/start', conversionLimiter);
app.use('/api/convert/search', searchLimiter);
app.use('/api/convert/stream', searchLimiter); // Stream also needs to be permissive

// Routes
app.use('/api/convert', convertRouter);
app.use('/api/songs', songsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/artists', artistsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message, err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`[Melodex Backend] Running on port ${PORT}`);
  console.log(`[Melodex Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
});
