
import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import authRoutes from './routes/auth';
import emailRoutes from './routes/email';
import { configurePassport } from './config/passport';
import { requeuePendingEmails } from './services/queue';

dotenv.config();

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(passport.initialize());

configurePassport();

app.use('/auth', authRoutes);
app.use('/api/email', emailRoutes);

app.get('/', (_, res) => {
  res.send('ReachInbox Scheduler API running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await requeuePendingEmails();
});
