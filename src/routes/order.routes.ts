import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createOrder } from '../controllers/order.controller';



const router = Router();

router.post('/', createOrder); // post/api/v1/orders


export const OrderRoutes = router;