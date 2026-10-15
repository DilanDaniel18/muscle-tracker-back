import { HealthRepository } from './health.repository.js';

export interface HealthStatusResponse {
  status: string;
  message: string;
  uptime: string;
  timestamp: string;
  database: 'connected' | 'disconnected';
}

export class CheckHealthUseCase {
  constructor(private readonly healthRepository: HealthRepository) {}

  async execute(): Promise<HealthStatusResponse> {
    const isDbConnected = await this.healthRepository.checkDbHealth();

    return {
      status: 'ok',
      message: 'Muscle Tracker API operativa',
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'connected' : 'disconnected',
    };
  }
}
