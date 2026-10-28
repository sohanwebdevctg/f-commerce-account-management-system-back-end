// Import Request and Response types from Express for handling HTTP communication
import { Request, Response } from "express";
// Import all customer-related service functions from the service layer
import { createCustomerService, getAllCustomerService, updateCustomerStatusService } from "../services/customer.service";

// createCustomer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {

  try{
    // Extract customer details (name, phone, email) from the request body
    const { name, phone, email } = req.body;

    // Validate that the customer name is provided and is a valid non-empty string
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Customer name is required",
        data: null,
      });
      return;
    }

    // Validate that the customer phone number is provided and is a valid non-empty string
    if (!phone || typeof phone !== "string" || !phone.trim()) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Customer phone number is required",
        data: null,
      });
      return;
    }

    // Call the service layer to process customer creation or retrieval
    const result = await createCustomerService({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
    });

    // Send a 201 created response with success message and customer data
    res.status(201).json({
      success: true,
      message: "Customer Saved Successfully",
      statusCode: 201,
      data: result,
    });
    return;

  }catch (error: any) {
    // Catch any unexpected errors and return a 500 server error response
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }

};

// getAllCustomer
export const getAllCustomer = async (req: Request, res: Response): Promise<void> => {
  try{

  // Receiving the search term and customer type from the query parameters
  const searchTerm = req.query.searchTerm as string | undefined;
  const type = req.query.type as string | undefined;

  // Send parameters to the service layer for processing database queries
  const result = await getAllCustomerService({ searchTerm, type });

  // Send a successful response back to the client with the retrieved customer data
  res.status(200).json({
    success: true,
    message: "Customers retrieved successfully",
    statusCode: 200,
    data: result,
  });
  return;

  }catch (error: any) {
    // Catch any unexpected errors and return a 500 server error response
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }
};

// updateCustomerStatus
export const updateCustomerStatus = async (req: Request, res: Response): Promise<void> => {
  try{

  // Extract customer ID from the request parameters and customerType from the request body
  const { id } = req.params;
    const { customerType } = req.body;

    // Call the service layer to update the customer status in the database
    const result = await updateCustomerStatusService(id as string, { customerType });

    // Send a successful response back to the client with the updated customer status data
    res.status(200).json({
      success: true,
      message: "Customer status updated successfully",
      statusCode: 200,
      data: result,
    });
    return;

  }catch (error: any) {
    // Catch any unexpected errors and return a 500 server error response
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }
};