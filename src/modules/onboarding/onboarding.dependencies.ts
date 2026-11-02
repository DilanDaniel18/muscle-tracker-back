import { TypeormOnboardingRepository } from './typeorm.onboarding.repository.js';
import { TypeormUserRepository } from '../users/typeorm.user.repository.js';
import {
  SaveOnboardingProfileUseCase,
  GetOnboardingProfileUseCase,
} from './onboarding.usecase.js';
import { OnboardingController } from './onboarding.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
} from '../users/user.dependencies.js';

const onboardingRepository = new TypeormOnboardingRepository();
const userRepository = new TypeormUserRepository();

export const saveOnboardingProfileUseCase = new SaveOnboardingProfileUseCase(
  onboardingRepository,
  userRepository
);

export const getOnboardingProfileUseCase = new GetOnboardingProfileUseCase(
  onboardingRepository
);

export const onboardingController = new OnboardingController(
  saveOnboardingProfileUseCase,
  getOnboardingProfileUseCase
);

export { authMiddleware, optionalAuthMiddleware };

