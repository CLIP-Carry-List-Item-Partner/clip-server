import express, {
  type Request,
  type Response
} from 'express'; 
import ENV from "@/utils/env";

// [IMPORT ROUTES]
import listRoute from "@/routes/list.route";
import userRoute from "@/routes/user.route";
import itemRoute from "@/routes/item.route";

// import userRouter from './routes/user.router';

// const dotenv = require('dotenv');
const app = express();

// dotenv.config();

app.use(express.json());

// app.use('/users', userRouter);


// [USE ROUTES]
app.use("/list", listRoute);
app.use("/users", userRoute);
app.use("/item", itemRoute);

// [TEST ROUTE]
app.get("/test", (req: Request, res: Response) => {
  res.json({message: "Hello World"}).status(200);
});

app.listen(ENV.APP_PORT, () => {
  console.log(`Server is running on port ${ENV.APP_API_URL}`);
});

