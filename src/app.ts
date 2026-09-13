import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import router from './routes';
import path from "path";

const app: Express = express();

// middleware here
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// all route middleware here
app.use('/api/v1', router);

// Expose the 'uploads' folder as static
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.get('/', (req: Request, res: Response) => {
  res.send('Prisma F-commerce backend server running!');
});

export default app;