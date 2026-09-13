import { Request, Response } from "express";
import { createCategoryService, getAllCategoriesService, getCategoryByIdService, getPublicCategoriesService, restoreCategoryService, softDeleteCategoryService, updateCategoryService, updateCategoryStatusService } from "../services/category.service";

// createCategory
export const createCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access!",
      });
    }

    const result = await createCategoryService(userId, req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
};

// getAllCategories
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    // Receiving isDeleted and searchTerm from (req.query)
    const filters = {
      isDeleted: req.query.isDeleted as string | undefined,
      searchTerm: req.query.searchTerm as string | undefined,
    };

    const result = await getAllCategoriesService(filters);

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories!",
    });
    return;
  }
};


// getCategoryById
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getCategoryByIdService(id as string);

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully!',
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Category not found!',
    });
    return;
  }
};


// updateCategoryStatus
export const updateCategoryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await updateCategoryStatusService(id as string, status);

    res.status(200).json({
      success: true,
      message: "Category status updated successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update category status",
    });
  }
};

// updateCategory
export const updateCategory = async ( req: Request, res: Response ): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await updateCategoryService(id as string, req.body);

    res.status(200).json({
      success: true,
      message: "Category updated successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update category!",
    });
    return;
  }
};

// softDeleteCategory
export const softDeleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await softDeleteCategoryService(id as string);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete category!",
    });
    return;
  }
};


// restoreCategory
export const restoreCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await restoreCategoryService(id as string);

    res.status(200).json({
      success: true,
      message: "Category restored successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to restore category!",
    });
    return;
  }
};


// getPublicCategories
export const getPublicCategories = async (_req: Request,res: Response ): Promise<void> => {
  try {
    const result = await getPublicCategoriesService();

    res.status(200).json({
      success: true,
      message: "Public categories retrieved successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch public categories!",
    });
    return;
  }
};