import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthRouter } from './modules/health/health.routes.js';
import { userRouter } from './modules/users/user.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Muscle Tracker API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

app.use('/api/health', healthRouter);
app.use('/api/users', userRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
  });
});
