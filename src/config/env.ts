import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    NAME: process.env.DB_NAME || 'muscle_tracker_db',
    USER: process.env.DB_USER || 'tracker_user',
    PASSWORD: process.env.DB_PASSWORD || 'tracker_password',
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || 'muscle_tracker_jwt_secret_key_2026',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  },
} as const;
