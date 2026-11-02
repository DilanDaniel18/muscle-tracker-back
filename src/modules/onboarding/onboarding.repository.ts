import { OnboardingProfile, SaveOnboardingDTO } from './onboarding.entity.js';

export interface OnboardingRepository {
  saveProfile(data: SaveOnboardingDTO): Promise<OnboardingProfile>;
  findByUserId(userId: string): Promise<OnboardingProfile | null>;
}

