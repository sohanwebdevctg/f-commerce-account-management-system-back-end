import { Request, Response } from "express";
import { createOrderService } from "../services/order.service";

// createOrder
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try{

    const result = await createOrderService(req.body);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      statusCode: 201,
      data: result,
    });

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