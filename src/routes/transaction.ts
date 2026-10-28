import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createTransaction, getAllTransaction, getDashboardSummary, getSingleTransaction, updateSingleTransaction } from '../controllers/transaction.controller';



const router = Router();

// Define route endpoint
router.post('/', auth('ADMIN', 'MODERATOR', 'STAFF'), createTransaction); // post/api/v1/transactions
router.get('/', auth('ADMIN', 'MODERATOR', 'STAFF'), getAllTransaction); // get/api/v1/transactions
router.get( '/summary', auth('ADMIN', 'MODERATOR', 'STAFF'), getDashboardSummary); // get/api/v1/transactions/summary
router.get('/:id', auth('ADMIN', 'MODERATOR', 'STAFF'), getSingleTransaction); 
// get/api/v1/transactions/:id
router.patch('/:id', auth('ADMIN', 'MODERATOR', 'STAFF'), updateSingleTransaction); 
// patch/api/v1/transactions/:id


// Export the transaction router module to be mounted in the main router
export const TransactionRoutes = router;