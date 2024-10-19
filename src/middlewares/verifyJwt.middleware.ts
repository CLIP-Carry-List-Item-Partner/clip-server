import type { Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import ENV from '@/utils/env';
import type { JWTModel } from '@/models/auth/jwt.model';
import { unauthorized } from '@/utils/responses';
import db from '@/services/db';

const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtToken = req.cookies.jwt as string | undefined;

    console.log("Received JWT Token:", jwtToken);

    if (!jwtToken) {
      return unauthorized(res, "Invalid session: JWT token not found");
    }

    const jwtData = jwt.verify(jwtToken, ENV.APP_JWT_SECRET!) as JWTModel;

    console.log("Decoded JWT Data:", jwtData);

    const user = await db.user.findUnique({
      where: {
        email: jwtData.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      return unauthorized(res, "User not found");
    }

    req.user = user;

    return next();
  } catch (err) {
    console.error("JWT Error:", err); // Log the error for debugging

    if (err instanceof jwt.TokenExpiredError) {
      return unauthorized(res, "JWT expired");
    } else if (err instanceof jwt.JsonWebTokenError) {
      return unauthorized(res, "JWT invalid");
    } else {
      return unauthorized(res, "JWT verification failed");
    }
  }
}


export default verifyJwt;
