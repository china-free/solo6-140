import express, { type Request, type Response, type NextFunction, type Application } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createServer, type Server as HTTPServer } from 'http';
import { Server as IOServer } from 'socket.io';
import apiRoutes from './routes/index.js';
import { setupSocketHandlers } from './sockets/handlers.js';
import { rollCallController } from './controllers/RollCallController.js';
import { quizService } from './services/QuizService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export function createApp(): { app: Application; httpServer: HTTPServer; io: IOServer } {
  const app: Application = express();
  const httpServer = createServer(app);
  const io = new IOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  rollCallController.setSocketServer(io);
  quizService.setSocketServer(io);
  setupSocketHandlers(io);

  app.use('/api', apiRoutes);

  app.use('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'ok' });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server internal error'
    });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'API not found'
    });
  });

  return { app, httpServer, io };
}

const { app } = createApp();
export default app;
