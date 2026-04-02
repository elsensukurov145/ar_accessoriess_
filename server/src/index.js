require('dotenv').config();
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🚀 Starting server in ${NODE_ENV.toUpperCase()} mode`);
console.log(`📍 Allowed CLIENT_URL: ${CLIENT_URL}`);

// Middleware — allow all localhost origins (Vite picks an available port at startup)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      ...(process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
      CLIENT_URL,
    ];

    const isLocalhost = /^https?:\/\/localhost(?::\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin);
    const isPrivateIP = /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/.test(origin);
    const isNgrok = /^https?:\/\/([a-z0-9]+\.)?ngrok\.io$/.test(origin);
    const isCloudflare = /^https?:\/\/([a-z0-9]+\.)?trycloudflare\.com$/.test(origin);

    if (isLocalhost || isPrivateIP || isNgrok || isCloudflare || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Static file serving for images and uploads
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: process.env.DB_HOST || 'not configured',
  });
});

// Routes
app.use('/api/order', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user', userRoutes);

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Orders: http://localhost:${PORT}/api/order`);
  console.log(`   Products: http://localhost:${PORT}/api/products`);
});
