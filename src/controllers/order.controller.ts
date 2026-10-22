import { Request, Response } from "express";
import { createOrderService, deleteOrderService, getAllOrderService, getSingleOrderService, updateOrderStatusService } from "../services/order.service";

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


// getAllOrder
export const getAllOrder = async (req: Request, res: Response): Promise<void> => {
  try{
    const user = (req as any).user;

    const searchTerm = req.query.searchTerm as string | undefined;
    const type = req.query.type as string | undefined;

    // সার্ভিস লেয়ারে ডেটা প্রসেসিংয়ের জন্য পাঠানো
    const result = await getAllOrderService({
      user,
      searchTerm,
      type,
    });

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
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


// getSingleOrder
export const getSingleOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getSingleOrderService(id as string);

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      statusCode: 200,
      data: result,
    });
    return;

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }
};


// updateOrderStatus
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try{

    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user;

    const result = await updateOrderStatusService(id as string, status, user);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
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

// deleteOrder
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try{

    const { id } = req.params;

    const result = await deleteOrderService(id as string);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
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