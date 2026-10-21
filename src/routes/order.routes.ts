import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createOrder, deleteOrder, getAllOrder, updateOrderStatus } from '../controllers/order.controller';



const router = Router();

router.post('/', createOrder); // post/api/v1/orders
router.get('/', auth('ADMIN', 'MODERATOR', 'STAFF'), getAllOrder); // post/api/v1/orders
router.patch('/:id/status', auth('ADMIN', 'MODERATOR', 'STAFF'), updateOrderStatus); // patch/api/v1/orders/:id/status
router.delete('/:id', auth('ADMIN', 'MODERATOR'), deleteOrder); // delete/api/v1/orders/:id

export const OrderRoutes = router;