import { Request, Response } from "express";
import { createCategoryService, deleteCategoryService, getAllActiveCategoryService, getAllCategoryService, getAllPublicCategoryService, getSingleCategoryService, restoreCategoryService, updateCategoryService, updateCategoryStatusService } from "../services/category.service";

// createCategory
export const createCategory = async (req: Request, res: Response): Promise<void> => {

  try{

    const {name, description, status} = req.body;
    const userId = (req as any).user?.id;

    // Basic Validation Check
    if(!name || typeof name !== "string" || !name.trim()){
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Category name is required",
        data: null,
      });
      return;
    }

    // create category service
    const result = await createCategoryService({
      name: name.trim(),
      description,
      status,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      message: "Category Created Successfully",
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


// getAllCategory
export const getAllCategory = async (req: Request, res: Response): Promise<void> => {

  try{

  // Retrieving parameters from the URL query
  const isDeleted = req.query.isDeleted === 'true';
  const searchTerm = req.query.searchTerm as string | undefined;

  // Sending data to the service layer for processing
      const result = await getAllCategoryService({isDeleted, searchTerm});
  
  // Sending a successful response to the client
  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    statusCode: 200,
    data: result
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

};

// getAllActiveCategory
export const getAllActiveCategory = async (req: Request, res: Response): Promise<void> => {
  try{
    const result = await getAllActiveCategoryService();

    res.status(200).json({
      success: true,
      message: "Active categories fetched successfully",
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


// getAllPublicCategory
export const getAllPublicCategory = async (req: Request, res: Response): Promise<void> => {
  try{

  const result = await getAllPublicCategoryService();

    res.status(200).json({
      success: true,
      message: "Public categories fetched successfully",
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


// getSingleCategory
export const getSingleCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // check id validation
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Category ID is required!",
        statusCode: 400,
        data: null,
      });
      return;
    }

    const result = await getSingleCategoryService(id as string);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Category not found!",
        statusCode: 404,
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
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


// updateCategoryStatus
export const updateCategoryStatus = async (req: Request, res: Response): Promise<void> => {

  try{
    const { id } = req.params;
    const { status } = req.body;

    const result = await updateCategoryStatusService(id as string, { status });

    res.status(200).json({
      success: true,
      message: "Category status updated successfully",
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

};


// deleteCategory
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {

  try{

    const { id } = req.params;

    const result = await deleteCategoryService(id as string);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
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

// restoreCategory
export const restoreCategory = async (req: Request, res: Response): Promise<void> => {

  try{

    const { id } = req.params;
    const result = await restoreCategoryService(id as string);

    res.status(200).json({
      success: true,
      message: "Category restored successfully",
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


// updateCategory
export const updateCategory = async (req: Request, res: Response): Promise<void> => {

  try{

    const { id } = req.params;
    const { name, description } = req.body;

    // basic validation (if a name is submitted, it cannot be an empty string)
    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Category name cannot be empty",
        data: null,
      });
      return;
    }

    // Update service call
    const result = await updateCategoryService(id as string, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? description.trim() : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Category Updated Successfully",
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