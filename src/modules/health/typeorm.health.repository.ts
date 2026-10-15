import { HealthRepository } from './health.repository.js';
import { AppDataSource } from '../../config/database.js';

export class TypeormHealthRepository implements HealthRepository {
  async checkDbHealth(): Promise<boolean> {
    try {
      if (!AppDataSource.isInitialized) {
        return false;
      }
      await AppDataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
