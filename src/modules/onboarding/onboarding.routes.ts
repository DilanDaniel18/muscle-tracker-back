import { Router } from 'express';
import {
  onboardingController,
  authMiddleware,
  optionalAuthMiddleware,
} from './onboarding.dependencies.js';

export const onboardingRouter = Router();

// Consultar perfil de onboarding del usuario autenticado o por ID
onboardingRouter.get('/me', authMiddleware, (req, res) =>
  onboardingController.getProfile(req, res)
);
onboardingRouter.get('/:userId', optionalAuthMiddleware, (req, res) =>
  onboardingController.getProfile(req, res)
);

// Registrar / actualizar datos del onboarding
onboardingRouter.post('/', optionalAuthMiddleware, (req, res) =>
  onboardingController.saveProfile(req, res)
);
onboardingRouter.put('/', optionalAuthMiddleware, (req, res) =>
  onboardingController.saveProfile(req, res)
);
onboardingRouter.post('/:userId', optionalAuthMiddleware, (req, res) =>
  onboardingController.saveProfile(req, res)
);
onboardingRouter.put('/:userId', optionalAuthMiddleware, (req, res) =>
  onboardingController.saveProfile(req, res)
);

