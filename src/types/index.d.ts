declare namespace Express{
  export interface Request {
    user?: {
      id: number;
      name: string;
      email: string;
    };

    cookies: {
      jwt: string;
      jwtRefresh: string;
    }
  }
}