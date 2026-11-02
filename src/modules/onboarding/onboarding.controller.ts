import { Request, Response } from 'express';
import {
  SaveOnboardingProfileUseCase,
  GetOnboardingProfileUseCase,
  ValidationError,
  UserNotFoundError,
} from './onboarding.usecase.js';

export class OnboardingController {
  constructor(
    private readonly saveOnboardingProfileUseCase: SaveOnboardingProfileUseCase,
    private readonly getOnboardingProfileUseCase: GetOnboardingProfileUseCase
  ) {}

  async saveProfile(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const paramUserId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
      const paramId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const userId =
        paramUserId ||
        paramId ||
        body.userId ||
        body.id ||
        req.session?.sub;

      const birthDate =
        body.birthDate ?? body.fechaNacimiento ?? body.fecha_nacimiento;
      const height = body.height ?? body.estatura ?? body.altura;
      const weight = body.weight ?? body.peso;
      const sex = body.sex ?? body.sexo;
      const activityTypes =
        body.activityTypes ??
        body.activities ??
        body.exercises ??
        body.tiposActividad;
      const isBeginner =
        body.isBeginner ??
        body.noRealizoEjercicios ??
        body.wantsToStart ??
        false;
      const exerciseFrequency =
        body.exerciseFrequency ??
        body.frequency ??
        body.frecuenciaEjercicio ??
        body.frecuencia;

      const result = await this.saveOnboardingProfileUseCase.execute({
        userId,
        birthDate,
        height,
        weight,
        sex,
        activityTypes,
        isBeginner,
        exerciseFrequency,
      });

      res.status(200).json({
        status: 'success',
        message: 'Perfil de onboarding registrado exitosamente',
        data: result,
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

      console.error('Error al registrar perfil de onboarding:', error);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message:
          (error as Error).message ||
          'Error interno al registrar el perfil de onboarding',
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const paramUserId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
      const paramId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const userId = paramUserId || paramId || req.session?.sub;
      if (!userId) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'El ID del usuario es obligatorio para consultar el perfil.',
        });
        return;
      }

      const profile = await this.getOnboardingProfileUseCase.execute(userId);

      res.status(200).json({
        status: 'success',
        message: profile
          ? 'Perfil de onboarding obtenido exitosamente'
          : 'El usuario aún no ha completado el proceso de onboarding',
        data: profile,
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

      console.error('Error al obtener perfil de onboarding:', error);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message:
          (error as Error).message ||
          'Error interno al obtener el perfil de onboarding',
      });
    }
  }
}
