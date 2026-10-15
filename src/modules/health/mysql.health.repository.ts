import { HealthRepository } from './health.repository.js';
import { dbPool } from '../../config/database.js';

export class MysqlHealthRepository implements HealthRepository {
  async checkDbHealth(): Promise<boolean> {
    try {
      const connection = await dbPool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch {
      return false;
    }
  }
}
