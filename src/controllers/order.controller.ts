// Import Request and Response types from Express for handling HTTP communication
import { Request, Response } from "express";
// Import all order-related service functions from the service layer
import { createOrderService, deleteOrderItemService, deleteOrderService, getAllOrderService, getSingleOrderService, updateDamageQuantityService, updateOrderQuantityService, updateOrderStatusService } from "../services/order.service";

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

// updateOrderQuantity
export const updateOrderQuantity = async (req: Request, res: Response): Promise<void> => {
  try{

    const { itemId } = req.params;
    const { type } = req.body; // 'increment' অথবা 'decrement'

    if (!type || (type !== "increment" && type !== "decrement")) {
      res.status(400).json({
        success: false,
        message: "Invalid action type! Must be 'increment' or 'decrement'.",
        statusCode: 400,
        data: null,
      });
      return;
    }

    const result = await updateOrderQuantityService(itemId as string, type);

    res.status(200).json({
      success: true,
      message: `Quantity ${type === "increment" ? "increased" : "decreased"} successfully!`,
      statusCode: 200,
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

// updateDamageQuantity
export const updateDamageQuantity = async (req: Request, res: Response): Promise<void> => {
  try{
    const user = (req as any).user;

    // checking role
    if (user?.role === "STAFF") {
      res.status(403).json({
        success: false,
        message: "Staff is not authorized to update damage quantity!",
        statusCode: 403,
        data: null,
      });
      return;
    }

    const { itemId } = req.params;
    const { damagedQuantity } = req.body;

    if (damagedQuantity === undefined || damagedQuantity < 0) {
      res.status(400).json({
        success: false,
        message: "Valid damaged quantity is required!",
        statusCode: 400,
        data: null,
      });
      return;
    }

    const result = await updateDamageQuantityService(itemId as string, Number(damagedQuantity));

    res.status(200).json({
      success: true,
      message: "Damage quantity updated successfully!",
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


// deleteOrderItem
export const deleteOrderItem = async (req: Request, res: Response): Promise<void> => {
  try{

    const { itemId } = req.params;

    const result = await deleteOrderItemService(itemId as string);

    res.status(200).json({
      success: true,
      message: "Order item deleted successfully and stock restocked",
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