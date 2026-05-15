import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDb } from './config/database.js';
import authRoutes from './routes/auth.js';
import classesRoutes from './routes/classes.js';
import studentsRoutes from './routes/students.js';
import groupsRoutes from './routes/groups.js';
import settingsRoutes from './routes/settings.js';
import storeRoutes from './routes/store.js';
import interactionsRoutes from './routes/interactions.js';
import leaderboardRoutes from './routes/leaderboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow multiple origins for mobile app and web
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,capacitor://localhost,http://localhost').split(',');

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later' }
});

app.use(express.json());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
