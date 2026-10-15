import { Request, Response } from 'express';
import {
  RegisterUserUseCase,
  UpdateUserAdditionalDataUseCase,
  ValidationError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from './user.usecase.js';

export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly updateUserAdditionalDataUseCase: UpdateUserAdditionalDataUseCase
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

  async updateAdditionalData(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const id = req.params.id || body.id || body.userId;
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
