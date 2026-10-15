import { TypeormHealthRepository } from './typeorm.health.repository.js';
import { CheckHealthUseCase } from './health.usecase.js';
import { HealthController } from './health.controller.js';

const healthRepository = new TypeormHealthRepository();
export const checkHealthUseCase = new CheckHealthUseCase(healthRepository);
export const healthController = new HealthController(checkHealthUseCase);
