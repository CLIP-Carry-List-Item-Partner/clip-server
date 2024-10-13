import { Router } from 'express';

import {
  googleAuth,
  googleAuthCallback,
  getAllUsers,
  updateUser,
  getUserById
} from '@/controllers/auth.controller';

const router = Router();
router.get("/", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/user", getAllUsers);
router.put("/user/update/:id", updateUser);
router.get("/user/:id", getUserById);

export default router;
