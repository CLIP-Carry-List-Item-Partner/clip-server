import express, {
  type Request,
  type Response,
  type NextFunction
} from 'express'; 
import ENV from "@/utils/env";
import cors from 'cors';

import cookieParser from 'cookie-parser'; 

// [IMPORT ROUTES]
import listRoute from "@/routes/list.route";
import authRoute from "@/routes/auth.route";
import itemRoute from "@/routes/item.route";
import { badRequest, notFound } from "@/utils/responses";

const app = express();


const allowedOrigins = [
  "http://localhost:4000", // dev client
  "https://oauth.pstmn.io" // Postman
  // "https://onlyjun.xyz", // testing
];



// [USE COOKIE PARSER]
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow credentials to be sent with requests
  })
);


app.use(express.json());

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err) {
    return badRequest(res, err.message);
  }
  next();
});

// [USE ROUTES]
app.use("/list", listRoute);
app.use("/auth", authRoute);
app.use("/item", itemRoute);

// [404]
app.all("*", (_req: Request, res: Response) => {
  return notFound(res, "Route not found");
});

// [TEST ROUTE]
app.get("/test", (req: Request, res: Response) => {
  res.json({message: "Hello World"}).status(200);
});

app.listen(ENV.APP_PORT, () => {
  console.log(`Server is running on port ${ENV.APP_API_URL}`);
});

