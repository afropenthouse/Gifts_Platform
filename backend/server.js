const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./prismaClient');

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://gifts-platform.vercel.app',
  'https://www.bethereweddings.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow REST tools/no-origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Headers']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Disable caching for API endpoints
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Keep raw body for Flutterwave webhook signature verification
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/contributions/webhook') {
      req.rawBody = buf;
    }
  }
}));

app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Verify Prisma DB connection on startup
prisma.$connect()
  .then(() => console.log('Prisma connected to database'))
  .catch((err) => console.error('Prisma connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth')());
app.use('/api/gifts', require('./routes/gifts')());
app.use('/api/contributions', require('./routes/contributions')());
app.use('/api/users', require('./routes/users')());
app.use('/api/guests', require('./routes/guests')());
app.use('/api/vendors', require('./routes/vendors')());

app.get('/', (req, res) => res.send('API running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Development cron job for testing reminders
if (process.env.NODE_ENV !== 'production' && process.env.DEV_CRON === 'true') {
  console.log('DEV CRON: Starting reminder check every 30 seconds');
  setInterval(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/guests/send-reminders`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.message && data.message !== 'Sent 0 reminder emails') {
          console.log('DEV CRON:', data.message);
        }
      }
    } catch (err) {
      console.error('DEV CRON: Error:', err.message);
    }
  }, 30000); // Every 30 seconds
}