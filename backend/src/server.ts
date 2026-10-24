import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import sql, { connectPostgres } from './config/postgres.js';
import { initializeDatabase } from './db-init.js';

const app: Application = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await sql`SELECT 1`;
    res.json({
      status: 'ok',
      message: 'School Management API is running',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database is not connected',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);

const connectDatabase = async () => {
  try {
    await connectPostgres();
    await initializeDatabase();
    console.log('Connected to PostgreSQL');
  } catch (error) {
    console.error('PostgreSQL connection failed:', (error as Error).message);
    console.error('The API is running, but database operations are unavailable. Retrying in 10 seconds...');
    setTimeout(() => void connectDatabase(), 10000);
  }
};

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  void connectDatabase();
};

const shutdown = async () => {
  await sql.end({ timeout: 5 }).catch(() => undefined);
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

export default app;
