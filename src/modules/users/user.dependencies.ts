import { TypeormUserRepository } from './typeorm.user.repository.js';
import {
  RegisterUserUseCase,
  UpdateUserAdditionalDataUseCase,
  LoginUserUseCase,
  GetCurrentUserSessionUseCase,
  LogoutUserUseCase,
} from './user.usecase.js';
import { JwtSessionManager } from './session.manager.js';
import { createAuthMiddleware, createOptionalAuthMiddleware } from './auth.middleware.js';
import { UserController } from './user.controller.js';

const userRepository = new TypeormUserRepository();
export const sessionManager = new JwtSessionManager();

export const registerUserUseCase = new RegisterUserUseCase(userRepository, sessionManager);
export const updateUserAdditionalDataUseCase = new UpdateUserAdditionalDataUseCase(userRepository);
export const loginUserUseCase = new LoginUserUseCase(userRepository, sessionManager);
export const getCurrentUserSessionUseCase = new GetCurrentUserSessionUseCase(userRepository);
export const logoutUserUseCase = new LogoutUserUseCase(sessionManager);

export const authMiddleware = createAuthMiddleware(sessionManager);
export const optionalAuthMiddleware = createOptionalAuthMiddleware(sessionManager);

export const userController = new UserController(
  registerUserUseCase,
  updateUserAdditionalDataUseCase,
  loginUserUseCase,
  getCurrentUserSessionUseCase,
  logoutUserUseCase
);
