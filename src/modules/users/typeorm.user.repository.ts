import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { AppDataSource } from '../../config/database.js';
import { UserEntity } from './user.typeorm.entity.js';
import { OnboardingProfileEntity } from '../onboarding/onboarding.typeorm.entity.js';
import {
  CreateUserDTO,
  RegisteredUserResponse,
  UpdateUserAdditionalDataDTO,
  User,
  UserWithPassword,
} from './user.entity.js';
import { UserRepository } from './user.repository.js';

export class TypeormUserRepository implements UserRepository {
  private get repository(): Repository<UserEntity> {
    return AppDataSource.getRepository(UserEntity);
  }

  private get profileRepository(): Repository<OnboardingProfileEntity> {
    return AppDataSource.getRepository(OnboardingProfileEntity);
  }

  private formatBirthDate(birthDate?: Date | string | null): string | null {
    if (!birthDate) {
      return null;
    }
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

  async registerUser(userData: CreateUserDTO): Promise<RegisteredUserResponse> {
    const newUser = this.repository.create({
      id: randomUUID(),
      name: userData.name,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
    });

    const saved = await this.repository.save(newUser);

    return {
      id: saved.id,
      name: saved.name,
      lastName: saved.lastName,
      email: saved.email,
    };
  }

  async findByEmail(email: string): Promise<RegisteredUserResponse | null> {
    const user = await this.repository.findOne({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
    };
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const user = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      return null;
    }

    let profile: OnboardingProfileEntity | null = null;
    try {
      profile = await this.profileRepository.findOne({
        where: { userId: user.id },
      });
    } catch {
      profile = null;
    }

    const hasProfile = Boolean(profile?.onboardingCompleted);

    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      birthDate: this.formatBirthDate(user.birthDate ?? profile?.birthDate),
      weight:
        user.weight !== null && user.weight !== undefined
          ? Number(user.weight)
          : profile?.weight !== undefined
            ? Number(profile.weight)
            : null,
      height:
        user.height !== null && user.height !== undefined
          ? Number(user.height)
          : profile?.height !== undefined
            ? Number(profile.height)
            : null,
      sex: user.sex ?? profile?.sex ?? null,
      activityTypes: profile ? this.parseActivityTypes(profile.activityTypes) : [],
      isBeginner: profile ? Boolean(profile.isBeginner) : false,
      exerciseFrequency: profile?.exerciseFrequency ?? null,
      onboardingCompleted: hasProfile,
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    let profile: OnboardingProfileEntity | null = null;
    try {
      profile = await this.profileRepository.findOne({
        where: { userId: user.id },
      });
    } catch {
      profile = null;
    }

    const hasProfile = Boolean(profile?.onboardingCompleted);

    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      birthDate: this.formatBirthDate(user.birthDate ?? profile?.birthDate),
      weight:
        user.weight !== null && user.weight !== undefined
          ? Number(user.weight)
          : profile?.weight !== undefined
            ? Number(profile.weight)
            : null,
      height:
        user.height !== null && user.height !== undefined
          ? Number(user.height)
          : profile?.height !== undefined
            ? Number(profile.height)
            : null,
      sex: user.sex ?? profile?.sex ?? null,
      activityTypes: profile ? this.parseActivityTypes(profile.activityTypes) : [],
      isBeginner: profile ? Boolean(profile.isBeginner) : false,
      exerciseFrequency: profile?.exerciseFrequency ?? null,
      onboardingCompleted: hasProfile,
    };
  }

  async updateAdditionalData(data: UpdateUserAdditionalDataDTO): Promise<boolean> {
    const result = await this.repository.update(
      { id: data.id },
      {
        birthDate: data.birthDate,
        weight: data.weight,
        height: data.height,
        sex: data.sex,
      }
    );

    return (result.affected ?? 0) > 0;
  }
}
