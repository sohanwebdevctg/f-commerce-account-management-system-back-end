import fs from "fs";
import path from "path";
import prisma from "../prisma";
import { CategoryStatus, ProductType } from "@prisma/client";

// Product Variant Option Interface
export interface IVariantOptionPayload {
  variantName?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  costPrice: number;
  sellPrice: number;
  stock: number;
  vatPercent?: number;
  discountPercent?: number;
  isActive?: boolean;
}

// Product Variant Color Block Interface
export interface IVariantBlockPayload {
  colorCode?: string;
  images?: string[];
  options: IVariantOptionPayload[];
}

// Create Product Full Payload Interface
export interface ICreateProductPayload {
  name: string;
  thumbnailImage: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  productType: ProductType;
  categoryId: string;
  isActive?: boolean;
  
  // Single Product Specific Fields
  images?: string[];
  colorCode?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  costPrice?: number;
  sellPrice?: number;
  stock?: number;
  vatPercent?: number;
  discountPercent?: number;

  // Variant Product Specific Fields
  variants?: IVariantBlockPayload[];
}

// Interface for Query Parameters
export interface IGetAllProductsQuery {
  isDeleted?: string;
  searchTerm?: string;
}

export interface IUpdateProductPayload {
  name?: string;
  thumbnailImage?: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  categoryId?: string;
  updatedById?: string;

  // Single Product Specific Fields
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  costPrice?: number;
  sellPrice?: number;
  stock?: number;
  vatPercent?: number;
  discountPercent?: number;
  colorCode?: string;
  images?: string[];

  // Variant Product Specific Fields
  variants?: any[];
}

// Helper: Local File Deletion
const removeOldFile = (filePath: string) => {
  if (!filePath) return;
  const fullPath = path.join(process.cwd(), "public", filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// createProductService
export const createProductService = async ( createdById: string, payload: ICreateProductPayload) => {

  // 1. Category Active and Non-Deleted Check
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category || category.isDeleted || category.status !== CategoryStatus.ACTIVE) {
    throw new Error("Invalid or inactive category selected!");
  }

  // 2. Validate At Least One Image Rule
  if (!payload.thumbnailImage) {
    throw new Error("Product thumbnail image is required!");
  }

  // 3. Database Operation via Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    // Create Base Product Record
    const product = await tx.product.create({
      data: {
        name: payload.name,
        thumbnailImage: payload.thumbnailImage,
        shortDescription: payload.shortDescription || null,
        description: payload.description || null,
        brand: payload.brand || null,
        productType: payload.productType || ProductType.SINGLE,
        categoryId: payload.categoryId,
        createdById: createdById,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
      },
    });

    // ===================================================
    // CASE A: SINGLE PRODUCT LOGIC
    // ===================================================
    if (payload.productType === ProductType.SINGLE) {
      // STRICT VALIDATION: Blocking variant data for a single product.
      if (payload.variants && payload.variants.length > 0) {
        throw new Error("SINGLE product type cannot contain variant blocks!");
      }

      if (payload.costPrice === undefined || payload.sellPrice === undefined || payload.stock === undefined) {
        throw new Error("Cost price, sell price, and stock are required for single products!");
      }

      if (Number(payload.sellPrice) < Number(payload.costPrice)) {
        throw new Error("Sell price cannot be less than cost price!");
      }

      const cost = Number(payload.costPrice);
      const sell = Number(payload.sellPrice);
      const profit = sell - cost;

      let colorId: string | null = null;

      // Handle Optional Color for Single Product
      if (payload.colorCode) {
        const createdColor = await tx.productColor.create({
          data: {
            productId: product.id,
            colorCode: payload.colorCode,
          },
        });
        colorId = createdColor.id;
      }

      // Create Single Product Variant Record
      const createdVariant = await tx.productVariant.create({
        data: {
          productId: product.id,
          colorId: colorId,
          size: payload.size || null,
          costPrice: cost,
          minimumPrice: payload.minPrice ? Number(payload.minPrice) : null,
          maximumPrice: payload.maxPrice ? Number(payload.maxPrice) : null,
          sellPrice: sell,
          profit: profit,
          stock: Number(payload.stock),
          vatPercent: payload.vatPercent ? Number(payload.vatPercent) : 0,
          discountPercent: payload.discountPercent ? Number(payload.discountPercent) : 0,
          isActive: payload.isActive !== undefined ? payload.isActive : true,
        },
      });

      // Handle Gallery Images
      if (payload.images && payload.images.length > 0) {
        const imageRecords = payload.images.map((imgUrl) => ({
          productImage: imgUrl,
          colorId: colorId,
          variantId: createdVariant.id,
        }));

        await tx.productImage.createMany({
          data: imageRecords,
        });
      }
    }

    // ===================================================
    // CASE B: VARIANT PRODUCT LOGIC
    // ===================================================
    if (payload.productType === ProductType.VARIANT) {
      if (!payload.variants || payload.variants.length === 0) {
        throw new Error("At least one variant block is required for VARIANT product type!");
      }

      // Track duplicate colors
      const colorSet = new Set<string>();

      for (const variantBlock of payload.variants) {
        // Unique Color Check within same product
        if (variantBlock.colorCode) {
          const lowerColor = variantBlock.colorCode.toLowerCase();
          if (colorSet.has(lowerColor)) {
            throw new Error(`Duplicate color code '${variantBlock.colorCode}' is not allowed!`);
          }
          colorSet.add(lowerColor);
        }

        let colorId: string | null = null;

        // Create Color Block if colorCode exists
        if (variantBlock.colorCode) {
          const createdColor = await tx.productColor.create({
            data: {
              productId: product.id,
              colorCode: variantBlock.colorCode,
            },
          });
          colorId = createdColor.id;
        }

        if (!variantBlock.options || variantBlock.options.length === 0) {
          throw new Error("Each variant block must contain at least one option!");
        }

        // Track duplicate sizes under the same color/block
        const sizeSet = new Set<string>();

        for (const opt of variantBlock.options) {
          if (opt.size) {
            const lowerSize = opt.size.toLowerCase();
            if (sizeSet.has(lowerSize)) {
              throw new Error(`Duplicate size '${opt.size}' found under the same color group!`);
            }
            sizeSet.add(lowerSize);
          }

          if (Number(opt.sellPrice) < Number(opt.costPrice)) {
            throw new Error("Sell price cannot be less than cost price!");
          }

          const cost = Number(opt.costPrice);
          const sell = Number(opt.sellPrice);
          const profit = sell - cost;

          // Auto-generate variant code if not provided
          const autoVariantName =
            opt.variantName ||
            `${product.name.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: product.id,
              colorId: colorId,
              size: opt.size || null,
              varientName: autoVariantName,
              costPrice: cost,
              minimumPrice: opt.minPrice ? Number(opt.minPrice) : null,
              maximumPrice: opt.maxPrice ? Number(opt.maxPrice) : null,
              sellPrice: sell,
              profit: profit,
              stock: Number(opt.stock),
              vatPercent: opt.vatPercent ? Number(opt.vatPercent) : 0,
              discountPercent: opt.discountPercent ? Number(opt.discountPercent) : 0,
              isActive: opt.isActive !== undefined ? opt.isActive : true,
            },
          });

          // Handle images for this specific color block / option
          if (variantBlock.images && variantBlock.images.length > 0) {
            const imageRecords = variantBlock.images.map((imgUrl) => ({
              productImage: imgUrl,
              colorId: colorId,
              variantId: createdVariant.id,
            }));

            await tx.productImage.createMany({
              data: imageRecords,
            });
          }
        }
      }
    }

    // Return complete product details with nested data
    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        colors: {
          include: {
            images: true,
          },
        },
        variants: {
          include: {
            images: true,
          },
        },
      },
    });
  });
};


// getAllProductsService
export const getAllProductsService = async (query: IGetAllProductsQuery) => {
  const { isDeleted, searchTerm } = query;

  // Dynamic filter object for base Product
  const whereCondition: any = {};

  // Tab logic (Active vs Trash)
  if (isDeleted !== undefined) {
    whereCondition.isDeleted = isDeleted === 'true';
  }

  // Search logic (Product Name)
  if (searchTerm) {
    const cleanedSearchTerm = searchTerm.trim();
    whereCondition.OR = [
      { name: { contains: cleanedSearchTerm, mode: 'insensitive' } },
    ];
  }

  const isDeletedBoolean = isDeleted === 'true';

  // Retrieving products with correct schema relations
  const products = await prisma.product.findMany({
    where: whereCondition,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      // Filter variants within ProductColor
      colors: {
        include: {
          images: true,
          variants: {
            where: isDeletedBoolean ? {} : { isDeleted: false },
            include: {
              images: true,
            },
          },
        },
      },
      // Direct ProductVariant filtering (which filters based on size/variant)
      variants: {
        where: isDeletedBoolean ? {} : { isDeleted: false },
        include: {
          images: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return products;
};


// getProductByIdService
export const getProductByIdService = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      colors: {
        include: {
          images: true,
          variants: {
            include: {
              images: true,
            },
          },
        },
      },
      variants: {
        include: {
          images: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error('Product not found!');
  }

  return product;
};


// updateProductService
export const updateProductService = async (
  productId: string,
  updatedById: string,
  payload: IUpdateProductPayload
) => {
  // 1. Check Product Existence
  const currentProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      colors: { include: { images: true } },
      variants: { include: { images: true } },
    },
  });

  if (!currentProduct || currentProduct.isDeleted) {
    throw new Error("Product not found!");
  }

  // 2. Category Check (If categoryId is provided)
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category || category.isDeleted) {
      throw new Error("Invalid or inactive category selected!");
    }
  }

  // 3. Database Operation via Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    // Handling Thumbnail Image Replacement
    let updatedThumbnail = currentProduct.thumbnailImage;
    if (
      payload.thumbnailImage &&
      payload.thumbnailImage !== currentProduct.thumbnailImage
    ) {
      removeOldFile(currentProduct.thumbnailImage);
      updatedThumbnail = payload.thumbnailImage;
    }

    // Update Base Product Record
    await tx.product.update({
      where: { id: productId },
      data: {
        name: payload.name || currentProduct.name,
        thumbnailImage: updatedThumbnail,
        shortDescription:
          payload.shortDescription !== undefined
            ? payload.shortDescription
            : currentProduct.shortDescription,
        description:
          payload.description !== undefined
            ? payload.description
            : currentProduct.description,
        brand:
          payload.brand !== undefined
            ? payload.brand
            : currentProduct.brand,
        categoryId: payload.categoryId || currentProduct.categoryId,
        updatedById: updatedById,
      },
    });

    // ===================================================
    // CASE A: SINGLE PRODUCT UPDATE
    // ===================================================
    if (currentProduct.productType === ProductType.SINGLE) {
      const existingVariant = currentProduct.variants[0];

      const cost =
        payload.costPrice !== undefined
          ? Number(payload.costPrice)
          : Number(existingVariant?.costPrice || 0);
      const sell =
        payload.sellPrice !== undefined
          ? Number(payload.sellPrice)
          : Number(existingVariant?.sellPrice || 0);

      if (sell < cost) {
        throw new Error("Sell price cannot be less than cost price!");
      }

      const profit = sell - cost;
      let colorId = currentProduct.colors[0]?.id || null;

      // Color Update/Create
      if (payload.colorCode) {
        if (colorId) {
          await tx.productColor.update({
            where: { id: colorId },
            data: { colorCode: payload.colorCode },
          });
        } else {
          const newColor = await tx.productColor.create({
            data: { productId, colorCode: payload.colorCode },
          });
          colorId = newColor.id;
        }
      }

      // Single Variant Data Update
      if (existingVariant) {
        await tx.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            colorId,
            size:
              payload.size !== undefined
                ? payload.size
                : existingVariant.size,
            costPrice: cost,
            minimumPrice:
              payload.minPrice !== undefined
                ? Number(payload.minPrice)
                : existingVariant.minimumPrice,
            maximumPrice:
              payload.maxPrice !== undefined
                ? Number(payload.maxPrice)
                : existingVariant.maximumPrice,
            sellPrice: sell,
            profit: profit,
            stock:
              payload.stock !== undefined
                ? Number(payload.stock)
                : existingVariant.stock,
            vatPercent:
              payload.vatPercent !== undefined
                ? Number(payload.vatPercent)
                : existingVariant.vatPercent,
            discountPercent:
              payload.discountPercent !== undefined
                ? Number(payload.discountPercent)
                : existingVariant.discountPercent,
          },
        });
      }

      // Single Product Gallery Images Update (Delete Old & Add New)
      if (payload.images && payload.images.length > 0) {
        // Cleaning up old images from the disk and database using a relation filter
        const oldImages = await tx.productImage.findMany({
          where: {
            variant: {
              productId: productId,
            },
          },
        });

        oldImages.forEach((img) => removeOldFile(img.productImage));

        await tx.productImage.deleteMany({
          where: {
            variant: {
              productId: productId,
            },
          },
        });

        // Insert new image into the database (excluding productId)
        const imageRecords = payload.images.map((imagePath) => ({
          productImage: imagePath,
          colorId,
          variantId: existingVariant?.id || null,
        }));

        await tx.productImage.createMany({ data: imageRecords });
      }
    }

    // ===================================================
    // CASE B: VARIANT PRODUCT UPDATE
    // ===================================================
    if (
      currentProduct.productType === ProductType.VARIANT &&
      payload.variants
    ) {
      // 1. Clean old images from disk (via relation filter)
      const existingImages = await tx.productImage.findMany({
        where: {
          variant: {
            productId: productId,
          },
        },
      });
      existingImages.forEach((img) => removeOldFile(img.productImage));

      // 2. Clear old relational records safely
      await tx.productImage.deleteMany({
        where: {
          variant: {
            productId: productId,
          },
        },
      });
      await tx.productVariant.deleteMany({ where: { productId } });
      await tx.productColor.deleteMany({ where: { productId } });

      const colorSet = new Set<string>();

      for (const variantBlock of payload.variants) {

        if (variantBlock.colorCode) {
          const lowerColor = variantBlock.colorCode.toLowerCase();
          if (colorSet.has(lowerColor)) {
            throw new Error(
              `Duplicate color code '${variantBlock.colorCode}' is not allowed!`
            );
          }
          colorSet.add(lowerColor);
        }

        let colorId: string | null = null;
        if (variantBlock.colorCode) {
          const createdColor = await tx.productColor.create({
            data: { productId, colorCode: variantBlock.colorCode },
          });
          colorId = createdColor.id;
        }

        const sizeSet = new Set<string>();

        for (const opt of variantBlock.options) {
          if (opt.size) {
            const lowerSize = opt.size.toLowerCase();
            if (sizeSet.has(lowerSize)) {
              throw new Error(
                `Duplicate size '${opt.size}' found under same color!`
              );
            }
            sizeSet.add(lowerSize);
          }

          const cost = Number(opt.costPrice);
          const sell = Number(opt.sellPrice);
          if (sell < cost)
            throw new Error("Sell price cannot be less than cost price!");

          const productNameToUse = payload.name || currentProduct.name;
          const autoVariantName =
            opt.variantName ||
            `${productNameToUse
              .slice(0, 3)
              .toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

          const createdVariant = await tx.productVariant.create({
            data: {
              productId,
              colorId,
              size: opt.size || null,
              varientName: autoVariantName,
              costPrice: cost,
              minimumPrice: opt.minPrice ? Number(opt.minPrice) : null,
              maximumPrice: opt.maxPrice ? Number(opt.maxPrice) : null,
              sellPrice: sell,
              profit: sell - cost,
              stock: Number(opt.stock),
              vatPercent: opt.vatPercent ? Number(opt.vatPercent) : 0,
              discountPercent: opt.discountPercent
                ? Number(opt.discountPercent)
                : 0,
            },
          });

          // Option-specific images handle
          if (opt.images && opt.images.length > 0) {
            const imageRecords = opt.images.map((imagePath: string) => ({
              productImage: imagePath,
              colorId,
              variantId: createdVariant.id,
            }));
            await tx.productImage.createMany({ data: imageRecords });
          }
        }

        // Color-level images handle
        if (
          variantBlock.images &&
          variantBlock.images.length > 0 &&
          !variantBlock.options[0]?.images
        ) {
          const imageRecords = variantBlock.images.map((imagePath: string) => ({
            productImage: imagePath,
            colorId,
            variantId: null,
          }));
          await tx.productImage.createMany({ data: imageRecords });
        }
      }
    }

    // Return updated product details using transaction client
    return await tx.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        colors: { include: { images: true } },
        variants: { include: { images: true } },
      },
    });
  });
};


// updateProductStatusService
export const updateProductStatusService = async (id: string, isActive: boolean) => {
  // 1. Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product || product.isDeleted) {
    throw new Error("Product not found!");
  }

  // 2. Cascade status update using Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    // Update main product status
    const updatedProduct = await tx.product.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Update status of all variants belonging to this product
    await tx.productVariant.updateMany({
      where: { productId: id },
      data: { isActive },
    });

    return updatedProduct;
  });
};

// softDeleteProductService
export const softDeleteProductService = async (id: string) => {
  // Checking product availability
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error("Product not found!");
  }

  if (product.isDeleted) {
    throw new Error("Product is already deleted!");
  }

  const now = new Date();

  // Soft-deleting a product and its child data using a transaction.
  const result = await prisma.$transaction(async (tx) => {

    // Product Update (isDeleted: true)
    const updatedProduct = await tx.product.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
      select: {
        id: true,
        name: true,
        isDeleted: true,
        deletedAt: true,
        updatedAt: true,
      },
    });

    // Soft delete all variants under the product
    await tx.productVariant.updateMany({
      where: { productId: id },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });

    return updatedProduct;
  });

  return result;
};

// restoreProductService
export const restoreProductService = async (id: string) => {
  // Checking product availability
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error("Product not found!");
  }

  if (!product.isDeleted) {
    throw new Error("Product is not deleted!");
  }

  // Restoring a product and its child variants via a transaction.
  const result = await prisma.$transaction(async (tx) => {
    // Restore product (isDeleted: false, deletedAt: null)
    const restoredProduct = await tx.product.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        isDeleted: true,
        deletedAt: true,
        updatedAt: true,
      },
    });

    // Restoring all variants under the product
    await tx.productVariant.updateMany({
      where: { productId: id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return restoredProduct;
  });

  return result;
};


// updateColorStatusService
export const updateColorStatusService = async (productId: string, colorId: string,isActive: boolean ) => {
  // Checking if there is at least one variant under the specific product and color
  const existingVariant = await prisma.productVariant.findFirst({
    where: {
      productId,
      colorId,
      isDeleted: false,
    },
  });

  if (!existingVariant) {
    throw new Error("No active variants found for this color!");
  }

  // Bulk update the isActive status of all sizes/variants matching the given productId and colorId
  const updatedVariants = await prisma.productVariant.updateMany({
    where: {
      productId,
      colorId,
      isDeleted: false,
    },
    data: {
      isActive,
    },
  });

  return updatedVariants;
};


// softDeleteColorService
export const softDeleteColorService = async ( productId: string, colorId: string ) => {
  // Checking product availability
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found!");
  }

  // Checking color availability
  const color = await prisma.productColor.findFirst({
    where: { id: colorId, productId },
  });

  if (!color) {
    throw new Error("Color not found for this product!");
  }

  const now = new Date();

  // Soft-deleting color variants under the specific product and color using transaction
  const result = await prisma.$transaction(async (tx) => {
    // Soft delete all variants for this specific color
    const variantsUpdate = await tx.productVariant.updateMany({
      where: {
        productId,
        colorId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });

    return {
      productId,
      colorId,
      count: variantsUpdate.count,
    };
  });

  return result;
};


// restoreColorService
export const restoreColorService = async (productId: string,colorId: string
) => {
  // Checking product availability
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found!");
  }

  // Checking color availability
  const color = await prisma.productColor.findFirst({
    where: { id: colorId, productId },
  });

  if (!color) {
    throw new Error("Color not found for this product!");
  }

  // Restoring all soft-deleted variants under the specific product and color via transaction
  const result = await prisma.$transaction(async (tx) => {
    // Restore variants (isDeleted: false, deletedAt: null)
    const variantsUpdate = await tx.productVariant.updateMany({
      where: {
        productId,
        colorId,
        isDeleted: true, // Only the items that were soft-deleted will be restored
      },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return {
      productId,
      colorId,
      count: variantsUpdate.count,
    };
  });

  return result;
};


// updateVariantStatusService
export const updateVariantStatusService = async (variantId: string, isActive: boolean ) => {
  // Check if variant exists and is not deleted
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant || variant.isDeleted) {
    throw new Error("Variant not found!");
  }

  // Update specific variant status
  const updatedVariant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { isActive },
    select: {
      id: true,
      varientName: true,
      size: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return updatedVariant;
};


// softDeleteVariantService
export const softDeleteVariantService = async (variantId: string) => {
  // Checking variant availability
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new Error("Variant not found!");
  }

  if (variant.isDeleted) {
    throw new Error("Variant is already deleted!");
  }

  const now = new Date();

  // Soft-deleting specific variant
  const updatedVariant = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      isDeleted: true,
      deletedAt: now,
    },
    select: {
      id: true,
      varientName: true,
      size: true,
      isDeleted: true,
      deletedAt: true,
      updatedAt: true,
    },
  });

  return updatedVariant;
};


// restoreVariantService
export const restoreVariantService = async (variantId: string) => {
  // Checking variant availability
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new Error("Variant not found!");
  }

  if (!variant.isDeleted) {
    throw new Error("Variant is not deleted!");
  }

  // Restoring variant (isDeleted: false, deletedAt: null)
  const restoredVariant = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
    select: {
      id: true,
      varientName: true,
      size: true,
      isDeleted: true,
      deletedAt: true,
      updatedAt: true,
    },
  });

  return restoredVariant;
};


// getPublicProductsService
export const getPublicProductsService = async () => {
  const products = await prisma.product.findMany({
    where: {
      // 1. Base Product Active Check
      isActive: true,
      isDeleted: false,

      // 2. Category Soft-Delete Check
      category: {
        isDeleted: false,
      },

      // 3. Ensure product has AT LEAST ONE active & non-deleted variant
      variants: {
        some: {
          isActive: true,
          isDeleted: false,
        },
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      // Cleaned Colors & their active variants
      colors: {
        include: {
          images: true,
          variants: {
            where: {
              isActive: true,
              isDeleted: false,
            },
            include: {
              images: true,
            },
          },
        },
      },
      // Cleaned Direct Variants
      variants: {
        where: {
          isActive: true,
          isDeleted: false,
        },
        include: {
          images: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products;
};


// getPublicProductByIdService
export const getPublicProductByIdService = async (id: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id,
      isActive: true,
      isDeleted: false,
      category: {
        isDeleted: false,
      },
      variants: {
        some: {
          isActive: true,
          isDeleted: false,
        },
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      colors: {
        include: {
          images: true,
          variants: {
            where: {
              isActive: true,
              isDeleted: false,
            },
            include: {
              images: true,
            },
          },
        },
      },
      variants: {
        where: {
          isActive: true,
          isDeleted: false,
        },
        include: {
          images: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error('Product not found or unavailable!');
  }

  return product;
};
