import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { AppDataSource } from '../../config/database.js';
import { OnboardingProfileEntity } from './onboarding.typeorm.entity.js';
import { UserEntity } from '../users/user.typeorm.entity.js';
import { OnboardingProfile, SaveOnboardingDTO } from './onboarding.entity.js';
import { OnboardingRepository } from './onboarding.repository.js';

export class TypeormOnboardingRepository implements OnboardingRepository {
  private get profileRepository(): Repository<OnboardingProfileEntity> {
    return AppDataSource.getRepository(OnboardingProfileEntity);
  }

  private get userRepository(): Repository<UserEntity> {
    return AppDataSource.getRepository(UserEntity);
  }

  private formatBirthDate(birthDate: Date | string): string {
    if (birthDate instanceof Date) {
      const y = birthDate.getFullYear();
      const m = String(birthDate.getMonth() + 1).padStart(2, '0');
      const d = String(birthDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(birthDate).split('T')[0];
  }

  private parseActivityTypes(raw: unknown): string[] {
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item));
    }
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
      } catch {
        return raw ? [raw] : [];
      }
    }
    return [];
  }

  private mapEntityToDomain(entity: OnboardingProfileEntity): OnboardingProfile {
    return {
      id: entity.id,
      userId: entity.userId,
      birthDate: this.formatBirthDate(entity.birthDate),
      height: Number(entity.height),
      weight: Number(entity.weight),
      sex: entity.sex,
      activityTypes: this.parseActivityTypes(entity.activityTypes),
      isBeginner: Boolean(entity.isBeginner),
      exerciseFrequency: entity.exerciseFrequency,
      onboardingCompleted: Boolean(entity.onboardingCompleted),
      createdAt: entity.createdAt ? new Date(entity.createdAt).toISOString() : undefined,
      updatedAt: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : undefined,
    };
  }

  async saveProfile(data: SaveOnboardingDTO): Promise<OnboardingProfile> {
    // 1. Sync basic anthropometric fields on UsersMT table
    await this.userRepository.update(
      { id: data.userId },
      {
        birthDate: data.birthDate,
        height: data.height,
        weight: data.weight,
        sex: data.sex,
      }
    );

    // 2. Upsert the detailed onboarding record in UserProfilesMT
    const existing = await this.profileRepository.findOne({
      where: { userId: data.userId },
    });

    if (existing) {
      existing.birthDate = data.birthDate;
      existing.height = data.height;
      existing.weight = data.weight;
      existing.sex = data.sex;
      existing.activityTypes = data.activityTypes;
      existing.isBeginner = data.isBeginner;
      existing.exerciseFrequency = data.exerciseFrequency;
      existing.onboardingCompleted = true;

      const updated = await this.profileRepository.save(existing);
      return this.mapEntityToDomain(updated);
    }

    const newProfile = this.profileRepository.create({
      id: randomUUID(),
      userId: data.userId,
      birthDate: data.birthDate,
      height: data.height,
      weight: data.weight,
      sex: data.sex,
      activityTypes: data.activityTypes,
      isBeginner: data.isBeginner,
      exerciseFrequency: data.exerciseFrequency,
      onboardingCompleted: true,
    });

    const saved = await this.profileRepository.save(newProfile);
    return this.mapEntityToDomain(saved);
  }

  async findByUserId(userId: string): Promise<OnboardingProfile | null> {
    const entity = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!entity) {
      return null;
    }

    return this.mapEntityToDomain(entity);
  }
}

