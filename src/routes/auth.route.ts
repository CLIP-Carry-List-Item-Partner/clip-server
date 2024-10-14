import { Router } from 'express';
import {
  googleAuth,
  googleAuthCallback,
  getAllUsers,
  updateUser,
  getUserById,
  userProfile,
  profileUpdate,
  refreshToken
} from '@/controllers/auth.controller';
import verifyJwt  from '@/middlewares/verifyJwt.middleware';

const router = Router();
router.get("/login", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/refresh", refreshToken);

// Testing Route
// router.get("/user", verifyJwt, getAllUsers);
// router.put("/user/update/:id", updateUser);
// router.get("/user/:id", getUserById);

// User Profile
router.get("/user/profile", verifyJwt, userProfile);
router.put("/user/profile/update", verifyJwt, profileUpdate);

export default router;
