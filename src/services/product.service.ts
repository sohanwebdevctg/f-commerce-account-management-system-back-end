import prisma from "../prisma";
import { ProductType, CategoryStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

// create product payload
export interface IVariantOptionPayload {
  size?: string;
  varientName?: string;
  costPrice: number;
  minPrice?: number;
  maxPrice?: number;
  sellPrice: number;
  stock: number;
  vatPercent?: number;
  discountPercent?: number;
  isActive?: boolean;
}

export interface IVariantBlockPayload {
  colorCode?: string;
  images?: string[];
  options: IVariantOptionPayload[];
}

export interface ICreateProductPayload {
  name: string;
  thumbnailImage: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  productType: ProductType;
  categoryId: string;
  isActive?: boolean | string; // Boolean বা String দুটোই সাপোর্ট করবে

  // Single Product Fields
  images?: string[];
  colorCode?: string;
  size?: string;
  costPrice?: number;
  sellPrice?: number;
  stock?: number;

  // Variant Product Fields
  variants?: IVariantBlockPayload[];
}

// get all product payload
export interface IGetAllProductsPayload {
  isDeleted: boolean;
  searchTerm?: string;
}

// getSingleProduct payload
export interface IGetSingleProductPayload {
  id: string;
}

// Update Types Definition
export interface IUpdateVariantOptionPayload {
  id?: string | number;
  size?: string;
  varientName?: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  isActive?: boolean | string;
}

export interface IUpdateVariantBlockPayload {
  id?: string | number;
  colorCode?: string;
  isActive?: boolean | string;
  existingImages?: string[];
  options: IUpdateVariantOptionPayload[];
}

export interface IUpdateProductPayload {
  name: string;
  thumbnailImage: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  productType: ProductType;
  categoryId: string;
  isActive?: boolean | string;

  // Single Product Fields
  existingImages?: string[];
  newImages?: string[];
  colorCode?: string;
  size?: string;
  costPrice?: number;
  sellPrice?: number;
  stock?: number;

  // Variant Product Fields
  variants?: IUpdateVariantBlockPayload[];
}

// get all public product payload
export interface IGetPublicProductsPayload {
  category?: string;
  searchTerm?: string;
}

// get single public product payload
export interface IGetSinglePublicProductPayload {
  id: string;
}

// সার্ভারের uploads ফোল্ডার থেকে ফাইল ডিলিট করার হেলপার
const removeLocalFile = (fileRelativePath?: string | null) => {
  if (!fileRelativePath) return;
  try {
    const cleanPath = fileRelativePath.startsWith("/") ? fileRelativePath.slice(1) : fileRelativePath;
    const filePath = path.join(__dirname, "../../public", cleanPath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

// get all public product service
export const getAllPublicProductsService = async (payload: IGetPublicProductsPayload) => {
  const { category, searchTerm } = payload;

  // Search Filter
  const searchFilter =
    searchTerm && searchTerm.trim() !== ''
      ? {
          name: {
            contains: searchTerm.trim().toLowerCase(),
            mode: 'insensitive' as const,
          },
        }
      : {};

  // Category Filter
  const categoryFilter =
    category && category.trim() !== '' && (!searchTerm || searchTerm.trim() === '')
      ? { categoryId: category }
      : {};

  const result = await prisma.product.findMany({
    where: {
      ...searchFilter,
      ...categoryFilter,
      isActive: true,
      isDeleted: false,
      // Category মডেলের স্কিমা অনুযায়ী ফিল্টার
      category: {
        status: 'ACTIVE',
        isDeleted: false,
      },
      // ১. প্রোডাক্টের আন্ডারে অন্তত ১টি ACTIVE ও non-deleted Variant থাকতে হবে
      variants: {
        some: {
          isActive: true,
          isDeleted: false,
          // ২. সেই Variant এর আন্ডারেও অন্তত ১টি ACTIVE ও non-deleted VariantItem থাকতে হবে
          variantItems: {
            some: {
              isActive: true,
              isDeleted: false,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      thumbnailImage: true,
      name: true,
      productType: true,
      shortDescription: true, // shortDescription যুক্ত করা হলো
      description: true,      // description যুক্ত করা হলো
      brand: true,            // brand যুক্ত করা হলো (যদি রিলেশন হয়ে থাকে তবে brand: { select: { name: true } } দিবেন)
      isActive: true,
      isDeleted: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        where: {
          isActive: true,
          isDeleted: false,
          variantItems: {
            some: {
              isActive: true,
              isDeleted: false,
            },
          },
        },
        select: {
          id: true,
          colorCode: true,
          isActive: true,
          isDeleted: true,
          images: {
            select: {
              id: true,
              productImage: true,
            },
          },
          variantItems: {
            where: {
              isActive: true,
              isDeleted: false,
            },
            select: {
              id: true,
              varientName: true,
              size: true,
              costPrice: true,
              sellPrice: true,
              stock: true,
              profit: true,
              isActive: true,
              isDeleted: true,
            },
          },
        },
      },
    },
  });

  return result;
};

// get single public product service
export const getSinglePublicProductService = async (payload: IGetSinglePublicProductPayload) => {
  
  const { id } = payload;

  const result = await prisma.product.findFirst({
    where: {
      id: id,
      isActive: true,
      isDeleted: false,
      category: {
        status: 'ACTIVE',
        isDeleted: false,
      },
    },
    select: {
      id: true,
      thumbnailImage: true,
      name: true,
      productType: true,
      shortDescription: true,
      description: true,
      brand: true,
      isActive: true,
      isDeleted: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        where: {
          isActive: true,
          isDeleted: false,
          variantItems: {
            some: {
              isActive: true,
              isDeleted: false,
            },
          },
        },
        select: {
          id: true,
          colorCode: true,
          isActive: true,
          isDeleted: true,
          images: {
            select: {
              id: true,
              productImage: true,
            },
          },
          variantItems: {
            where: {
              isActive: true,
              isDeleted: false,
            },
            select: {
              id: true,
              varientName: true,
              size: true,
              costPrice: true,
              sellPrice: true,
              stock: true,
              profit: true,
              isActive: true,
              isDeleted: true,
            },
          },
        },
      },
    },
  });

  return result;
};


// create product service
export const createProductService = async (createdById: string, payload: ICreateProductPayload, files: any) => {
  // ----------------------------------------------------
  // 🛑 Step 1: Payload Parse (variants যদি JSON string হিসেবে আসে)
  // ----------------------------------------------------
  let parsedVariants: IVariantBlockPayload[] = [];
  if (payload.variants) {
    if (typeof payload.variants === 'string') {
      try {
        parsedVariants = JSON.parse(payload.variants);
      } catch (e) {
        parsedVariants = [];
      }
    } else {
      parsedVariants = payload.variants;
    }
  }

  // ----------------------------------------------------
  // 🛑 Step 2: Image Validations & Processing
  // ----------------------------------------------------

  // ১.১ Thumbnail Image Check (সব প্রোডাক্টের জন্যই বাধ্যতামূলক)
  const thumbnailFile = (files as any[])?.find(
    (f) => f.fieldname === 'thumbnailImage'
  );

  if (!thumbnailFile) {
    throw new Error('Product thumbnail image is required!');
  }

  const thumbnailImagePath = `/uploads/${thumbnailFile.filename}`;

  // ১.২ Single Product Image Check (কমপক্ষে একটি প্রোডাক্ট ইমেজ বাধ্যতামূলক)
  if (payload.productType === ProductType.SINGLE) {
    const hasProductImage = (files as any[])?.some(
      (f) => f.fieldname === 'productImage'
    );

    if (!hasProductImage) {
      throw new Error('Single product must have at least one product image!');
    }
  }

  // ১.৩ Variant Product Image Check (প্রতিটি ভ্যারিয়েন্টের জন্য কমপক্ষে একটি ইমেজ বাধ্যতামূলক)
  if (payload.productType === ProductType.VARIANT) {
    if (!parsedVariants || parsedVariants.length === 0) {
      throw new Error('At least one variant is required!');
    }

    for (let i = 0; i < parsedVariants.length; i++) {
      const hasVariantImage = (files as any[])?.some(
        (f) => f.fieldname === `variant_images_${i}`
      );

      if (!hasVariantImage) {
        throw new Error(`Variant #${i + 1} must have at least one image!`);
      }
    }
  }

  // ----------------------------------------------------
  // Step 3: Database Operations
  // ----------------------------------------------------

  // ৩.১ ক্যাটাগরি ভ্যালিডেশন
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category || category.isDeleted || category.status !== CategoryStatus.ACTIVE) {
    throw new Error("Invalid or inactive category selected!");
  }

  // ৩.২ ট্রানজেকশনে ডাটাবেজ অপারেশন
  return await prisma.$transaction(async (tx) => {
    // মূল প্রোডাক্ট রেকর্ড তৈরি
    const product = await tx.product.create({
      data: {
        name: payload.name,
        thumbnailImage: thumbnailImagePath,
        shortDescription: payload.shortDescription || null,
        description: payload.description || null,
        brand: payload.brand || null,
        productType: payload.productType || ProductType.SINGLE,
        categoryId: payload.categoryId,
        createdById: createdById,
        isActive: String(payload.isActive) === "true",
      },
    });

    // ===================================================
    // CASE A: SINGLE PRODUCT LOGIC
    // ===================================================
    if (payload.productType === ProductType.SINGLE) {
      const cost = Number(payload.costPrice);
      const sell = Number(payload.sellPrice);
      const profit = sell - cost;

      const autoVariantName = `${product.name.slice(0, 3).toUpperCase()}-${payload.size || 'REG'}-${Math.floor(100 + Math.random() * 900)}`;

      // ১. ProductVariant ক্রিয়েট (শুধু productId ও colorCode)
      const createdVariant = await tx.productVariant.create({
        data: {
          productId: product.id,
          colorCode: payload.colorCode || null,
        },
      });

      // ২. VariantItem ক্রিয়েট
      await tx.variantItem.create({
        data: {
          variantId: createdVariant.id,
          varientName: autoVariantName,
          size: payload.size || null,
          costPrice: cost,
          sellPrice: sell,
          profit: profit,
          stock: Number(payload.stock),
          isActive: String(payload.isActive) === "true",
        },
      });

      // ৩. ছবি যুক্ত করার লজিক
      const singleProductImages = (files as any[])?.filter(
        (f) => f.fieldname === 'productImage'
      );

      if (singleProductImages && singleProductImages.length > 0) {
        const imageRecords = singleProductImages.map((f: any) => ({
          productImage: `/uploads/${f.filename}`,
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
      for (let i = 0; i < parsedVariants.length; i++) {
        const variantBlock = parsedVariants[i];

        // ১. ProductVariant ক্রিয়েট
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            colorCode: variantBlock.colorCode || null,
          },
        });

        // ২. VariantItem ক্রিয়েট
        const optionsList = variantBlock.options || (variantBlock as any).items || [];
        for (const opt of optionsList) {
          const cost = Number(opt.costPrice);
          const sell = Number(opt.sellPrice);
          const profit = sell - cost;
          const autoVariantName =
            opt.varientName ||
            `${product.name.slice(0, 3).toUpperCase()}-${opt.size || 'VAR'}-${Math.floor(10 + Math.random() * 90)}`;

          await tx.variantItem.create({
            data: {
              variantId: createdVariant.id,
              varientName: autoVariantName,
              size: opt.size || null,
              costPrice: cost,
              sellPrice: sell,
              profit: profit,
              stock: Number(opt.stock),
              isActive: opt.isActive !== undefined ? Boolean(opt.isActive) : true,
            },
          });
        }

        // ৩. শুধুমাত্র এই Specific Variant (i) এর ছবিগুলো সেভ হবে
        const currentVariantImages = (files as any[])?.filter(
          (f) => f.fieldname === `variant_images_${i}`
        );

        if (currentVariantImages && currentVariantImages.length > 0) {
          const imageRecords = currentVariantImages.map((f: any) => ({
            productImage: `/uploads/${f.filename}`,
            variantId: createdVariant.id,
          }));

          await tx.productImage.createMany({
            data: imageRecords,
          });
        }
      }
    }

    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        variants: {
          include: {
            images: true,
            variantItems: true,
          },
        },
      },
    });
  });
};


// getAllProductService
export const getAllProductService = async (payload: IGetAllProductsPayload) => {
  const { isDeleted, searchTerm } = payload;

  const searchFilter = searchTerm
    ? {
        name: {
          contains: searchTerm.trim().toLowerCase(),
          mode: 'insensitive' as const,
        },
      }
    : {};

  let whereConditions: any = {
    ...searchFilter,
  };

  if (isDeleted) {
    whereConditions.OR = [
      { isDeleted: true },
      { variants: { some: { isDeleted: true } } },
      {
        variants: {
          some: {
            variantItems: {
              some: { isDeleted: true },
            },
          },
        },
      },
    ];
  } else {
    whereConditions.isDeleted = false;
  }

  // কুয়েরি করে orderItems এর quantity আনা হচ্ছে
  const result = await prisma.product.findMany({
    where: whereConditions,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      thumbnailImage: true,
      name: true,
      productType: true,
      isActive: true,
      isDeleted: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      // 🟢 মেইন প্রোডাক্ট লেভেলে বিক্রিত কোয়ান্টিটি ট্র্যাক করার জন্য
      orderItems: {
        where: {
          order: {
            isRemoved: false,
            status: { not: 'RETURNED' },
          },
        },
        select: {
          quantity: true,
        },
      },
      variants: {
        where: isDeleted ? {} : { isDeleted: false },
        select: {
          id: true,
          colorCode: true,
          isActive: true,
          isDeleted: true,
          // 🟢 ভ্যারিয়েন্ট লেভেলে বিক্রিত কোয়ান্টিটি ট্র্যাক করার জন্য
          orderItems: {
            where: {
              order: {
                isRemoved: false,
                status: { not: 'RETURNED' },
              },
            },
            select: {
              quantity: true,
            },
          },
          images: {
            select: {
              id: true,
              productImage: true,
            },
          },
          variantItems: {
            select: {
              id: true,
              varientName: true,
              size: true,
              costPrice: true,
              sellPrice: true,
              stock: true,
              profit: true,
              isActive: true,
              isDeleted: true,
              // 🟢 সাইজ/আইটেম লেভেলে বিক্রিত কোয়ান্টিটি ট্র্যাক করার জন্য
              orderItems: {
                where: {
                  order: {
                    isRemoved: false,
                    status: { not: 'RETURNED' },
                  },
                },
                select: {
                  quantity: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // টোটাল সোল্ড কোয়ান্টিটি সাম (Sum) বের করা
  // ব্যাকএন্ডের getAllProductService এর ভেতরের প্রসেসিং লজিকটি এভাবে আপডেট করুন:

const processedResult = result.map((product: any) => {
  const totalSold = product.orderItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
  delete product.orderItems;

  const processedVariants = product.variants?.map((variant: any) => {
    
    // ১. প্রথমে প্রতিটি সাইজ/আইটেমের সোল্ড কোয়ান্টিটি হিসাব করা
    const processedVariantItems = variant.variantItems?.map((item: any) => {
      const itemSold = item.orderItems?.reduce((sum: number, x: any) => sum + (x.quantity || 0), 0) || 0;
      delete item.orderItems;

      return {
        ...item,
        totalSold: itemSold,
      };
    });

    // ২. এখন ভেরিয়েন্ট গ্রুপের টোটাল সোল্ড বের করতে এর আন্ডারে থাকা সমস্ত সাইজের totalSold যোগ করে দেওয়া
    const variantSold = processedVariantItems?.reduce((sum: number, item: any) => sum + (item.totalSold || 0), 0) || 0;
    // যদি ভেরিয়েন্টের নিজস্ব সরাসরি orderItems থাকে সেটার সাথেও যোগ করা যেতে পারে:
    const directVariantSold = variant.orderItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
    
    delete variant.orderItems;

    return {
      ...variant,
      totalSold: variantSold + directVariantSold, // সব সাইজ মিলিয়ে ভেরিয়েন্টের মোট বিক্রি
      variantItems: processedVariantItems,
    };
  });

  return {
    ...product,
    totalSold: totalSold,
    variants: processedVariants,
  };
});

  return processedResult;
};

// getSingleProductService
// getSingleProductService
export const getSingleProductService = async (payload: IGetSingleProductPayload) => {
  const { id } = payload;

  const isProductExist = await prisma.product.findUnique({
    where: { id },
  });

  if (!isProductExist) {
    throw new Error("Product not found!");
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      thumbnailImage: true,
      name: true,
      shortDescription: true,
      description: true,
      brand: true,
      productType: true,
      isActive: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,

      category: {
        select: {
          id: true,
          name: true,
        },
      },

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      // 🟢 মেইন প্রোডাক্ট লেভেলে বিক্রিত কোয়ান্টিটি ফিল্টার করা
      orderItems: {
        where: {
          order: {
            isRemoved: false,
            status: { not: 'RETURNED' },
          },
        },
        select: {
          quantity: true,
        },
      },

      variants: {
        select: {
          id: true,
          colorCode: true,
          isActive: true,
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,

          images: {
            select: {
              id: true,
              productImage: true,
              createdAt: true,
            },
          },

          // 🟢 ভ্যারিয়েন্ট লেভেলে বিক্রিত কোয়ান্টিটি ফিল্টার করা
          orderItems: {
            where: {
              order: {
                isRemoved: false,
                status: { not: 'RETURNED' },
              },
            },
            select: {
              quantity: true,
            },
          },

          variantItems: {
            select: {
              id: true,
              varientName: true,
              size: true,
              costPrice: true,
              minimumPrice: true,
              maximumPrice: true,
              sellPrice: true,
              profit: true,
              stock: true,
              vatPercent: true,
              discountPercent: true,
              isActive: true,
              isDeleted: true,
              deletedAt: true,
              createdAt: true,
              updatedAt: true,
              
              // 🟢 সাইজ/আইটেম লেভেলে বিক্রিত কোয়ান্টিটি ফিল্টার করা
              orderItems: {
                where: {
                  order: {
                    isRemoved: false,
                    status: { not: 'RETURNED' },
                  },
                },
                select: {
                  quantity: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!product) return null;

  // 🟢 ডেটা প্রসেস করে টোটাল সোল্ড কোয়ান্টিটি (totalSold) বের করা
  const totalSold = product.orderItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
  delete product.orderItems;

  const processedVariants = product.variants?.map((variant: any) => {
    const processedVariantItems = variant.variantItems?.map((item: any) => {
      const itemSold = item.orderItems?.reduce((sum: number, x: any) => sum + (x.quantity || 0), 0) || 0;
      delete item.orderItems;

      return {
        ...item,
        totalSold: itemSold,
      };
    });

    const variantSoldFromItems = processedVariantItems?.reduce((sum: number, item: any) => sum + (item.totalSold || 0), 0) || 0;
    const variantSoldDirect = variant.orderItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
    delete variant.orderItems;

    return {
      ...variant,
      totalSold: variantSoldFromItems + variantSoldDirect,
      variantItems: processedVariantItems,
    };
  });

  return {
    ...product,
    totalSold,
    variants: processedVariants,
  };
};

// updateProductService
export const updateProductService = async (
  productId: string,
  payload: any,
  groupedFiles: { [key: string]: Express.Multer.File[] }
) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        include: {
          variantItems: true,
          images: true,
        },
      },
    },
  });

  if (!existingProduct) {
    throw new Error("Product not found!");
  }

  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category || category.isDeleted || category.status !== CategoryStatus.ACTIVE) {
    throw new Error("Invalid or inactive category selected!");
  }

  return await prisma.$transaction(async (tx) => {
    // 🛑 ১. Thumbnail চেঞ্জ হলে পুরানো ফাইল ডিলিট
    if (payload.thumbnailImage && payload.thumbnailImage !== existingProduct.thumbnailImage) {
      removeLocalFile(existingProduct.thumbnailImage);
    }

    // মূল প্রোডাক্ট ডাটা আপডেট
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        name: payload.name,
        thumbnailImage: payload.thumbnailImage,
        shortDescription: payload.shortDescription || null,
        description: payload.description || null,
        brand: payload.brand || null,
        categoryId: payload.categoryId,
        isActive: String(payload.isActive) === "true",
      },
    });

    // CASE A: SINGLE PRODUCT LOGIC
    if (payload.productType === ProductType.SINGLE) {
      const cost = Number(payload.costPrice);
      const sell = Number(payload.sellPrice);
      const profit = sell - cost;
      const firstVariant = existingProduct.variants[0];

      let targetVariantId: string;

      if (firstVariant) {
        targetVariantId = firstVariant.id;
        await tx.productVariant.update({
          where: { id: firstVariant.id },
          data: { colorCode: payload.colorCode || null },
        });

        const firstItem = firstVariant.variantItems[0];
        const autoVariantName = `${updatedProduct.name.slice(0, 3).toUpperCase()}-${payload.size || 'REG'}-${Math.floor(100 + Math.random() * 900)}`;

        if (firstItem) {
          await tx.variantItem.update({
            where: { id: firstItem.id },
            data: {
              size: payload.size || null,
              costPrice: cost,
              sellPrice: sell,
              profit: profit,
              stock: Number(payload.stock),
              isActive: String(payload.isActive) === "true",
            },
          });
        } else {
          await tx.variantItem.create({
            data: {
              variantId: firstVariant.id,
              varientName: autoVariantName,
              size: payload.size || null,
              costPrice: cost,
              sellPrice: sell,
              profit: profit,
              stock: Number(payload.stock),
              isActive: String(payload.isActive) === "true",
            },
          });
        }

        // 🛑 ২. Single Product-এর পুরানো মুছে ফেলা ছবিগুলো সার্ভার থেকে রিমুভ
        const existingImages = payload.existingImages || [];
        const imagesToDelete = firstVariant.images.filter(
          (img) => !existingImages.includes(img.productImage)
        );

        imagesToDelete.forEach((img) => removeLocalFile(img.productImage));

        await tx.productImage.deleteMany({
          where: {
            variantId: targetVariantId,
            productImage: { notIn: existingImages },
          },
        });
      } else {
        const autoVariantName = `${updatedProduct.name.slice(0, 3).toUpperCase()}-${payload.size || 'REG'}-${Math.floor(100 + Math.random() * 900)}`;
        const newVariant = await tx.productVariant.create({
          data: {
            productId: updatedProduct.id,
            colorCode: payload.colorCode || null,
            variantItems: {
              create: {
                varientName: autoVariantName,
                size: payload.size || null,
                costPrice: cost,
                sellPrice: sell,
                profit: profit,
                stock: Number(payload.stock),
                isActive: String(payload.isActive) === "true",
              },
            },
          },
        });
        targetVariantId = newVariant.id;
      }

      // নতুন আপলোড করা ইমেজ সেভ
      const newFiles = groupedFiles.productImage || [];
      if (newFiles.length > 0) {
        const imageRecords = newFiles.map((f) => ({
          productImage: `/uploads/${f.filename}`,
          variantId: targetVariantId,
        }));

        await tx.productImage.createMany({ data: imageRecords });
      }
    }

    // CASE B: VARIANT PRODUCT LOGIC
    if (payload.productType === ProductType.VARIANT) {
      const parsedVariants = payload.variants || [];

      for (let i = 0; i < parsedVariants.length; i++) {
        const variantBlock = parsedVariants[i];
        let targetVariantId: string;
        const isExistingVariant = variantBlock.id && typeof variantBlock.id === "string" && !variantBlock.id.startsWith("new_");

        if (isExistingVariant) {
          targetVariantId = String(variantBlock.id);
          await tx.productVariant.update({
            where: { id: targetVariantId },
            data: { colorCode: variantBlock.colorCode || null },
          });

          // 🛑 ৩. Variant Product-এর পুরানো মুছে ফেলা ছবিগুলো সার্ভার থেকে রিমুভ
          const existingVariantImages = variantBlock.existingImages || [];
          const oldVariantRecord = existingProduct.variants.find((v) => v.id === targetVariantId);
          
          if (oldVariantRecord) {
            const variantImagesToDelete = oldVariantRecord.images.filter(
              (img) => !existingVariantImages.includes(img.productImage)
            );
            variantImagesToDelete.forEach((img) => removeLocalFile(img.productImage));
          }

          await tx.productImage.deleteMany({
            where: {
              variantId: targetVariantId,
              productImage: { notIn: existingVariantImages },
            },
          });
        } else {
          const newVariant = await tx.productVariant.create({
            data: {
              productId: updatedProduct.id,
              colorCode: variantBlock.colorCode || null,
            },
          });
          targetVariantId = newVariant.id;
        }

        // Options Update
        const optionsList = variantBlock.options || [];
        for (const opt of optionsList) {
          const cost = Number(opt.costPrice);
          const sell = Number(opt.sellPrice);
          const profit = sell - cost;
          const autoVariantName =
            opt.varientName ||
            `${updatedProduct.name.slice(0, 3).toUpperCase()}-${opt.size || 'VAR'}-${Math.floor(10 + Math.random() * 90)}`;

          const isExistingItem = opt.id && typeof opt.id === "string" && !opt.id.startsWith("new_item_");

          if (isExistingItem) {
            await tx.variantItem.update({
              where: { id: String(opt.id) },
              data: {
                varientName: autoVariantName,
                size: opt.size || null,
                costPrice: cost,
                sellPrice: sell,
                profit: profit,
                stock: Number(opt.stock),
                isActive: String(opt.isActive) === "true" || opt.isActive === true,
              },
            });
          } else {
            await tx.variantItem.create({
              data: {
                variantId: targetVariantId,
                varientName: autoVariantName,
                size: opt.size || null,
                costPrice: cost,
                sellPrice: sell,
                profit: profit,
                stock: Number(opt.stock),
                isActive: String(opt.isActive) === "true" || opt.isActive === true,
              },
            });
          }
        }

        // নতুন ইমেজ যোগ
        const newVariantFiles = groupedFiles[`variant_images_${i}`] || [];
        if (newVariantFiles.length > 0) {
          const imageRecords = newVariantFiles.map((f) => ({
            productImage: `/uploads/${f.filename}`,
            variantId: targetVariantId,
          }));

          await tx.productImage.createMany({ data: imageRecords });
        }
      }
    }

    return await tx.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        variants: {
          include: {
            images: true,
            variantItems: true,
          },
        },
      },
    });
  });
};


// product related

// updateProductStatusService
export const updateProductStatusService = async (id: string, status: string) => {
  const isActive = status === "ACTIVE";

  // Browse products
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          variantItems: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found!");
  }

  // If the product type is 'SINGLE', update the product, its sole variant, and the item together
  if (product.productType === "SINGLE") {
    const updatedProduct = await prisma.$transaction(async (tx) => {

      // Core Product Update
      const prod = await tx.product.update({
        where: { id },
        data: { isActive },
      });

      // Associated variant and item updates
      const variant = product.variants[0];
      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { isActive },
        });

        await tx.variantItem.updateMany({
          where: { variantId: variant.id },
          data: { isActive },
        });
      }

      return prod;
    });

    return updatedProduct;
  }

  // If it is a VARIANT type, only the main product's status is updated
  const result = await prisma.product.update({
    where: { id },
    data: { isActive },
  });

  return result;
};

// deleteProductService
export const deleteProductService = async (id: string) => {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          variantItems: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found!");
  }

  // Soft delete product along with its variants and items using transaction
  const deletedProduct = await prisma.$transaction(async (tx) => {
    // 1. Soft delete the main product
    const prod = await tx.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    // 2. Soft delete all associated variants and variant items
    if (product.variants.length > 0) {
      const variantIds = product.variants.map((variant) => variant.id);

      // Soft delete associated variant items
      await tx.variantItem.updateMany({
        where: { variantId: { in: variantIds } },
        data: { isDeleted: true },
      });

      // Soft delete associated variants
      await tx.productVariant.updateMany({
        where: { productId: id },
        data: { isDeleted: true },
      });
    }
    return prod;
  });

  return deletedProduct;
};

// restoreProductService
export const restoreProductService = async (id: string) => {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          variantItems: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found!");
  }

  // Restore product along with its variants and items using transaction
  const restoredProduct = await prisma.$transaction(async (tx) => {
    // 1. Restore the main product
    const prod = await tx.product.update({
      where: { id },
      data: { isDeleted: false },
    });

    // 2. Restore all associated variants and variant items
    if (product.variants.length > 0) {
      const variantIds = product.variants.map((variant) => variant.id);

      // Restore associated variant items (variantId ব্যবহার করা হয়েছে)
      await tx.variantItem.updateMany({
        where: { variantId: { in: variantIds } },
        data: { isDeleted: false },
      });

      // Restore associated variants
      await tx.productVariant.updateMany({
        where: { productId: id },
        data: { isDeleted: false },
      });
    }

    return prod;
  });

  return restoredProduct;
};



// product variant related

// updateProductVariantStatusService
export const updateProductVariantStatusService = async (variantId: string, status: string) => {
  const isActive = status === "ACTIVE";

  // Updating the status of the variant and the status of all items associated with that variant
  const updatedVariant = await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.update({
      where: { id: variantId },
      data: { isActive },
    });

    await tx.variantItem.updateMany({
      where: { variantId },
      data: { isActive },
    });

    return variant;
  });

  return updatedVariant;
};


// deleteProductVariantService
export const deleteProductVariantService = async (productId: string, variantId: string) => {
  // 1. Check if variant exists
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId: productId,
    },
    include: {
      variantItems: true,
    },
  });

  if (!variant) {
    throw new Error("Product variant not found!");
  }

  // Soft delete variant and its items using transaction
  const deletedVariant = await prisma.$transaction(async (tx) => {
    // Soft delete associated variant items/sizes
    if (variant.variantItems && variant.variantItems.length > 0) {
      await tx.variantItem.updateMany({
        where: { variantId: variantId },
        data: { isDeleted: true },
      });
    }

    // Soft delete the variant itself
    const updatedVariant = await tx.productVariant.update({
      where: { id: variantId },
      data: { isDeleted: true },
    });

    return updatedVariant;
  });

  return deletedVariant;
};


// restoreProductVariantService
export const restoreProductVariantService = async ( productId: string, variantId: string ) => {
  // Check if the variant exists along with its parent product
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId: productId,
    },
    include: {
      product: {
        select: {
          isDeleted: true,
        },
      },
      variantItems: true,
    },
  });

  if (!variant) {
    throw new Error("Product variant not found!");
  }

  // 🔴 CHECK: মেইন প্রোডাক্ট ডিলিট অবস্থায় আছে কিনা
  if (variant.product.isDeleted) {
    throw new Error("Your main product is deleted. Please restore the product first.");
  }

  // Transaction using prisma to restore both variant and its sub-items (sizes)
  const restoredVariant = await prisma.$transaction(async (tx) => {
    // 1. Restore associated variant items (sizes)
    await tx.variantItem.updateMany({
      where: { variantId: variantId },
      data: { isDeleted: false },
    });

    // 2. Restore the product variant
    const updatedVariant = await tx.productVariant.update({
      where: { id: variantId },
      data: { isDeleted: false },
    });

    return updatedVariant;
  });

  return restoredVariant;
};


// product variant item related

// updateProductVariantItemStatusService
export const updateProductVariantItemStatusService = async (itemId: string, status: string) => {
  const isActive = status === "ACTIVE";

  // Check if variant item exists
  const item = await prisma.variantItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new Error("Variant item not found!");
  }

  // Updating specific variant item status
  const updatedItem = await prisma.variantItem.update({
    where: { id: itemId },
    data: { isActive },
  });

  return updatedItem;
};


// deleteProductVariantItemService
export const deleteProductVariantItemService = async (
  productId: string,
  variantId: string,
  itemId: string
) => {
  // Check if variant item exists
  const item = await prisma.variantItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new Error("Variant item not found!");
  }

  // Soft delete the specific variant item
  const updatedVariantItem = await prisma.variantItem.update({
    where: { id: itemId },
    data: {
      isDeleted: true,
    },
  });

  return updatedVariantItem;
};

// restoreProductVariantItemService
export const restoreProductVariantItemService = async (
  productId: string,
  variantId: string,
  itemId: string
) => {
  // Check if item exists along with its parent variant and main product
  const item = await prisma.variantItem.findFirst({
    where: {
      id: itemId,
      variantId: variantId,
    },
    include: {
      variant: {
        select: {
          isDeleted: true,
          product: {
            select: {
              isDeleted: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    throw new Error("Variant item not found!");
  }

  // 🔴 STEP 1 CHECK: আগে চেক করা হবে মেইন প্রোডাক্ট ডিলিট আছে কিনা
  if (item.variant.product.isDeleted) {
    throw new Error("Your main product is deleted. Please restore the product first.");
  }

  // 🔴 STEP 2 CHECK: এরপর চেক করা হবে প্যারেন্ট ভ্যারিয়েন্ট ডিলিট আছে কিনা
  if (item.variant.isDeleted) {
    throw new Error("Your parent variant is deleted. Please restore the variant first.");
  }

  // Restore only the specific variant item
  const restoredItem = await prisma.variantItem.update({
    where: { id: itemId },
    data: { isDeleted: false },
  });

  return restoredItem;
};