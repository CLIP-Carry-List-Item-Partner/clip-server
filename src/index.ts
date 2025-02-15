import express, {
  type Request,
  type Response,
  type NextFunction
} from 'express'; 
import ENV from "@/utils/env";
import cors from 'cors';
import cookieParser from 'cookie-parser'; 
import { badRequest, notFound } from "@/utils/responses";

// [IMPORT ROUTES]
import indexRoute from "@/routes/index.route";
import listRoute from "@/routes/list.route";
import authRoute from "@/routes/auth.route";
import itemRoute from "@/routes/item.route";

const app = express();

const allowedOrigins = [
  "https://oauth.pstmn.io", // postman
  "https://localhost:5173", // dev client
  "https://clip-hub.tech"
];

// [COOKIE PARSER]
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
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
app.use("/", indexRoute);
app.use("/auth", authRoute);
app.use("/list", listRoute);
app.use("/item", itemRoute);

// [404]
app.all("*", (_req: Request, res: Response) => {
  return notFound(res, "Route not found");
});

app.listen(ENV.APP_PORT, () => {
  console.log(`Server is running on port ${ENV.APP_API_URL}`);
});

