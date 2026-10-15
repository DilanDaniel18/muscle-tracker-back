import { Request, Response } from 'express';
import { CheckHealthUseCase } from './health.usecase.js';

export class HealthController {
  constructor(private readonly checkHealthUseCase: CheckHealthUseCase) {}

  async run(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.checkHealthUseCase.execute();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: (error as Error).message || 'Error al comprobar el estado del servidor',
      });
    }
  }
}
