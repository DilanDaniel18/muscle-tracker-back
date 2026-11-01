import {
  CreateUserDTO,
  RegisteredUserResponse,
  UpdateUserAdditionalDataDTO,
  User,
  UserWithPassword,
} from './user.entity.js';

export interface UserRepository {
  registerUser(userData: CreateUserDTO): Promise<RegisteredUserResponse>;
  findByEmail(email: string): Promise<RegisteredUserResponse | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  findById(id: string): Promise<User | null>;
  updateAdditionalData(data: UpdateUserAdditionalDataDTO): Promise<boolean>;
}
