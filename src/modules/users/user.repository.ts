import {
  CreateUserDTO,
  RegisteredUserResponse,
  UpdateUserAdditionalDataDTO,
  User,
} from './user.entity.js';

export interface UserRepository {
  registerUser(userData: CreateUserDTO): Promise<RegisteredUserResponse>;
  findByEmail(email: string): Promise<RegisteredUserResponse | null>;
  findById(id: string): Promise<User | null>;
  updateAdditionalData(data: UpdateUserAdditionalDataDTO): Promise<boolean>;
}
