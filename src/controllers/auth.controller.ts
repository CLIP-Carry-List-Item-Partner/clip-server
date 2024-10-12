import type { Request, Response } from "express";
import db from "@/services/db";
import ENV from "@/utils/env";
import jwt from "jsonwebtoken";
import { google } from "googleapis";

// import {
//   userSchema,
//   userUpdateSchema,
// } from "@/models/user.model";

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

    if (!data.email || !data.name) {
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

        },
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
    };

    const secret = ENV.APP_JWT_SECRET;

    if(!secret) {
      return internalServerError(res);
    }

    const expiresIn = 60 * 60 * 1;

    const token = jwt.sign(payload, secret, { expiresIn });

    return success(res, "User authenticated", {
      email: user.email,
      name: user.name,
      token,
    });

  } catch (err) {
    return internalServerError(res);
  }
};


