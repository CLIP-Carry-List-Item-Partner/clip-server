import { Router } from "express";
import { getAllUsers } from '../controllers/auth.controller';

const userRouter = Router();

userRouter.get('/users', getAllUsers);

export default userRouter;

