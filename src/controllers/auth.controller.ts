import type { Request, Response } from "express";
import db from "@/services/db";
import ENV from "@/utils/env";
import jwt from "jsonwebtoken";
import { google } from "googleapis";

import {
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

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:4000/auth/google/callback'
)

const userScopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

const authorizationUrl = oauth2Client.generateAuthUrl({ 
  access_type: 'offline',
  scope: userScopes, 
  include_granted_scopes: true,
})

export const googleAuth = async (req: Request, res: Response) => {
  try {
    res.redirect(authorizationUrl)
  } catch (err) {
    return internalServerError(res);
  }
}

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const { data } = await oauth2.userinfo.get();

    if (!data.email || !data.name ) {
      return unauthorized(res, 'Google authentication failed');
    }

    let user = await db.user.findFirst({
      where: {
        email: data.email,
      },
    });


    if (!user) {
      user = await db.user.create({
        data: {
          email: data.email,
          name: data.name,
          picture: data.picture!,
        },
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: data.picture,
    };

    const secret = ENV.APP_JWT_SECRET;

    if(!secret) {
      return internalServerError(res);
    }

    const expiresIn = 60 * 60 * 1;

    const token = jwt.sign(payload, secret, { expiresIn });

    return success(res, "User authenticated", {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: data.picture,
      token,
    });

  } catch (err) {
    return internalServerError(res);
  }
};

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.user.findMany();

    return success(res, "Users fetched successfully", users);
  } catch (err) {
    return internalServerError(res);
  }
}

// Get user by id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const validateId = req.params.id;

    if (!validateId) {
      return validationError(res, "Id is required");
    }

    const user = await db.user.findUnique({
      where: {
        id: parseInt(validateId),
      },
    });

    return success(res, "User fetched successfully", user);
  } catch (err) {
    return internalServerError(res);
  }
}

// Update username
export const updateUser = async (req: Request, res: Response) => {
  try {
    const validateId = req.params.id;

    if (!validateId) {
      return validationError(res, "Id is required");
    }

    const validateBody = userUpdateSchema.safeParse(req.body);

    if (!validateBody.success) {
      return validationError(res, parseZodError(validateBody.error));
    }

    const user = await db.user.findUnique({
      where: {
        id: parseInt(validateId),      
      }
    })

    if(!user){
      return notFound (res, `User with id ${parseInt(validateId)} not found`)
    }

    const updateUser = await db.user.update({
      where: {
        id: parseInt(validateId),
      },
      data: {
        name: validateBody.data.name,
      },
    });

    return success(res, "User updated successfully", updateUser);
    
  } catch (err) {
    return internalServerError(res);
  }
}
