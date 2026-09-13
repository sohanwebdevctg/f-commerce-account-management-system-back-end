import { Router } from 'express';
import { loginUser } from '../controllers/auth.controller';


const router = Router();


router.post('/login', loginUser); // post/api/v1/auth/login

export const AuthRoutes = router;