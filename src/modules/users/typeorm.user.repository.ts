import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { AppDataSource } from '../../config/database.js';
import { UserEntity } from './user.typeorm.entity.js';
import {
  CreateUserDTO,
  RegisteredUserResponse,
  UpdateUserAdditionalDataDTO,
  User,
} from './user.entity.js';
import { UserRepository } from './user.repository.js';

export class TypeormUserRepository implements UserRepository {
  private get repository(): Repository<UserEntity> {
    return AppDataSource.getRepository(UserEntity);
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

  async findById(id: string): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    let formattedBirthDate: string | null = null;
    if (user.birthDate) {
      if (user.birthDate instanceof Date) {
        const y = user.birthDate.getFullYear();
        const m = String(user.birthDate.getMonth() + 1).padStart(2, '0');
        const d = String(user.birthDate.getDate()).padStart(2, '0');
        formattedBirthDate = `${y}-${m}-${d}`;
      } else {
        formattedBirthDate = String(user.birthDate).split('T')[0];
      }
    }

    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      birthDate: formattedBirthDate,
      weight: user.weight !== null && user.weight !== undefined ? Number(user.weight) : null,
      height: user.height !== null && user.height !== undefined ? Number(user.height) : null,
      sex: user.sex ?? null,
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
