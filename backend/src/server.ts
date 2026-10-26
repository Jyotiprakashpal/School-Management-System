import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import admissionEnquiryRoutes from './routes/admissionEnquiryRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import archivedStudentRoutes from './routes/archivedStudentRoutes.js';
import promotionRoutes from './routes/promotionRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import feeCollectionRoutes from './routes/feeCollectionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import sql, { connectPostgres } from './config/postgres.js';
import { initializeDatabase } from './db-init.js';

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (room: string) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

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
app.use('/api/admission-enquiries', admissionEnquiryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/archived-students', archivedStudentRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/fee-collections', feeCollectionRoutes);
app.use('/api/attendance', attendanceRoutes);

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
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  void connectDatabase();
};

const shutdown = async () => {
  await io.close();
  await sql.end({ timeout: 5 }).catch(() => undefined);
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

export { io };
export default app;
