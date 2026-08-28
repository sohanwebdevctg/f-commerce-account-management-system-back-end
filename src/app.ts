import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';

const app: Express = express();


// middleware here
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// all route middleware here

app.get('/', (req: Request, res: Response) => {
  res.send('Prisma F-commerce backend server running!');
});

export default app;