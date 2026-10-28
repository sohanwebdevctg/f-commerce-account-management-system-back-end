// Import Request and Response types from Express for handling HTTP communication
import { Request, Response } from "express";
// Import all category-related service functions from the service layer
import { createCategoryService, deleteCategoryService, getAllActiveCategoryService, getAllCategoryService, getAllPublicCategoryService, getSingleCategoryService, restoreCategoryService, updateCategoryService, updateCategoryStatusService } from "../services/category.service";

// createCategory
export const createCategory = async (req: Request, res: Response): Promise<void> => {

  try{

    // Extract category details from request body and user ID from the authenticated request object
    const {name, description, status} = req.body;
    const userId = (req as any).user?.id;

   // Basic validation check to ensure the category name is provided and is a valid non-empty string
    if(!name || typeof name !== "string" || !name.trim()){
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Category name is required",
        data: null,
      });
      return;
    }

    // Call the category service to process and save the new category in the database
    const result = await createCategoryService({
      name: name.trim(),
      description,
      status,
      createdBy: userId
    });

    // Send a 201 created response with success message and the created category data
    res.status(201).json({
      success: true,
      message: "Category Created Successfully",
      statusCode: 201,
      data: result,
    });
    return;

  }catch (error: any) {
    // Catch any unexpected errors during category creation and return a 500 server error response
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null,
    });
    return;
  }

};


// getAllCategory
export const getAllCategory = async (req: Request, res: Response): Promise<void> => {

  try{

  // Retrieving parameters from the URL query
  const isDeleted = req.query.isDeleted === 'true';
  const searchTerm = req.query.searchTerm as string | undefined;

  // Sending data to the service layer for processing
      const result = await getAllCategoryService({isDeleted, searchTerm});
  
  // Sending a successful response to the client with the retrieved categories
  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    statusCode: 200,
    data: result
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

// getAllActiveCategory
export const getAllActiveCategory = async (req: Request, res: Response): Promise<void> => {
  try{

    // Call the service layer to fetch active categories from the database
    const result = await getAllActiveCategoryService();

    // Send a successful response with the retrieved active categories data
    res.status(200).json({
      success: true,
      message: "Active categories fetched successfully",
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


// getAllPublicCategory
export const getAllPublicCategory = async (req: Request, res: Response): Promise<void> => {
  try{

    // Call the service layer to fetch public categories from the database
  const result = await getAllPublicCategoryService();

  // Send a successful response with the retrieved public categories data
    res.status(200).json({
      success: true,
      message: "Public categories fetched successfully",
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


// getSingleCategory
export const getSingleCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract the category ID from the request parameters
    const { id } = req.params;

    // Check if the category ID is provided and valid
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Category ID is required!",
        statusCode: 400,
        data: null,
      });
      return;
    }

    // Call the service layer to fetch the category record from the database
    const result = await getSingleCategoryService(id as string);

    // Return a 404 response if the category does not exist or is deleted
    if (!result) {
      res.status(404).json({
        success: false,
        message: "Category not found!",
        statusCode: 404,
        data: null,
      });
      return;
    }

    // Send a successful response with the retrieved category details
    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      statusCode: 200,
      data: result,
    });
    return;

  } catch (error: any) {
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


// updateCategoryStatus
export const updateCategoryStatus = async (req: Request, res: Response): Promise<void> => {

  try{
    // Extract category ID from request parameters and status from request body
    const { id } = req.params;
    const { status } = req.body;

    // Call the service layer to update the category status in the database
    const result = await updateCategoryStatusService(id as string, { status });

    // Send a successful response with the updated category data
    res.status(200).json({
      success: true,
      message: "Category status updated successfully",
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


// deleteCategory
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {

  try{

    // Extract category ID from the request parameters
    const { id } = req.params;

    // Call the service layer to perform the soft-delete operation in the database
    const result = await deleteCategoryService(id as string);

    // Send a successful response indicating the category has been deleted
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
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

// restoreCategory
export const restoreCategory = async (req: Request, res: Response): Promise<void> => {

  try{

    // Extract category ID from the request parameters
    const { id } = req.params;
    // Call the service layer to perform the restoration operation in the database
    const result = await restoreCategoryService(id as string);

    // Send a successful response indicating the category has been restored
    res.status(200).json({
      success: true,
      message: "Category restored successfully",
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


// updateCategory
export const updateCategory = async (req: Request, res: Response): Promise<void> => {

  try{

    // Extract category ID from request parameters and name, description from request body
    const { id } = req.params;
    const { name, description } = req.body;

    // Basic validation check (if a name is submitted, it cannot be an empty string)
    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Category name cannot be empty",
        data: null,
      });
      return;
    }

    // Call the service layer to update category details in the database
    const result = await updateCategoryService(id as string, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? description.trim() : undefined,
    });

    // Send a successful response with the updated category data
    res.status(200).json({
      success: true,
      message: "Category Updated Successfully",
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