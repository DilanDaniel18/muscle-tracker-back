import bcrypt from 'bcryptjs';
import {
  AuthSessionResponse,
  CreateUserDTO,
  LoginUserDTO,
  RegisteredUserResponse,
  User,
  UserSex,
} from './user.entity.js';
import { UserRepository } from './user.repository.js';
import { SessionManager } from './session.manager.js';

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Ya existe un usuario registrado con el correo: ${email}`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró ningún usuario con el ID: ${id}`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message = 'Correo electrónico o contraseña incorrectos.') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) { }

  async execute(dto: CreateUserDTO): Promise<RegisteredUserResponse> {
    const name = dto.name?.trim();
    const lastName = dto.lastName?.trim();
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!name) {
      throw new ValidationError('El nombre es obligatorio.');
    }
    if (name.length > 36) {
      throw new ValidationError('El nombre no puede exceder los 36 caracteres.');
    }

    if (!lastName) {
      throw new ValidationError('El apellido es obligatorio.');
    }
    if (lastName.length > 36) {
      throw new ValidationError('El apellido no puede exceder los 36 caracteres.');
    }

    if (!email) {
      throw new ValidationError('El correo electrónico es obligatorio.');
    }
    if (email.length > 64) {
      throw new ValidationError('El correo electrónico no puede exceder los 64 caracteres.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('El formato del correo electrónico no es válido.');
    }

    if (!password || typeof password !== 'string') {
      throw new ValidationError('La contraseña es obligatoria.');
    }
    if (password.length < 4) {
      throw new ValidationError('La contraseña debe tener al menos 4 caracteres.');
    }
    if (password.length > 255) {
      throw new ValidationError('La contraseña no puede exceder los 255 caracteres.');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError(email);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return await this.userRepository.registerUser({
      name,
      lastName,
      email,
      password: hashedPassword,
    });
  }
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionManager: SessionManager
  ) { }

  async execute(dto: LoginUserDTO): Promise<AuthSessionResponse> {
    const email = typeof dto.email === 'string' ? dto.email.trim().toLowerCase() : '';
    const password = dto.password;

    if (!email) {
      throw new ValidationError('El correo electrónico es obligatorio.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('El formato del correo electrónico no es válido.');
    }

    if (!password || typeof password !== 'string') {
      throw new ValidationError('La contraseña es obligatoria.');
    }

    const userWithPassword = await this.userRepository.findByEmailWithPassword(email);
    if (!userWithPassword) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const user: User = {
      id: userWithPassword.id,
      name: userWithPassword.name,
      lastName: userWithPassword.lastName,
      email: userWithPassword.email,
      birthDate: userWithPassword.birthDate ?? null,
      weight: userWithPassword.weight ?? null,
      height: userWithPassword.height ?? null,
      sex: userWithPassword.sex ?? null,
    };

    const sessionData = this.sessionManager.createSession(user);

    return {
      user,
      token: sessionData.token,
      expiresIn: sessionData.expiresIn,
      expiresAt: sessionData.expiresAt,
    };
  }
}

export class GetCurrentUserSessionUseCase {
  constructor(private readonly userRepository: UserRepository) { }

  async execute(userId: string): Promise<User> {
    const id = typeof userId === 'string' ? userId.trim() : '';
    if (!id) {
      throw new ValidationError('El ID del usuario en la sesión es obligatorio.');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }
}

export class LogoutUserUseCase {
  constructor(private readonly sessionManager: SessionManager) { }

  execute(token: string): void {
    if (!token || typeof token !== 'string') {
      throw new ValidationError('El token de sesión es obligatorio para cerrar sesión.');
    }

    this.sessionManager.revokeSession(token);
  }
}

export interface RawUpdateUserAdditionalDataInput {
  id?: unknown;
  birthDate?: unknown;
  weight?: unknown;
  height?: unknown;
  sex?: unknown;
}

export class UpdateUserAdditionalDataUseCase {
  constructor(private readonly userRepository: UserRepository) { }

  async execute(input: RawUpdateUserAdditionalDataInput): Promise<User> {
    const id = typeof input.id === 'string' ? input.id.trim() : '';
    if (!id) {
      throw new ValidationError('El ID del usuario es obligatorio.');
    }

    const birthDate = this.validateAndFormatBirthDate(input.birthDate);
    const weight = this.validateWeight(input.weight);
    const height = this.validateHeight(input.height);
    const sex = this.validateSex(input.sex);

    const updated = await this.userRepository.updateAdditionalData({
      id,
      birthDate,
      weight,
      height,
      sex,
    });

    if (!updated) {
      throw new UserNotFoundError(id);
    }

    const updatedUser = await this.userRepository.findById(id);
    if (!updatedUser) {
      throw new UserNotFoundError(id);
    }

    return updatedUser;
  }

  private validateAndFormatBirthDate(value: unknown): string {
    if (!value || (typeof value !== 'string' && !(value instanceof Date))) {
      throw new ValidationError('La fecha de nacimiento es obligatoria (formato YYYY-MM-DD).');
    }

    const dateStr = value instanceof Date ? value.toISOString().split('T')[0] : String(value).trim();
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

  private validateHeight(value: unknown): number {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError('La altura es obligatoria.');
    }

    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      throw new ValidationError('La altura debe ser un número entero en centímetros (ej. 175).');
    }

    if (num < 40 || num > 280) {
      throw new ValidationError('La altura debe estar entre 40 y 280 centímetros.');
    }

    return num;
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
}
