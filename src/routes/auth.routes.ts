// Import Router from Express to handle authentication routes
import { Router } from 'express';

// Import login controller function
import { loginUser } from '../controllers/auth.controller';

// Initialize the Express Router instance for auth
const router = Router();

// Define route endpoint
router.post('/login', loginUser); // post/api/v1/auth/login

// Export the auth router module
export const AuthRoutes = router;