// Import Router from Express to handle customer-related routing
import { Router } from 'express';
// Import authentication and role-based authorization middleware
import { auth } from '../middlewares/auth';
// Import customer controller functions for handling business logic
import { createCustomer, getAllCustomer, updateCustomerStatus } from '../controllers/customer.controller';


// Initialize the Express Router instance for customer module
const router = Router();

// Define route endpoint
router.post('/', createCustomer); // post/api/v1/customers
router.get('/', auth('ADMIN', 'MODERATOR', 'STAFF'), getAllCustomer); // get/api/v1/customers
// router.get('/:id', auth('ADMIN', 'MODERATOR', 'STAFF'), getSingleCustomerOrder); // get/api/v1/customers/:id
router.patch('/:id/status', auth('ADMIN', 'MODERATOR'), updateCustomerStatus); // patch/api/v1/customers/:id/status

// Export the customer router module to be mounted in the main router
export const CustomerRoutes = router;