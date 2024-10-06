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


// const userClient = new PrismaClient().users;

// get all users

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.users.findMany({
      include: {
        List: true
      }
    })

    res.status(200).json({data: users});
  } catch (err) {
    console.log(err);
  }
}

// get user by id

// create user

// update user


