import express, {
  type Request,
  type Response
} from 'express'; 
import ENV from "@/utils/env";

import userRouter from './routes/user.router';

const dotenv = require('dotenv');
const app = express();

dotenv.config();

app.use(express.json());

app.use('/users', userRouter);

app.get("/home", (req: Request,res: Response) => {
  res.json({message: "CLIP"}).status(200)
})

app.get("/ping", (req: Request, res: Response) => {
  res.json({message: "pong"}).status(200);
});


app.listen(ENV.APP_PORT, () => {
  console.log(`Server is running on port ${ENV.APP_API_URL}`);
});

