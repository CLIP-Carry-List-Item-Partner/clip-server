import { Router } from "express";
import { getAllUsers } from '@/controllers/auth.controller';

const router = Router();

router.get('/all', getAllUsers);

export default router;

