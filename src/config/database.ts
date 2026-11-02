import 'reflect-metadata';
import { DataSource } from 'typeorm';
import mysql from 'mysql2/promise';
import { ENV } from './env.js';
import { UserEntity } from '../modules/users/user.typeorm.entity.js';
import { OnboardingProfileEntity } from '../modules/onboarding/onboarding.typeorm.entity.js';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  username: ENV.DB.USER,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  synchronize: false,
  logging: ENV.NODE_ENV === 'development',
  entities: [UserEntity, OnboardingProfileEntity],
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
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS UserProfilesMT (
        id varchar(36) NOT NULL DEFAULT (uuid()),
        userId varchar(36) NOT NULL,
        birthDate date NOT NULL,
        height int NOT NULL,
        weight decimal(5,2) NOT NULL,
        sex char(1) NOT NULL,
        activityTypes json NOT NULL,
        isBeginner tinyint(1) NOT NULL DEFAULT 0,
        exerciseFrequency varchar(64) NOT NULL,
        onboardingCompleted tinyint(1) NOT NULL DEFAULT 1,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_UserProfilesMT_userId (userId),
        CONSTRAINT FK_UserProfilesMT_UsersMT FOREIGN KEY (userId) REFERENCES UsersMT (id) ON DELETE CASCADE,
        CONSTRAINT UserProfilesMT_chk_sex CHECK (sex IN ('M', 'F', 'O'))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log('> Conectado a la base de datos con TypeORM: (' + ENV.DB.NAME + ')');
    return true;
  } catch (error) {
    console.warn(' Error de conexión TypeORM:', (error as Error).message);
    console.info(' Recordatorio: Si el contenedor de Docker aún no está iniciado, ejecuta: npm run db:up');
    return false;
  }
}
