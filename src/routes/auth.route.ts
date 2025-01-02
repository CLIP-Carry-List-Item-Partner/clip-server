import { Router } from 'express';
import {
  googleAuth,
  googleAuthCallback,
  // getAllUsers,
  updateUser,
  // getUserById,
  userProfile,
  profileUpdate,
  refreshToken,
  logout
} from '@/controllers/auth.controller';
import verifyJwt  from '@/middlewares/verifyJwt.middleware';

const router = Router();
router.get("/login", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/refresh", refreshToken);
router.delete("/logout", logout);

// User Profile
router.get("/user/profile", verifyJwt, userProfile);
router.put("/user/profile/update", verifyJwt, profileUpdate);

// Testing Route
// router.get("/user", verifyJwt, getAllUsers);
// router.put("/user/update/:id", updateUser);
// router.get("/user/:id", getUserById);


export default router;
