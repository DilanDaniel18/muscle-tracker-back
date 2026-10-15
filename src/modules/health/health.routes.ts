import { Router } from 'express';
import { healthController } from './health.dependencies.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => healthController.run(req, res));
