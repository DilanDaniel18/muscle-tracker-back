import {
  BEGINNER_ACTIVITY_OPTION,
  OnboardingProfile,
  OnboardingSaveResponse,
  UserSex,
  VALID_EXERCISE_FREQUENCIES,
} from './onboarding.entity.js';
import { OnboardingRepository } from './onboarding.repository.js';
import { UserRepository } from '../users/user.repository.js';
import { UserNotFoundError, ValidationError } from '../users/user.usecase.js';

export { UserNotFoundError, ValidationError };

const FREQUENCY_CODE_MAP: Record<string, string> = {
  '1_per_week': 'Una vez a la semana',
  '2_to_3_per_week': 'De dos a tres veces por semana',
  '4_to_5_per_week': 'De 4 a 5 veces por semana',
  '6_to_7_per_week': 'De 6 a 7 veces por semana',
};

export interface RawSaveOnboardingInput {
  userId?: unknown;
  birthDate?: unknown;
  height?: unknown;
  weight?: unknown;
  sex?: unknown;
  activityTypes?: unknown;
  isBeginner?: unknown;
  exerciseFrequency?: unknown;
}

export class SaveOnboardingProfileUseCase {
  constructor(
    private readonly onboardingRepository: OnboardingRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(input: RawSaveOnboardingInput): Promise<OnboardingSaveResponse> {
    const userId = typeof input.userId === 'string' ? input.userId.trim() : '';
    if (!userId) {
      throw new ValidationError('El ID del usuario es obligatorio para registrar el onboarding.');
    }

    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new UserNotFoundError(userId);
    }

    const birthDate = this.validateBirthDate(input.birthDate);
    const height = this.validateHeight(input.height);
    const weight = this.validateWeight(input.weight);
    const sex = this.validateSex(input.sex);
    const { activityTypes, isBeginner } = this.validateActivitySelection(
      input.activityTypes,
      input.isBeginner
    );
    const exerciseFrequency = this.validateExerciseFrequency(input.exerciseFrequency);

    const savedProfile = await this.onboardingRepository.saveProfile({
      userId,
      birthDate,
      height,
      weight,
      sex,
      activityTypes,
      isBeginner,
      exerciseFrequency,
    });

    const updatedUser = await this.userRepository.findById(userId);
    if (!updatedUser) {
      throw new UserNotFoundError(userId);
    }

    return {
      profile: savedProfile,
      user: {
        ...updatedUser,
        onboardingCompleted: true,
      },
    };
  }

  private validateBirthDate(value: unknown): string {
    if (!value || (typeof value !== 'string' && !(value instanceof Date))) {
      throw new ValidationError('La fecha de nacimiento es obligatoria (formato YYYY-MM-DD).');
    }

    const dateStr =
      value instanceof Date ? value.toISOString().split('T')[0] : String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new ValidationError('La fecha de nacimiento debe tener el formato YYYY-MM-DD.');
    }

    const parsedDate = new Date(dateStr + 'T00:00:00Z');
    if (isNaN(parsedDate.getTime())) {
      throw new ValidationError('La fecha de nacimiento no es una fecha válida.');
    }

    const now = new Date();
    if (parsedDate > now) {
      throw new ValidationError('La fecha de nacimiento no puede ser una fecha futura.');
    }

    if (parsedDate.getUTCFullYear() < 1900) {
      throw new ValidationError('La fecha de nacimiento debe ser posterior al año 1900.');
    }

    return dateStr;
  }

  private validateHeight(value: unknown): number {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError('La estatura es obligatoria.');
    }

    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      throw new ValidationError('La estatura debe ser un número entero en centímetros (ej. 175).');
    }

    if (num < 40 || num > 280) {
      throw new ValidationError('La estatura debe estar entre 40 y 280 centímetros.');
    }

    return num;
  }

  private validateWeight(value: unknown): number {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError('El peso es obligatorio.');
    }

    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError('El peso debe ser un valor numérico.');
    }

    if (num <= 0 || num > 999.99) {
      throw new ValidationError('El peso debe estar entre 0.01 y 999.99 kg.');
    }

    return Math.round(num * 100) / 100;
  }

  private validateSex(value: unknown): UserSex {
    if (!value || typeof value !== 'string') {
      throw new ValidationError("El sexo es obligatorio ('M', 'F' u 'O').");
    }

    const normalized = value.trim().toUpperCase();
    if (normalized !== 'M' && normalized !== 'F' && normalized !== 'O') {
      throw new ValidationError("El sexo solo puede ser 'M', 'F' u 'O'.");
    }

    return normalized as UserSex;
  }

  private validateActivitySelection(
    rawActivities: unknown,
    rawIsBeginner: unknown
  ): { activityTypes: string[]; isBeginner: boolean } {
    const isBeginnerFlag =
      rawIsBeginner === true ||
      rawIsBeginner === 'true' ||
      rawIsBeginner === 1 ||
      rawIsBeginner === '1';

    let activities: string[] = [];

    if (Array.isArray(rawActivities)) {
      activities = rawActivities
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
    } else if (typeof rawActivities === 'string' && rawActivities.trim().length > 0) {
      activities = [rawActivities.trim()];
    }

    const includesBeginnerOption = activities.some(
      (act) => act.toLowerCase() === BEGINNER_ACTIVITY_OPTION.toLowerCase()
    );

    const isBeginner = isBeginnerFlag || includesBeginnerOption;

    if (isBeginner) {
      return {
        activityTypes: [BEGINNER_ACTIVITY_OPTION],
        isBeginner: true,
      };
    }

    if (activities.length === 0) {
      throw new ValidationError(
        'Debes seleccionar al menos un tipo de actividad diaria o indicar que deseas comenzar.'
      );
    }

    return {
      activityTypes: Array.from(new Set(activities)),
      isBeginner: false,
    };
  }

  private validateExerciseFrequency(value: unknown): string {
    if (!value || typeof value !== 'string') {
      throw new ValidationError(
        'Debes seleccionar con qué frecuencia realizas o quieres realizar ejercicio.'
      );
    }

    const trimmed = value.trim();
    if (!trimmed) {
      throw new ValidationError(
        'Debes seleccionar con qué frecuencia realizas o quieres realizar ejercicio.'
      );
    }

    if (FREQUENCY_CODE_MAP[trimmed]) {
      return FREQUENCY_CODE_MAP[trimmed];
    }

    const matched = VALID_EXERCISE_FREQUENCIES.find(
      (freq) => freq.toLowerCase() === trimmed.toLowerCase()
    );

    if (!matched) {
      throw new ValidationError(
        `La frecuencia seleccionada no es válida. Opciones permitidas: ${VALID_EXERCISE_FREQUENCIES.join(', ')}.`
      );
    }

    return matched;
  }
}

export class GetOnboardingProfileUseCase {
  constructor(private readonly onboardingRepository: OnboardingRepository) {}

  async execute(userId: string): Promise<OnboardingProfile | null> {
    const id = typeof userId === 'string' ? userId.trim() : '';
    if (!id) {
      throw new ValidationError('El ID del usuario es obligatorio.');
    }

    return this.onboardingRepository.findByUserId(id);
  }
}

