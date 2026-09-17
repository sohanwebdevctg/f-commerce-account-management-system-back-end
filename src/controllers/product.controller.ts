import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { createProductService, getAllProductsService, getProductByIdService, getPublicProductByIdService, getPublicProductsService, restoreColorService, restoreProductService, restoreVariantService, softDeleteColorService, softDeleteProductService, softDeleteVariantService, updateColorStatusService, updateProductService, updateProductStatusService, updateVariantStatusService } from "../services/product.service";

// Helper Function: To delete files from failed requests
const deleteUploadedFiles = (files: any) => {
  if (!files) return;

  const fileList: any[] = [];
  if (files.thumbnailImage) fileList.push(...files.thumbnailImage);
  if (files.images) fileList.push(...files.images);

  fileList.forEach((file) => {
    const filePath = path.join(process.cwd(), "public/uploads", file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // It will delete the file from the folder
    }
  });
};

// createProduct
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const files = (req as any).files;

  try {
    const createdById = (req as any).user?.id;
    let payload = { ...req.body };

    // Product Thumbnail Image Check (Mandatory)
    if (!files?.thumbnailImage?.[0]) {
      throw new Error("Product thumbnail image is required!");
    } else {
      payload.thumbnailImage = `/uploads/${files.thumbnailImage[0].filename}`;
    }

    // Safe JSON Parsing with User-Friendly Error Messages
    if (typeof payload.variants === "string") {
      try {
        payload.variants = JSON.parse(payload.variants);
      } catch (err) {
        throw new Error("Please provide valid variant details!");
      }
    }

    if (typeof payload.images === "string") {
      try {
        payload.images = JSON.parse(payload.images);
      } catch (err) {
        throw new Error("Please upload or provide valid product images!");
      }
    }

    // Multer Multiple Files Upload (Gallery / Variant Images Mapping)
    if (files?.images && files.images.length > 0) {
      payload.images = files.images.map((f: any) => `/uploads/${f.filename}`);
    }

    // Check Variant Images Validation (Each variant block must contain at least one image)
    if (payload.productType === "VARIANT" && Array.isArray(payload.variants)) {
      for (const variantBlock of payload.variants) {
        if (!variantBlock.images || !Array.isArray(variantBlock.images) || variantBlock.images.length === 0) {
          throw new Error("Please upload at least one image for each variant!");
        }
      }
    }

    // Number & Boolean Parsing for Form-Data
    if (payload.isActive !== undefined) {
      payload.isActive = payload.isActive === "true" || payload.isActive === true;
    }

    if (payload.minPrice) payload.minPrice = Number(payload.minPrice);
    if (payload.maxPrice) payload.maxPrice = Number(payload.maxPrice);
    if (payload.costPrice) payload.costPrice = Number(payload.costPrice);
    if (payload.sellPrice) payload.sellPrice = Number(payload.sellPrice);
    if (payload.stock) payload.stock = Number(payload.stock);
    if (payload.vatPercent) payload.vatPercent = Number(payload.vatPercent);
    if (payload.discountPercent) payload.discountPercent = Number(payload.discountPercent);
    if (payload.profit) payload.profit = Number(payload.profit);

    const result = await createProductService(createdById, payload);

    res.status(201).json({
      success: true,
      message: "Product created successfully!",
      data: result,
    });
  } catch (error: any) {
    // CLEANUP: Deletes uploaded files if an error occurs during database operations
    deleteUploadedFiles(files);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};


// getAllProducts
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Receiving isDeleted and searchTerm from (req.query)
    const filters = {
      isDeleted: req.query.isDeleted as string | undefined,
      searchTerm: req.query.searchTerm as string | undefined,
    };

    const result = await getAllProductsService(filters);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products!",
    });
    return;
  }
};


// getProductById
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getProductByIdService(id as string);

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully!',
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Product not found!',
    });
    return;
  }
};


// updateProduct
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const files = (req as any).files;

  try {
    const { id } = req.params;
    const updatedById = (req as any).user?.id;
    let payload = { ...req.body };

    // Thumbnail Image Check (Optional during update, only update if new file uploaded)
    if (files?.thumbnailImage?.[0]) {
      payload.thumbnailImage = `/uploads/${files.thumbnailImage[0].filename}`;
    }

    // Safe JSON Parsing for Variant Product Payload
    if (typeof payload.variants === "string") {
      try {
        payload.variants = JSON.parse(payload.variants);
      } catch (err) {
        throw new Error("Please provide valid variant details!");
      }
    }

    // Safe JSON Parsing for Gallery Images Payload
    if (typeof payload.images === "string") {
      try {
        payload.images = JSON.parse(payload.images);
      } catch (err) {
        throw new Error("Please upload or provide valid product images!");
      }
    }

    // Multer Multiple Files Upload (Gallery Images)
    if (files?.images && files.images.length > 0) {
      payload.images = files.images.map((f: any) => `/uploads/${f.filename}`);
    }

    // Number & Boolean Parsing for Form-Data Input
    if (payload.isActive !== undefined) {
      payload.isActive = payload.isActive === "true" || payload.isActive === true;
    }

    if (payload.minPrice) payload.minPrice = Number(payload.minPrice);
    if (payload.maxPrice) payload.maxPrice = Number(payload.maxPrice);
    if (payload.costPrice) payload.costPrice = Number(payload.costPrice);
    if (payload.sellPrice) payload.sellPrice = Number(payload.sellPrice);
    if (payload.stock) payload.stock = Number(payload.stock);
    if (payload.vatPercent) payload.vatPercent = Number(payload.vatPercent);
    if (payload.discountPercent) payload.discountPercent = Number(payload.discountPercent);

    // Call updateProductService
    const result = await updateProductService(id as string, updatedById, payload);

    res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      data: result,
    });
  } catch (error: any) {
    // CLEANUP: Deletes uploaded files if update operation fails
    deleteUploadedFiles(files);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update product!",
    });
  }
};


// updateProductStatus
export const updateProductStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      throw new Error("Please provide a valid boolean 'isActive' status (true/false)!");
    }

    const result = await updateProductStatusService(id as string, isActive);

    res.status(200).json({
      success: true,
      message: "Product status updated successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update product status!",
    });
  }
};

// softDeleteProduct
export const softDeleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await softDeleteProductService(id as string);

    res.status(200).json({
      success: true,
      message: "Product soft deleted successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete product!",
    });
    return;
  }
};

// restoreProduct
export const restoreProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await restoreProductService(id as string);

    res.status(200).json({
      success: true,
      message: "Product restored successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to restore product!",
    });
    return;
  }
};


// updateColorStatus
export const updateColorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, colorId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      throw new Error("Please provide a valid boolean 'isActive' status (true/false)!");
    }

    const result = await updateColorStatusService(
      productId as string,
      colorId as string,
      isActive
    );

    res.status(200).json({
      success: true,
      message: "Color variants status updated successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update color variants status!",
    });
  }
};


// softDeleteColor
export const softDeleteColor = async ( req: Request, res: Response
): Promise<void> => {
  try {
    const { productId, colorId } = req.params;

    const result = await softDeleteColorService(productId as string, colorId as string);

    res.status(200).json({
      success: true,
      message: "Color soft deleted successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to soft delete color!",
    });
    return;
  }
};


// restoreColor
export const restoreColor = async ( req: Request, res: Response
): Promise<void> => {
  try {
    const { productId, colorId } = req.params;

    const result = await restoreColorService(productId as string, colorId as string);

    res.status(200).json({
      success: true,
      message: "Color restored successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to restore color!",
    });
    return;
  }
};


// updateVariantStatus
export const updateVariantStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      throw new Error(
        "Please provide a valid boolean 'isActive' status (true/false)!"
      );
    }

    const result = await updateVariantStatusService(variantId as string,isActive);

    res.status(200).json({
      success: true,
      message: "Variant status updated successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update variant status!",
    });
    return;
  }
};


// softDeleteVariant
export const softDeleteVariant = async (req: Request,res: Response ): Promise<void> => {
  try {
    const { variantId } = req.params;

    const result = await softDeleteVariantService(variantId as string);

    res.status(200).json({
      success: true,
      message: "Variant soft deleted successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to soft delete variant!",
    });
    return;
  }
};


// restoreVariant
export const restoreVariant = async ( req: Request, res: Response ): Promise<void> => {
  try {
    const { variantId } = req.params;

    const result = await restoreVariantService(variantId as string);

    res.status(200).json({
      success: true,
      message: "Variant restored successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to restore variant!",
    });
    return;
  }
};


// getPublicProducts
export const getPublicProducts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getPublicProductsService();

    res.status(200).json({
      success: true,
      message: "Public products retrieved successfully!",
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch public products!",
    });
    return;
  }
};



// getPublicProductById
export const getPublicProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getPublicProductByIdService(id as string);

    res.status(200).json({
      success: true,
      message: 'Public product details retrieved successfully!',
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Product not found!',
    });
    return;
  }
};