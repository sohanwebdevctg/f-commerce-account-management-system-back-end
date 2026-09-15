import { Request, Response } from "express";
import { createTransactionService, getAllTransactionsService, getSingleTransactionService, getTransactionSummaryService } from "../services/transaction.service";

// createTransaction
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, amount, note } = req.body;
    const user = (req as any).user; // req.user comes from auth middleware

    // Basic Validation Check
    if (!type || !amount) {
      res.status(400).json({
        success: false,
        message: "Transaction type and amount are required!",
      });
      return;
    }

    const result = await createTransactionService({
      type,
      amount: Number(amount),
      note,
      createdById: user.id,
      userRole: user.role,
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create transaction!",
    });
    return;
  }
};


// getAllTransactions
export const getAllTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const user = (req as any).user;

    const result = await getAllTransactionsService({
      searchTerm: search as string,
      userId: user.id,
      userRole: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch transactions!",
    });
    return;
  }
};


// getSingleTransaction
export const getSingleTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const result = await getSingleTransactionService({
      id: id as string,
      userId: user.id,
      userRole: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Transaction details fetched successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || "Transaction not found!",
    });
    return;
  }
};


// getTransactionSummary
export const getTransactionSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    const result = await getTransactionSummaryService({
      userId: user.id,
      userRole: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Transaction summary fetched successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(403).json({
      success: false,
      message: error.message || "Failed to fetch transaction summary!",
    });
    return;
  }
};