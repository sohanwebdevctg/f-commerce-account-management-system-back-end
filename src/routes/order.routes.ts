import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createOrder, deleteOrder, deleteOrderItem, getAllOrder, getSingleOrder, updateOrderQuantity, updateOrderStatus } from '../controllers/order.controller';



const router = Router();

router.post('/', createOrder); // post/api/v1/orders
router.get('/', auth('ADMIN', 'MODERATOR', 'STAFF'), getAllOrder); // get/api/v1/orders
router.get('/:id', auth('ADMIN', 'MODERATOR', 'STAFF'), getSingleOrder); // get/api/v1/orders/:id

router.patch('/:id/status', auth('ADMIN', 'MODERATOR', 'STAFF'), updateOrderStatus); // patch/api/v1/orders/:id/status
router.patch('/items/:itemId/quantity', auth('ADMIN', 'MODERATOR'), updateOrderQuantity);
router.delete('/items/:itemId', auth('ADMIN', 'MODERATOR'), deleteOrderItem); // delete/api/v1/orders/items/:itemId

router.delete('/:id', auth('ADMIN', 'MODERATOR'), deleteOrder); // delete/api/v1/orders/:id


export const OrderRoutes = router;