import { TypeormUserRepository } from './typeorm.user.repository.js';
import { RegisterUserUseCase, UpdateUserAdditionalDataUseCase } from './user.usecase.js';
import { UserController } from './user.controller.js';

const userRepository = new TypeormUserRepository();

export const registerUserUseCase = new RegisterUserUseCase(userRepository);
export const updateUserAdditionalDataUseCase = new UpdateUserAdditionalDataUseCase(userRepository);
export const userController = new UserController(registerUserUseCase, updateUserAdditionalDataUseCase);
