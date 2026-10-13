import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createCustomer, getAllCustomer } from '../controllers/customer.controller';



const router = Router();

router.post('/', createCustomer); // post/api/v1/customers
router.get('/', auth('ADMIN', 'MODERATOR', 'STAFF'), getAllCustomer); // get/api/v1/customers


export const CustomerRoutes = router;