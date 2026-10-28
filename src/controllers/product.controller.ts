// Import Request and Response types from Express for handling HTTP communication
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
// Import all product-related service functions from the service layer
import { createProductService, deleteProductService, deleteProductVariantItemService, deleteProductVariantService, getAllProductService, getAllPublicProductsService, getSingleProductService, getSinglePublicProductService, restoreProductService, restoreProductVariantItemService, restoreProductVariantService, updateProductService, updateProductStatusService, updateProductVariantItemStatusService, updateProductVariantStatusService } from "../services/product.service";

// Helper Function: ফাইল আপলোডে বা ডাটাবেজে এরর হলে আপলোড হওয়া ইমেজ ডিলিট করার জন্য
const deleteUploadedFiles = (files: any) => {
  if (!files) return;

  let fileList: any[] = [];

  if (Array.isArray(files)) {
    // rawFiles (Array) আসলে সরাসরি পুশ হবে
    fileList = files;
  } else if (typeof files === 'object') {
    // groupedFiles (Object) আসলে তার সবকিছুর ভ্যালু ফ্ল্যাট হয়ে অ্যারে হবে
    Object.values(files).forEach((item: any) => {
      if (Array.isArray(item)) {
        fileList.push(...item);
      }
    });
  }

  fileList.forEach((file) => {
    if (file && file.filename) {
      const filePath = path.join(__dirname, '../../public/uploads', file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
};

// getAllPublicProduct
export const getAllPublicProduct = async (req: Request, res: Response): Promise<void> => {
  try{
    const category = req.query.category as string | undefined;
    const searchTerm = req.query.searchTerm as string | undefined;

    const result = await getAllPublicProductsService({ category, searchTerm });

    res.status(200).json({
      success: true,
      message: 'Public products retrieved successfully',
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

// getSinglePublicProduct
export const getSinglePublicProduct = async (req: Request, res: Response): Promise<void> => {
  try{

    const { id } = req.params;

    const result = await getSinglePublicProductService({id: id as string});

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        statusCode: 404,
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Product details retrieved successfully',
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

// createProduct
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const rawFiles = (req as any).files as Express.Multer.File[] | undefined;

  console.log("=== BACKEND RECEIVED RAW FILES ===", rawFiles);
  console.log("=== BACKEND RECEIVED PAYLOAD ===", req.body);

  try {
    const createdById = (req as any).user?.id;
    let payload = { ...req.body };

    // 🛠️ upload.any() থেকে আসা ফাইলগুলোকে ফিল্ডওয়াইজ অবজেক্টে গ্রুপ করা
    const groupedFiles: { [key: string]: Express.Multer.File[] } = {};
    if (Array.isArray(rawFiles)) {
      rawFiles.forEach((file) => {
        if (!groupedFiles[file.fieldname]) {
          groupedFiles[file.fieldname] = [];
        }
        groupedFiles[file.fieldname].push(file);
      });
    }

    // ১. Thumbnail Check (সব ধরণের প্রোডাক্টের জন্য বাধ্যতামূলক)
    if (!groupedFiles?.thumbnailImage?.[0]) {
      deleteUploadedFiles(rawFiles);
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product thumbnail image is required!',
        data: null,
      });
      return;
    }

    // ২. Mandatory Field Check
    if (!payload.name || !payload.categoryId || !payload.productType) {
      deleteUploadedFiles(rawFiles);
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product name, categoryId, and productType are required!',
        data: null,
      });
      return;
    }

    payload.thumbnailImage = `/uploads/${groupedFiles.thumbnailImage[0].filename}`;

    // ৩. Variants Parsing
    if (payload.variants) {
      try {
        if (typeof payload.variants === 'string') {
          payload.variants = JSON.parse(payload.variants);
        } else if (Array.isArray(payload.variants) && typeof payload.variants[0] === 'string') {
          payload.variants = JSON.parse(payload.variants[0]);
        }
      } catch (err) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Please provide valid variant details!',
          data: null,
        });
        return;
      }
    }

    // ৪. SINGLE Product Validation & Check
    if (payload.productType === 'SINGLE') {
      if (!groupedFiles?.productImage || groupedFiles.productImage.length === 0) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'At least one product gallery image is required!',
          data: null,
        });
        return;
      }

      if (
        payload.costPrice === undefined ||
        payload.sellPrice === undefined ||
        payload.stock === undefined
      ) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Cost price, sell price, and stock are required for single product!',
          data: null,
        });
        return;
      }

      const costPrice = Number(payload.costPrice);
      const sellPrice = Number(payload.sellPrice);
      const stock = Number(payload.stock);

      if (costPrice < 0 || sellPrice < 0 || stock < 0) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Cost price, sell price, and stock cannot be negative numbers!',
          data: null,
        });
        return;
      }

      if (sellPrice < costPrice) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Sell price cannot be less than cost price!',
          data: null,
        });
        return;
      }

      payload.costPrice = costPrice;
      payload.sellPrice = sellPrice;
      payload.stock = stock;
      payload.images = groupedFiles.productImage.map((f: any) => `/uploads/${f.filename}`);
    }

    // ৫. VARIANT Product Validation
    if (payload.productType === 'VARIANT') {
      if (!payload.variants || !Array.isArray(payload.variants) || payload.variants.length === 0) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'At least one variant block is required for variant product!',
          data: null,
        });
        return;
      }

      for (let i = 0; i < payload.variants.length; i++) {
        const variantBlock = payload.variants[i];
        const optionsList = variantBlock.options || variantBlock.items;

        if (!optionsList || !Array.isArray(optionsList) || optionsList.length === 0) {
          deleteUploadedFiles(rawFiles);
          res.status(400).json({
            success: false,
            statusCode: 400,
            message: `Variant #${i + 1} must contain options!`,
            data: null,
          });
          return;
        }

        for (const opt of optionsList) {
          if (opt.costPrice === undefined || opt.sellPrice === undefined || opt.stock === undefined) {
            deleteUploadedFiles(rawFiles);
            res.status(400).json({
              success: false,
              statusCode: 400,
              message: 'Cost price, sell price, and stock are required for each variant option!',
              data: null,
            });
            return;
          }

          const costPrice = Number(opt.costPrice);
          const sellPrice = Number(opt.sellPrice);
          const stock = Number(opt.stock);

          if (costPrice < 0 || sellPrice < 0 || stock < 0) {
            deleteUploadedFiles(rawFiles);
            res.status(400).json({
              success: false,
              statusCode: 400,
              message: 'Cost price, sell price, and stock cannot be negative numbers in variants!',
              data: null,
            });
            return;
          }

          if (sellPrice < costPrice) {
            deleteUploadedFiles(rawFiles);
            res.status(400).json({
              success: false,
              statusCode: 400,
              message: 'Sell price cannot be less than cost price in variants!',
              data: null,
            });
            return;
          }

          opt.costPrice = costPrice;
          opt.sellPrice = sellPrice;
          opt.stock = stock;
        }
      }
    }

    // সার্ভিস কল (rawFiles পাস করা হলো যা দিয়ে সার্ভিস লেয়ার বাকি ইমেজ ভ্যালিডেশন করবে)
    const result = await createProductService(createdById, payload, rawFiles);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product created successfully!',
      data: result,
    });
    return;

  } catch (error: any) {
    // যেকোনো ব্যাকএন্ড বা ডাটাবেজ এরর হলে আপলোড হওয়া ইমেজগুলো সার্ভার থেকে মুছে যাবে
    deleteUploadedFiles(rawFiles);

    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
      statusCode: 500,
      data: null
    });
    return;
  }
};

// get all product
export const getAllProduct = async (req: Request, res: Response): Promise<void> => {
  try{
    // Retrieving parameters from the URL query
    const isDeleted = req.query.isDeleted === 'true';
    const searchTerm = req.query.searchTerm as string | undefined;

    // Sending data to the service layer for processing
    const result = await getAllProductService({ isDeleted, searchTerm });

    // Sending a successful response to the client
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
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

// getSingleProduct
export const getSingleProduct = async (req: Request, res: Response): Promise<void> => {
  try{
    const { id } = req.params;

    const result = await getSingleProductService({ id: id as string });

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
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


// updateProduct
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const rawFiles = (req as any).files as Express.Multer.File[] | undefined;

  console.log("=== BACKEND UPDATE RECEIVED RAW FILES ===", rawFiles);
  console.log("=== BACKEND UPDATE RECEIVED PAYLOAD ===", req.body);

  try {
    const { id: productId } = req.params;
    let payload = { ...req.body };

    // ১. Product ID Check
    if (!productId) {
      deleteUploadedFiles(rawFiles);
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product ID is required in request parameters!',
        data: null,
      });
      return;
    }

    // 🛠️ upload.any() থেকে আসা ফাইলগুলোকে ফিল্ডওয়াইজ অবজেক্টে গ্রুপ করা
    const groupedFiles: { [key: string]: Express.Multer.File[] } = {};
    if (Array.isArray(rawFiles)) {
      rawFiles.forEach((file) => {
        if (!groupedFiles[file.fieldname]) {
          groupedFiles[file.fieldname] = [];
        }
        groupedFiles[file.fieldname].push(file);
      });
    }

    // ২. Thumbnail Check (নতুন ফাইল না থাকলে পুরানো thumbnailImage স্ট্রিং হিসেবে থাকবে)
const hasNewThumbnail = groupedFiles?.thumbnailImage?.[0];
const existingThumbnail = payload.existingThumbnailImage || (typeof payload.thumbnailImage === 'string' ? payload.thumbnailImage : null);

if (!hasNewThumbnail && !existingThumbnail) {
  deleteUploadedFiles(rawFiles);
  res.status(400).json({
    success: false,
    statusCode: 400,
    message: 'Product thumbnail image is required!',
    data: null,
  });
  return;
}

// Thumbnail path সেট করা
if (hasNewThumbnail) {
  payload.thumbnailImage = `/uploads/${groupedFiles.thumbnailImage[0].filename}`;
} else {
  payload.thumbnailImage = existingThumbnail;
}

    // ৩. Mandatory Basic Fields Check
    if (!payload.name || !payload.categoryId || !payload.productType) {
      deleteUploadedFiles(rawFiles);
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product name, categoryId, and productType are required!',
        data: null,
      });
      return;
    }

    // Thumbnail path সেট করা
    if (hasNewThumbnail) {
      payload.thumbnailImage = `/uploads/${groupedFiles.thumbnailImage[0].filename}`;
    } else {
      payload.thumbnailImage = payload.existingThumbnailImage;
    }

    // ৪. Variants & Existing Images Parsing
    if (payload.variants) {
      try {
        if (typeof payload.variants === 'string') {
          payload.variants = JSON.parse(payload.variants);
        } else if (Array.isArray(payload.variants) && typeof payload.variants[0] === 'string') {
          payload.variants = JSON.parse(payload.variants[0]);
        }
      } catch (err) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Please provide valid variant details!',
          data: null,
        });
        return;
      }
    }

    if (payload.existingImages) {
      try {
        if (typeof payload.existingImages === 'string') {
          payload.existingImages = JSON.parse(payload.existingImages);
        }
      } catch (err) {
        payload.existingImages = [];
      }
    } else {
      payload.existingImages = [];
    }

    // ৫. SINGLE Product Validation & Formatting
    if (payload.productType === 'SINGLE') {
      const newSingleImages = groupedFiles?.productImage || [];
      const totalImagesCount = (payload.existingImages?.length || 0) + newSingleImages.length;

      if (totalImagesCount === 0) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'At least one product gallery image is required!',
          data: null,
        });
        return;
      }

      if (
        payload.costPrice === undefined ||
        payload.sellPrice === undefined ||
        payload.stock === undefined
      ) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Cost price, sell price, and stock are required for single product!',
          data: null,
        });
        return;
      }

      const costPrice = Number(payload.costPrice);
      const sellPrice = Number(payload.sellPrice);
      const stock = Number(payload.stock);

      if (costPrice < 0 || sellPrice < 0 || stock < 0) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Cost price, sell price, and stock cannot be negative numbers!',
          data: null,
        });
        return;
      }

      if (sellPrice < costPrice) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Sell price cannot be less than cost price!',
          data: null,
        });
        return;
      }

      payload.costPrice = costPrice;
      payload.sellPrice = sellPrice;
      payload.stock = stock;
      payload.newImages = newSingleImages.map((f: any) => `/uploads/${f.filename}`);
    }

    // ৬. VARIANT Product Validation
    if (payload.productType === 'VARIANT') {
      if (!payload.variants || !Array.isArray(payload.variants) || payload.variants.length === 0) {
        deleteUploadedFiles(rawFiles);
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'At least one variant block is required for variant product!',
          data: null,
        });
        return;
      }

      for (let i = 0; i < payload.variants.length; i++) {
        const variantBlock = payload.variants[i];
        const optionsList = variantBlock.options || variantBlock.items;

        // Dynamic key অনুযায়ী ফাইল চেক (variant_images_0, variant_images_1...)
        const newUploadedVariantFiles = groupedFiles[`variant_images_${i}`] || [];
        const existingImagesCount = variantBlock.existingImages?.length || 0;
        const totalVariantImages = existingImagesCount + newUploadedVariantFiles.length;

        if (totalVariantImages === 0) {
          deleteUploadedFiles(rawFiles);
          res.status(400).json({
            success: false,
            statusCode: 400,
            message: `At least one image is required for Variant #${payload.variants.length - i}!`,
            data: null,
          });
          return;
        }

        if (!optionsList || !Array.isArray(optionsList) || optionsList.length === 0) {
          deleteUploadedFiles(rawFiles);
          res.status(400).json({
            success: false,
            statusCode: 400,
            message: `Variant #${payload.variants.length - i} must contain options!`,
            data: null,
          });
          return;
        }

        for (const opt of optionsList) {
          if (opt.costPrice === undefined || opt.sellPrice === undefined || opt.stock === undefined) {
            deleteUploadedFiles(rawFiles);
            res.status(400).json({
              success: false,
              statusCode: 400,
              message: 'Cost price, sell price, and stock are required for each variant option!',
              data: null,
            });
            return;
          }

          const costPrice = Number(opt.costPrice);
          const sellPrice = Number(opt.sellPrice);
          const stock = Number(opt.stock);

          if (costPrice < 0 || sellPrice < 0 || stock < 0) {
            deleteUploadedFiles(rawFiles);
            res.status(400).json({
              success: false,
              statusCode: 400,
              message: 'Cost price, sell price, and stock cannot be negative numbers in variants!',
              data: null,
            });
            return;
          }

          if (sellPrice < costPrice) {
            deleteUploadedFiles(rawFiles);
            res.status(400).json({
              success: false,
              statusCode: 400,
              message: 'Sell price cannot be less than cost price in variants!',
              data: null,
            });
            return;
          }

          opt.costPrice = costPrice;
          opt.sellPrice = sellPrice;
          opt.stock = stock;
        }
      }
    }

    // ৭. সার্ভিস কল (productId, payload, এবং groupedFiles পাস করা হচ্ছে)
    const result = await updateProductService(productId as string, payload, groupedFiles);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product updated successfully!',
      data: result,
    });
    return;

  } catch (error: any) {
    // যেকোনো এরর হলে আপলোড হওয়া ইমেজগুলো সার্ভার থেকে মুছে ফেলা হবে
    deleteUploadedFiles(rawFiles);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Something went wrong',
      statusCode: error.statusCode || 500,
      data: null,
    });
    return;
  }
};

// product related

// updateProductStatus
export const updateProductStatus = async (req: Request, res: Response): Promise<void> => {
  try{

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: "Status is required",
        statusCode: 400,
        data: null,
      });
      return;
    }

    const result = await updateProductStatusService(id as string, status);

    res.status(200).json({
      success: true,
      message: "Product status updated successfully",
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

// deleteProduct
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {

  try{
    const { id } = req.params;

    const result = await deleteProductService(id as string);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
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

// restoreProduct
export const restoreProduct = async (req: Request, res: Response): Promise<void> => {
  try{
    const { id } = req.params;

    const result = await restoreProductService(id as string);

    res.status(200).json({
      success: true,
      message: "Product restored successfully!",
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


// product variant related

// updateProductVariantStatus
export const updateProductVariantStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: "Status is required",
        statusCode: 400,
        data: null,
      });
      return;
    }

    const result = await updateProductVariantStatusService(variantId as string, status);

    res.status(200).json({
      success: true,
      message: "Variant status updated successfully",
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

// deleteProductVariant
export const deleteProductVariant = async (req: Request, res: Response): Promise<void> => {
  try{
    const { productId, variantId } = req.params;

    const result = await deleteProductVariantService(productId as string, variantId as string);

    res.status(200).json({
      success: true,
      message: "Product variant deleted successfully",
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

// restoreProductVariant
export const restoreProductVariant = async (req: Request, res: Response): Promise<void> => {
  try{

    const { productId, variantId } = req.params;

    const restoredVariant = await restoreProductVariantService(productId as string, variantId as string);

    res.status(200).json({
      success: true,
      message: "Product variant restored successfully!",
      statusCode: 200,
      data: restoredVariant,
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



// product variant item related

// updateProductVariantItemStatus
export const updateProductVariantItemStatus = async (req: Request, res: Response): Promise<void> => {
  try{
    const { itemId } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: "Status is required",
        statusCode: 400,
        data: null,
      });
      return;
    }

    const result = await updateProductVariantItemStatusService(itemId as string, status);

    res.status(200).json({
      success: true,
      message: "Variant item status updated successfully",
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

// deleteProductVariantItem
export const deleteProductVariantItem = async (req: Request, res: Response): Promise<void> => {
  try{

    const { productId, variantId, itemId } = req.params;

    const result = await deleteProductVariantItemService( productId as string, variantId as string, itemId as string);

    res.status(200).json({
      success: true,
      message: "Variant item deleted successfully",
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

// restoreProductVariantItem
export const restoreProductVariantItem = async (req: Request,res: Response): Promise<void> => {
  try {
    const { productId, variantId, itemId } = req.params;

    const restoredItem = await restoreProductVariantItemService( productId as string, variantId as string, itemId as string);

    res.status(200).json({
      success: true,
      message: "Variant item restored successfully!",
      statusCode: 200,
      data: restoredItem,
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