// import { PrismaClient } from "@prisma/client";

import type { Request, Response } from "express";
import db from "@/services/db";
import ENV from "@/utils/env";
import {
  userSchema,
  userUpdateSchema,
} from "@/models/user.model";


import {
  internalServerError,
  success,
  notFound,
  validationError,
  parseZodError,
  unauthorized,
} from "@/utils/responses";



// get all users

// get user by id

// create user

// update user


