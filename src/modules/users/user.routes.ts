import { Router } from 'express';
import { userController, authMiddleware, optionalAuthMiddleware } from './user.dependencies.js';

export const userRouter = Router();

// Registro de usuarios
userRouter.post('/', (req, res) => userController.create(req, res));
userRouter.post('/register', (req, res) => userController.create(req, res));

// Inicio y gestión de sesión
userRouter.post('/login', (req, res) => userController.login(req, res));
userRouter.post('/logout', authMiddleware, (req, res) => userController.logout(req, res));
userRouter.get('/me', authMiddleware, (req, res) => userController.getSession(req, res));
userRouter.get('/session', authMiddleware, (req, res) => userController.getSession(req, res));

// Actualización de datos adicionales
userRouter.put('/:id/additional-data', optionalAuthMiddleware, (req, res) => userController.updateAdditionalData(req, res));
userRouter.patch('/:id/additional-data', optionalAuthMiddleware, (req, res) => userController.updateAdditionalData(req, res));
userRouter.put('/additional-data', optionalAuthMiddleware, (req, res) => userController.updateAdditionalData(req, res));
userRouter.patch('/additional-data', optionalAuthMiddleware, (req, res) => userController.updateAdditionalData(req, res));
