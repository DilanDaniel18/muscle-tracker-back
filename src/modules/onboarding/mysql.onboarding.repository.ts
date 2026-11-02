import { RowDataPacket } from 'mysql2';
import { randomUUID } from 'node:crypto';
import { dbPool } from '../../config/database.js';
import { OnboardingProfile, SaveOnboardingDTO, UserSex } from './onboarding.entity.js';
import { OnboardingRepository } from './onboarding.repository.js';

interface OnboardingProfileRow extends RowDataPacket {
  id: string;
  userId: string;
  birthDate: Date | string;
  height: number;
  weight: string | number;
  sex: UserSex;
  activityTypes: string | string[];
  isBeginner: number | boolean;
  exerciseFrequency: string;
  onboardingCompleted: number | boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class MysqlOnboardingRepository implements OnboardingRepository {
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

  async saveProfile(data: SaveOnboardingDTO): Promise<OnboardingProfile> {
    await dbPool.query(
      'UPDATE UsersMT SET birthDate = ?, weight = ?, height = ?, sex = ? WHERE id = ?',
      [data.birthDate, data.weight, data.height, data.sex, data.userId]
    );

    const existing = await this.findByUserId(data.userId);
    const id = existing ? existing.id : randomUUID();

    await dbPool.query(
      `INSERT INTO UserProfilesMT (
        id, userId, birthDate, height, weight, sex, activityTypes, isBeginner, exerciseFrequency, onboardingCompleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        birthDate = VALUES(birthDate),
        height = VALUES(height),
        weight = VALUES(weight),
        sex = VALUES(sex),
        activityTypes = VALUES(activityTypes),
        isBeginner = VALUES(isBeginner),
        exerciseFrequency = VALUES(exerciseFrequency),
        onboardingCompleted = 1`,
      [
        id,
        data.userId,
        data.birthDate,
        data.height,
        data.weight,
        data.sex,
        JSON.stringify(data.activityTypes),
        data.isBeginner ? 1 : 0,
        data.exerciseFrequency,
      ]
    );

    const saved = await this.findByUserId(data.userId);
    if (!saved) {
      throw new Error('No se pudo recuperar el perfil de onboarding guardado.');
    }

    return saved;
  }

  async findByUserId(userId: string): Promise<OnboardingProfile | null> {
    const [rows] = await dbPool.query<OnboardingProfileRow[]>(
      'SELECT * FROM UserProfilesMT WHERE userId = ? LIMIT 1',
      [userId]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      userId: row.userId,
      birthDate: this.formatBirthDate(row.birthDate),
      height: Number(row.height),
      weight: Number(row.weight),
      sex: row.sex,
      activityTypes: this.parseActivityTypes(row.activityTypes),
      isBeginner: Boolean(row.isBeginner),
      exerciseFrequency: row.exerciseFrequency,
      onboardingCompleted: Boolean(row.onboardingCompleted),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
    };
  }
}

