import { User, UserSex } from '../users/user.entity.js';

export type { UserSex };

export const BEGINNER_ACTIVITY_OPTION = 'No realizo ejercicios y quiero comenzar';

export const VALID_EXERCISE_FREQUENCIES = [
  'Una vez a la semana',
  'De dos a tres veces por semana',
  'De 4 a 5 veces por semana',
  'De 6 a 7 veces por semana',
] as const;

export type ExerciseFrequency = (typeof VALID_EXERCISE_FREQUENCIES)[number];

export interface OnboardingProfile {
  id: string;
  userId: string;
  birthDate: string;
  height: number;
  weight: number;
  sex: UserSex;
  activityTypes: string[];
  isBeginner: boolean;
  exerciseFrequency: string;
  onboardingCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveOnboardingDTO {
  userId: string;
  birthDate: string;
  height: number;
  weight: number;
  sex: UserSex;
  activityTypes: string[];
  isBeginner: boolean;
  exerciseFrequency: string;
}

export interface OnboardingSaveResponse {
  profile: OnboardingProfile;
  user: User;
}

