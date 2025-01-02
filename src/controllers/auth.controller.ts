import type { Request, Response } from "express";
import db from "@/services/db";
import ENV from "@/utils/env";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import type { JWTModel } from '@/models/auth/jwt.model';

import {
  userUpdateSchema,
  userLoginSchema,
  userSchema,
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
  ENV.GOOGLE_CLIENT_ID,
  ENV.GOOGLE_CLIENT_SECRET,
  'https://clip-hub.tech/auth/google/callback'
  // awalnya http://localhost:8080/auth/google/callback
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

// Google Auth
export const googleAuth = async (_req: Request, res: Response) => {
  try {
    res.redirect(authorizationUrl)
  } catch (err) {
    return internalServerError(res);
  }
}

// User Login
export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code as string);
    // const accessTokenUrl = `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}&code=${code}&grant_type=${grant_type}&redirect_uri=http://localhost:4000/auth/google/callback`;
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

    const jwtToken = jwt.sign(
      payload,
      secret,
      {
        expiresIn: '24h',
      }
    );

    const jwtRefreshToken = jwt.sign(
      payload,
      secret,
      {
        expiresIn: '7d',
      }
    );

    res.cookie("jwt", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // partitioned: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    res.cookie("jwtRefresh", jwtRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // partitioned: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    // return success(res, `User authenticated, welcome ${user.name}`, {
    //   id: user.id,
    //   email: user.email,
    //   name: user.name,
    //   picture: data.picture,
    //   // kebutuhan testing
    //   // tokens,
    //   // accessTokenUrl,
    // })

    // nanti pakai yang ini
    return res.redirect(`${ENV.APP_FRONTEND_URL}`);

  } catch (err) {
    console.log(err);
    return internalServerError(res);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    if(!req.cookies.jwtRefresh) {
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        // partitioned: true,
      })

      res.clearCookie("jwtRefresh", {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        // partitioned: true,
      })
      return unauthorized(res, 'Refresh token is required');
    }

    const data = jwt.verify(
      req.cookies.jwt_refresh,
      ENV.APP_JWT_SECRET!,
      {
        algorithms: ["HS256"],
      }
    ) as JWTModel;

    const user = await db.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    }

    const jwtToken = jwt.sign(
      payload,
      ENV.APP_JWT_SECRET!,
      {
        expiresIn: '24h',
      }
    );

    res.cookie("jwt", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // partitioned: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return success(res, 'Token refreshed', {
      id: user.id,
      email: user.email,
      name: user.name
    });
  
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

// User Profile
export const userProfile = async (req: Request, res: Response)=> {
  try {
    if (!req.user) {
      return unauthorized(res, "User not found");
    }

    const user = await db.user.findFirst({
      where: {
        email: req.user.email,
      },
    });

    return success(res, "User profile fetched successfully", user);
  } catch (err) {
    return internalServerError(res);
  }
}

// Profile Update
export const profileUpdate = async (req: Request, res: Response)=> {
  try {
    if (!req.user) {
      return unauthorized(res, "User not found");
    }

    const validateBody = userUpdateSchema.safeParse(req.body);

    if (!validateBody.success) {
      return validationError(res, parseZodError(validateBody.error));
    }

    const userExist = await db.user.findFirst({
      where: {
        email: req.user.email,
      },
    })

    if (!userExist) {
      return notFound(res, "User not found");
    }

    const updateUser = await db.user.update({
      where: {
        id: req.user.id,
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

// Logout
export const logout = async (req: Request, res: Response) => {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // partitioned: true,
    })

    res.clearCookie("jwtRefresh", {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // partitioned: true,
    })

    return success(res, "Logout successfully");
}


// // Get all users
// export const getAllUsers = async (req: Request, res: Response) => {
//   try {
//     const users = await db.user.findMany();

//     return success(res, "Users fetched successfully", users);
//   } catch (err) {
//     return internalServerError(res);
//   }
// }

// // Get user by id
// export const getUserById = async (req: Request, res: Response) => {
//   try {
//     const validateId = req.params.id;

//     if (!validateId) {
//       return validationError(res, "Id is required");
//     }

//     const user = await db.user.findUnique({
//       where: {
//         id: parseInt(validateId),
//       },
//     });

//     return success(res, "User fetched successfully", user);
//   } catch (err) {
//     return internalServerError(res);
//   }
// }