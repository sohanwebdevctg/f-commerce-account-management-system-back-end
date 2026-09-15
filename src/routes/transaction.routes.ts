import { Router } from "express";
import { auth } from "../middlewares/auth";
import { createTransaction, getAllTransactions, getSingleTransaction, getTransactionSummary } from "../controllers/transaction.controller";

const router = Router();


router.post("/", auth("ADMIN", "MODERATOR", "STAFF"), createTransaction); // post/api/v1/transactions
router.get("/", auth("ADMIN", "MODERATOR", "STAFF"), getAllTransactions); // get/api/v1/transactions
router.get("/summary", auth("ADMIN"), getTransactionSummary); // get/api/v1/transactions/summary
router.get("/:id", auth("ADMIN", "MODERATOR", "STAFF"), getSingleTransaction); // get/api/v1/transaction/:id

export const TransactionRoutes = router;