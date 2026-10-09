import { Request, Response } from "express";
import { createTransactionService, getAllTransactionService, getDashboardSummaryService, getSingleTransactionService, updateSingleTransactionService } from "../services/transaction.service";

// createTransaction
export const createTransaction = async (req: Request, res: Response): Promise<void> => {

  try{

    const { amount, type, note } = req.body;
    const user = (req as any).user;

    // check input validation
    if (!amount || !type) {
      res.status(400).json({
        success: false,
        message: "Amount and Type are required fields",
      });
      return;
    }

  // check amount size
  if (amount <= 0) {
    res.status(400).json({
      success: false,
      message: "Amount must be a positive number greater than 0",
    });
    return;
  }

    // user role check and type check
    if (user?.role !== 'ADMIN' && type === 'INVESTMENT') {
      res.status(403).json({
        success: false,
        message: "Only ADMIN can create INVESTMENT transactions",
      });
      return;
    }

    // createTransactionService
    const result = await createTransactionService({
      amount,
      type,
      note,
      createdById: user.id,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Transaction created successfully",
      data: result,
    });
    return;

  }catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }

}

// getAllTransaction
export const getAllTransaction = async (req: Request, res: Response): Promise<void> => {

  try{

    const user = (req as any).user;

    // Retrieving parameters from the URL query
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const type = req.query.type as string | undefined;
    const searchTerm = req.query.searchTerm as string | undefined;

    // Sending data to the service layer for processing
    const result = await getAllTransactionService({
      user,
      startDate,
      endDate,
      type,
      searchTerm,
    });

    // Sending a successful response to the client
    res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      statusCode: 200,
      data: result,
    });
    return;

  }catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }

}


// getDashboardSummary
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {

  try{

    const user = (req as any).user;

    // Sending User ID and Role by making a service call
    const result = await getDashboardSummaryService(user.id, user.role);

    // Success response
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Dashboard summary fetched successfully",
      data: result,
    });
    return;

  }catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }

}


// getSingleTransaction
export const getSingleTransaction = async (req: Request, res: Response): Promise<void> => {
  try{

    const { id } = req.params;
    const user = (req as any).user;

    // Error return if ID does not exist
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Transaction ID is required",
        statusCode: 400,
        data: null,
      });
      return;
    }

    // Searching for data via the service call
    const result = await getSingleTransactionService(id);

    // If data is not found
    if (!result) {
      res.status(404).json({
        success: false,
        message: "Transaction not found",
        statusCode: 404,
        data: null,
      });
      return;
    }

    // If you are not an admin, the data must be your own
    if (user.role !== "ADMIN" && result.createdById !== user.id) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to view this transaction",
        statusCode: 403,
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully",
      statusCode: 200,
      data: result,
    });
    return;

  }catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }

}


// updateSingleTransaction
export const updateSingleTransaction = async (req: Request, res: Response): Promise<void> => {

  try{

    const { id } = req.params;
    const { amount, type, note } = req.body;
    const user = (req as any).user;

    // ID Check
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Transaction ID is required",
      });
      return;
    }

    // Required field check (amount and type must be present)
    if (!amount || !type) {
      res.status(400).json({
        success: false,
        message: "Amount and Type are required fields",
      });
      return;
    }

    // Check if the amount is positive.
    if (amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Amount must be a positive number greater than 0",
      });
      return;
    }

    // Fetching beforehand to check for the transaction in the database and to verify ownership
    const existingTransaction = await getSingleTransactionService(id as string);

    if (!existingTransaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
      return;
    }

    // Unless you are an ADMIN, you cannot update transactions created by others; you can only update transactions created by yourself
    if (user?.role !== "ADMIN" && existingTransaction.createdById !== user?.id) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to update this transaction",
      });
      return;
    }

    // Only the ADMIN user can assign or modify the INVESTMENT type
    if (user?.role !== "ADMIN" && type === "INVESTMENT") {
      res.status(403).json({
        success: false,
        message: "Only ADMIN can create or update to INVESTMENT transactions",
      });
      return;
    }

    // Completing the update by making a service call
    const result = await updateSingleTransactionService(id as string, {
      amount,
      type,
      note,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Transaction updated successfully",
      data: result,
    });
    return;


  }catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }

}