import 'reflect-metadata';
import { DataSource } from 'typeorm';
import mysql from 'mysql2/promise';
import { ENV } from './env.js';
import { UserEntity } from '../modules/users/user.typeorm.entity.js';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  username: ENV.DB.USER,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  synchronize: false,
  logging: ENV.NODE_ENV === 'development',
  entities: [UserEntity],
  migrations: [],
  subscribers: [],
});

export const dbPool = mysql.createPool({
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  user: ENV.DB.USER,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testDbConnection(): Promise<boolean> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('> Conectado a la base de datos con TypeORM: (' + ENV.DB.NAME + ')');
    return true;
  } catch (error) {
    console.warn(' Error de conexión TypeORM:', (error as Error).message);
    console.info(' Recordatorio: Si el contenedor de Docker aún no está iniciado, ejecuta: npm run db:up');
    return false;
  }
}
