const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./prismaClient');

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: true, // Allow any origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Headers']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
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

app.get('/', (req, res) => res.send('API running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));