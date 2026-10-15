import { Router } from 'express';
import { userController } from './user.dependencies.js';

export const userRouter = Router();

userRouter.post('/', (req, res) => userController.create(req, res));
userRouter.post('/register', (req, res) => userController.create(req, res));
userRouter.put('/:id/additional-data', (req, res) => userController.updateAdditionalData(req, res));
userRouter.patch('/:id/additional-data', (req, res) => userController.updateAdditionalData(req, res));
userRouter.put('/additional-data', (req, res) => userController.updateAdditionalData(req, res));
userRouter.patch('/additional-data', (req, res) => userController.updateAdditionalData(req, res));
