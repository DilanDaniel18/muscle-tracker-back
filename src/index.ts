import 'reflect-metadata';
import { app } from './app.js';
import { ENV } from './config/env.js';
import { testDbConnection, dbPool, AppDataSource } from './config/database.js';

const server = app.listen(ENV.PORT, async () => {
  console.log(`URL: http://localhost:${ENV.PORT}`);

  await testDbConnection();
});

const handleShutdown = async (_signal: string) => {
  console.log('Conexión finalizada.');
  server.close(async () => {
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      await dbPool.end();
      console.log('Base de datos cerrada.');
    } catch (err) {
      console.error('Error al cerrar base de datos:', err);
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
