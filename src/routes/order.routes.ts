import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createOrder, deleteOrder, deleteOrderItem, getAllOrder, getSingleOrder, updateDamageQuantity, updateOrderQuantity, updateOrderStatus } from '../controllers/order.controller';



const router = Router();


// Define route endpoint
router.post('/', createOrder); // post/api/v1/orders
router.get('/', auth('ADMIN', 'MODERATOR', 'STAFF'), getAllOrder); // get/api/v1/orders
router.get('/:id', auth('ADMIN', 'MODERATOR', 'STAFF'), getSingleOrder); // get/api/v1/orders/:id

router.patch('/:id/status', auth('ADMIN', 'MODERATOR', 'STAFF'), updateOrderStatus); // patch/api/v1/orders/:id/status
router.patch('/items/:itemId/quantity', auth('ADMIN', 'MODERATOR'), updateOrderQuantity); // patch/api/v1/orders/items/:itemId/quantity
router.patch('/items/:itemId/damage', auth('ADMIN', 'MODERATOR'), updateDamageQuantity); // patch/api/v1/orders/items/:itemId/damage
router.delete('/items/:itemId', auth('ADMIN', 'MODERATOR'), deleteOrderItem); // delete/api/v1/orders/items/:itemId

router.delete('/:id', auth('ADMIN', 'MODERATOR'), deleteOrder); // delete/api/v1/orders/:id

// Export the order router module to be mounted in the main router
export const OrderRoutes = router;