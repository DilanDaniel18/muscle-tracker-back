import { Request, Response, NextFunction } from 'express';
import { SessionManager, SessionUnauthorizedError } from './session.manager.js';
import { SessionPayload } from './user.entity.js';

declare global {
  namespace Express {
    interface Request {
      session?: SessionPayload;
      sessionToken?: string;
    }
  }
}

export function createAuthMiddleware(sessionManager: SessionManager) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader =
        req.headers.authorization ||
        (typeof req.headers['x-access-token'] === 'string'
          ? req.headers['x-access-token']
          : undefined);

      const token = sessionManager.extractTokenFromHeader(authHeader);
      if (!token) {
        res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'No se proporcionó un token de sesión válido (Authorization: Bearer <token>).',
        });
        return;
      }

      const payload = sessionManager.verifySession(token);
      req.session = payload;
      req.sessionToken = token;
      next();
    } catch (error) {
      if (error instanceof SessionUnauthorizedError) {
        res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: error.message,
        });
        return;
      }

      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'No autorizado para acceder a este recurso.',
      });
    }
  };
}

export function createOptionalAuthMiddleware(sessionManager: SessionManager) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader =
        req.headers.authorization ||
        (typeof req.headers['x-access-token'] === 'string'
          ? req.headers['x-access-token']
          : undefined);

      const token = sessionManager.extractTokenFromHeader(authHeader);
      if (token) {
        const payload = sessionManager.verifySession(token);
        req.session = payload;
        req.sessionToken = token;
      }
    } catch {
      // Si el token es opcional, continúa sin adjuntar sesión
    }
    next();
  };
}
