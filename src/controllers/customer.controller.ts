import { Request, Response } from "express";
import { createCustomerService, getAllCustomerService } from "../services/customer.service";

// createCustomer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {

  try{

    const { name, phone, email } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Customer name is required",
        data: null,
      });
      return;
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Customer phone number is required",
        data: null,
      });
      return;
    }

    const result = await createCustomerService({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Customer Saved Successfully",
      statusCode: 201,
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

// getAllCustomer
export const getAllCustomer = async (req: Request, res: Response): Promise<void> => {
  try{

  // Receiving the search term and status (type) from the query
  const searchTerm = req.query.searchTerm as string | undefined;
  const type = req.query.type as string | undefined;

  // Sent to the service layer
  const result = await getAllCustomerService({ searchTerm, type });

  // Successful response sent
  res.status(200).json({
    success: true,
    message: "Customers retrieved successfully",
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