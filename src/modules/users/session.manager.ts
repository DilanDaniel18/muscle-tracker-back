import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { ENV } from '../../config/env.js';
import { SessionPayload, SessionTokenData, User } from './user.entity.js';

export class SessionUnauthorizedError extends Error {
  constructor(message = 'Sesión inválida o expirada.') {
    super(message);
    this.name = 'SessionUnauthorizedError';
  }
}

export interface SessionManager {
  createSession(user: User): SessionTokenData;
  verifySession(token: string): SessionPayload;
  revokeSession(token: string): void;
  extractTokenFromHeader(authHeader?: string): string | null;
}

export class JwtSessionManager implements SessionManager {
  private readonly revokedSessions = new Map<string, number>();
  private readonly activeSessions = new Map<string, { userId: string; expiresAtMs: number }>();

  createSession(user: User): SessionTokenData {
    this.pruneExpiredSessions();

    const jti = randomUUID();
    const expiresIn = ENV.JWT.EXPIRES_IN;

    const payload: SessionPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      jti,
    };

    const token = jwt.sign(payload, ENV.JWT.SECRET, {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });

    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    const expiresAtMs = decoded?.exp
      ? decoded.exp * 1000
      : Date.now() + 24 * 60 * 60 * 1000;

    this.activeSessions.set(jti, {
      userId: user.id,
      expiresAtMs,
    });

    return {
      token,
      expiresIn,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  verifySession(token: string): SessionPayload {
    this.pruneExpiredSessions();

    if (!token || typeof token !== 'string') {
      throw new SessionUnauthorizedError('Token de sesión no proporcionado.');
    }

    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, ENV.JWT.SECRET);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new SessionUnauthorizedError('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      throw new SessionUnauthorizedError('Token de sesión inválido.');
    }

    if (typeof decoded === 'string' || !decoded.sub || !decoded.jti) {
      throw new SessionUnauthorizedError('Estructura del token de sesión inválida.');
    }

    if (this.revokedSessions.has(decoded.jti) || this.revokedSessions.has(token)) {
      throw new SessionUnauthorizedError('La sesión ha sido cerrada. Por favor, inicia sesión nuevamente.');
    }

    return {
      sub: String(decoded.sub),
      email: String(decoded.email ?? ''),
      name: String(decoded.name ?? ''),
      jti: String(decoded.jti),
      iat: decoded.iat,
      exp: decoded.exp,
    };
  }

  revokeSession(token: string): void {
    this.pruneExpiredSessions();

    if (!token || typeof token !== 'string') {
      return;
    }

    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    const expiresAtMs = decoded?.exp
      ? decoded.exp * 1000
      : Date.now() + 24 * 60 * 60 * 1000;

    if (decoded?.jti) {
      this.revokedSessions.set(decoded.jti, expiresAtMs);
      this.activeSessions.delete(decoded.jti);
    }
    this.revokedSessions.set(token, expiresAtMs);
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      const token = trimmed.slice(7).trim();
      return token.length > 0 ? token : null;
    }

    return trimmed.length > 0 ? trimmed : null;
  }

  private pruneExpiredSessions(): void {
    const now = Date.now();

    for (const [key, expiresAtMs] of this.revokedSessions.entries()) {
      if (expiresAtMs <= now) {
        this.revokedSessions.delete(key);
      }
    }

    for (const [jti, session] of this.activeSessions.entries()) {
      if (session.expiresAtMs <= now) {
        this.activeSessions.delete(jti);
      }
    }
  }
}

