import { Router } from 'express';

import {
  googleAuth,
  googleAuthCallback,
} from '@/controllers/auth.controller';

const router = Router();
router.get("/", googleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
