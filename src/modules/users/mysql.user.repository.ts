import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../../config/database.js';
import {
  CreateUserDTO,
  RegisteredUserResponse,
  UpdateUserAdditionalDataDTO,
  User,
  UserSex,
} from './user.entity.js';
import { UserRepository } from './user.repository.js';

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  lastName: string;
  email: string;
  birthDate?: Date | string | null;
  weight?: string | number | null;
  height?: number | null;
  sex?: UserSex | null;
}

export class MysqlUserRepository implements UserRepository {
  async registerUser(userData: CreateUserDTO): Promise<RegisteredUserResponse> {
    await dbPool.query('CALL QueryInsert_RegisterUser(?, ?, ?, ?)', [
      userData.name,
      userData.lastName,
      userData.email,
      userData.password,
    ]);

    const registeredUser = await this.findByEmail(userData.email);
    if (!registeredUser) {
      throw new Error('El usuario fue registrado pero no se pudo recuperar el registro generado.');
    }

    return registeredUser;
  }

  async findByEmail(email: string): Promise<RegisteredUserResponse | null> {
    const [result] = await dbPool.query(
      'CALL QuerySelect_UserByEmail(?)',
      [email]
    );

    // CALL retorna [[rows], ResultSetHeader] en mysql2
    const rows = (result as any)?.[0] as UserRow[] | undefined;
    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      lastName: row.lastName,
      email: row.email,
    };
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await dbPool.query<UserRow[]>(
      'SELECT id, name, lastName, email, birthDate, weight, height, sex FROM UsersMT WHERE id = ? LIMIT 1',
      [id]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    let formattedBirthDate: string | null = null;
    if (row.birthDate) {
      if (row.birthDate instanceof Date) {
        const y = row.birthDate.getFullYear();
        const m = String(row.birthDate.getMonth() + 1).padStart(2, '0');
        const d = String(row.birthDate.getDate()).padStart(2, '0');
        formattedBirthDate = `${y}-${m}-${d}`;
      } else {
        formattedBirthDate = String(row.birthDate).split('T')[0];
      }
    }

    return {
      id: row.id,
      name: row.name,
      lastName: row.lastName,
      email: row.email,
      birthDate: formattedBirthDate,
      weight: row.weight !== null && row.weight !== undefined ? Number(row.weight) : null,
      height: row.height !== null && row.height !== undefined ? Number(row.height) : null,
      sex: row.sex ?? null,
    };
  }

  async updateAdditionalData(data: UpdateUserAdditionalDataDTO): Promise<boolean> {
    const [result] = await dbPool.query<ResultSetHeader>(
      'CALL QueryUpdate_UserAdditionalData(?, ?, ?, ?, ?)',
      [data.id, data.birthDate, data.weight, data.height, data.sex]
    );

    const affectedRows = (result as ResultSetHeader)?.affectedRows ?? 0;
    return affectedRows > 0;
  }
}
