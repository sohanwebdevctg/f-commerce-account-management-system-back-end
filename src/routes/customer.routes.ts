import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createCustomer, getAllCustomer, updateCustomerStatus } from '../controllers/customer.controller';



const router = Router();

router.post('/', createCustomer); // post/api/v1/customers
router.get('/', auth('ADMIN', 'MODERATOR', 'STAFF'), getAllCustomer); // get/api/v1/customers
// router.get('/:id', auth('ADMIN', 'MODERATOR', 'STAFF'), getSingleCustomerOrder); // get/api/v1/customers/:id
router.patch('/:id/status', auth('ADMIN', 'MODERATOR'), updateCustomerStatus); // patch/api/v1/customers/:id/status


export const CustomerRoutes = router;