import { Request, Response } from 'express';
import {
  RegisterUserUseCase,
  UpdateUserAdditionalDataUseCase,
  LoginUserUseCase,
  GetCurrentUserSessionUseCase,
  LogoutUserUseCase,
  ValidationError,
  UserAlreadyExistsError,
  UserNotFoundError,
  InvalidCredentialsError,
} from './user.usecase.js';
import { SessionUnauthorizedError } from './session.manager.js';

export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly updateUserAdditionalDataUseCase: UpdateUserAdditionalDataUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getCurrentUserSessionUseCase: GetCurrentUserSessionUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase
  ) { }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const name = body.name ?? body.nombre;
      const lastName = body.lastName ?? body.apellido;
      const email = body.email ?? body.correo;
      const password = body.password ?? body.contraseña ?? body.contrasena;

      const user = await this.registerUserUseCase.execute({
        name,
        lastName,
        email,
        password,
      });

      res.status(201).json({
        status: 'success',
        message: 'Usuario registrado exitosamente',
        data: user,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        });
        return;
      }

      if (error instanceof UserAlreadyExistsError) {
        res.status(409).json({
          status: 'error',
          code: 'USER_ALREADY_EXISTS',
          message: error.message,
        });
        return;
      }

      console.error('Error al registrar usuario:', error);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'Error interno al registrar usuario',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const email = body.email ?? body.correo;
      const password = body.password ?? body.contraseña ?? body.contrasena;

      const session = await this.loginUserUseCase.execute({
        email,
        password,
      });

      res.status(200).json({
        status: 'success',
        message: 'Inicio de sesión exitoso',
        data: session,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        });
        return;
      }

      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: error.message,
        });
        return;
      }

      console.error('Error al iniciar sesión:', error);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'Error interno al iniciar sesión',
      });
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.session?.sub;
      if (!userId) {
        res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'No se encontró una sesión activa.',
        });
        return;
      }

      const user = await this.getCurrentUserSessionUseCase.execute(userId);

      res.status(200).json({
        status: 'success',
        message: 'Sesión activa válida',
        data: {
          user,
          session: {
            jti: req.session?.jti,
            issuedAt: req.session?.iat ? new Date(req.session.iat * 1000).toISOString() : undefined,
            expiresAt: req.session?.exp ? new Date(req.session.exp * 1000).toISOString() : undefined,
          },
        },
      });
    } catch (error) {
      if (error instanceof UserNotFoundError || error instanceof SessionUnauthorizedError) {
        res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'El usuario de la sesión no existe o la sesión no es válida.',
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        });
        return;
      }

      console.error('Error al verificar sesión:', error);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'Error interno al verificar la sesión',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.sessionToken;
      if (!token) {
        res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'No se encontró un token de sesión activo.',
        });
        return;
      }

      this.logoutUserUseCase.execute(token);

      res.status(200).json({
        status: 'success',
        message: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        });
        return;
      }

      console.error('Error al cerrar sesión:', error);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'Error interno al cerrar sesión',
      });
    }
  }

  async updateAdditionalData(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const id = req.params.id || body.id || body.userId || req.session?.sub;
      const birthDate = body.birthDate ?? body.fechaNacimiento ?? body.fecha_nacimiento;
      const weight = body.weight ?? body.peso;
      const height = body.height ?? body.altura;
      const sex = body.sex ?? body.sexo;

      const user = await this.updateUserAdditionalDataUseCase.execute({
        id,
        birthDate,
        weight,
        height,
        sex,
      });

      res.status(200).json({
        status: 'success',
        message: 'Información adicional actualizada exitosamente',
        data: user,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        });
        return;
      }

      if (error instanceof UserNotFoundError) {
        res.status(404).json({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: error.message,
        });
        return;
      }

      console.error('Error al actualizar datos adicionales:', error);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message || 'Error interno al actualizar datos adicionales',
      });
    }
  }
}
