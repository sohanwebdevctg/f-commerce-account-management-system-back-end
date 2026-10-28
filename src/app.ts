// Import Express framework and essential type definitions
import express, { type Express, type Request, type Response } from 'express';
// Import CORS middleware for handling cross-origin resource sharing
import cors from 'cors';
// Import main API router for handling application endpoints
import router from './routes';
// Import path module to handle file and directory paths
import path from 'node:path';

// Initialize the Express application instance
const app: Express = express();

// Configure global application middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Mount application API routes under the v1 prefix
app.use('/api/v1', router);

// Expose the 'uploads' folder as static to serve uploaded files publicly
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Define a basic health check route for the server root
app.get('/', (req: Request, res: Response) => {
  res.send('Prisma F-commerce backend server running!');
});

// Export the configured Express application instance
export default app;