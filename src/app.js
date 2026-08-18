const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler.middleware');
const notFoundHandler = require('./middlewares/notFound.middleware');

const app = express();

// Trust reverse proxy if behind nginx/load balancer
app.set('trust proxy', 1);

// 1. Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// 2. CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Key', 'X-API-Key', 'X-Device-UUID'],
    credentials: true
  })
);

// 3. Rate Limiting Protection
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // Limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    error: {
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});
app.use('/api/', limiter);

// 4. Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 5. Body Parsers with size limits to prevent DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Root Route Welcome
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to School Attendance REST API',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

// 7. Mount Versioned API Routes
app.use('/api/v1', routes);

// 8. 404 Route Handler
app.use(notFoundHandler);

// 9. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
