import { Router } from 'express';
import {
  googleAuth,
  googleAuthCallback,
  getAllUsers,
  updateUser,
  getUserById
} from '@/controllers/auth.controller';
import verifyJwt  from '@/middlewares/verifyJwt.middleware';

const router = Router();
router.get("/", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/user", getAllUsers);
router.put("/user/update/:id", updateUser);
router.get("/user/:id", verifyJwt, getUserById);

export default router;
