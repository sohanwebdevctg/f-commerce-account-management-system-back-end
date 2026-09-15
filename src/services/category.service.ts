import { CategoryStatus } from '@prisma/client';
import prisma from '../prisma';

interface ICreateCategoryPayload {
  name: string;
  description?: string;
  status?: CategoryStatus;
}

interface IGetAllCategoriesQuery {
  isDeleted?: string;
  searchTerm?: string;
}

interface IUpdateCategoryPayload {
  name?: string;
  description?: string;
}

// createCategoryService
export const createCategoryService = async (userId: string,payload: ICreateCategoryPayload ) => {

  // Checking for case-insensitive unique names (matches will be detected regardless of whether uppercase or lowercase letters are used)
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: payload.name.trim(),
        mode: 'insensitive',
      },
    },
  });

  if (existingCategory) {
    throw new Error('Category with this name already exists!');
  }

  // Creating a category (it is best to trim it to remove extra spaces)
  const newCategory = await prisma.category.create({
    data: {
      name: payload.name.trim(),
      description: payload.description,
      status: payload.status || CategoryStatus.ACTIVE,
      createdById: userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return newCategory;
};


// getAllCategoriesService
export const getAllCategoriesService = async (query: IGetAllCategoriesQuery) => {
  const { isDeleted, searchTerm } = query;

  // Dynamic filter object
  const whereCondition: any = {};

  // Tab logic (Active vs Trash)
  if (isDeleted !== undefined) {
    whereCondition.isDeleted = isDeleted === 'true';
  }

  // Search logic (Category Name)
if (searchTerm) {
  const cleanedSearchTerm = searchTerm.trim();
  whereCondition.OR = [
    { name: { contains: cleanedSearchTerm, mode: 'insensitive' } },
  ];
}

  // Retrieving categories along with products count
  const categories = await prisma.category.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          products: true, // Counting products for productsCount field
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return categories;
};


// getCategoryByIdService
export const getCategoryByIdService = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error('Category not found!');
  }

  return category;
};


// updateCategoryStatusService
export const updateCategoryStatusService = async (id: string, newStatus: string) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category || category.isDeleted) {
    throw new Error("Category not found!");
  }

  // Update status
  const updatedCategory = await prisma.category.update({
    where: { id },
    data: { status: newStatus as any },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedCategory;
};


// updateCategoryService
export const updateCategoryService = async (id: string,payload: IUpdateCategoryPayload ) => {
  // Check category existence
  const currentCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!currentCategory || currentCategory.isDeleted) {
    throw new Error("Category not found!");
  }

  const updatedData: Record<string, any> = {};

  // Check unique name if user attempts to change it
  if (payload.name) {
    const trimmedName = payload.name.trim();

    if (trimmedName.toLowerCase() !== currentCategory.name.toLowerCase()) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: "insensitive",
          },
        },
      });

      if (existingCategory) {
        throw new Error("Category with this name already exists!");
      }
    }

    updatedData.name = trimmedName;
  }

  // Update description if provided
  if (payload.description !== undefined) {
    updatedData.description = payload.description;
  }

  // Update database (status & isDeleted cannot be updated here)
  const updatedCategory = await prisma.category.update({
    where: { id },
    data: updatedData,
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedCategory;
};


// softDeleteCategoryService
export const softDeleteCategoryService = async (id: string) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error("Category not found!");
  }

  if (category.isDeleted) {
    throw new Error("Category is already deleted!");
  }

  // Soft delete (setting isDeleted: true and deletedAt)
  const deletedCategory = await prisma.category.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      isDeleted: true,
      deletedAt: true,
      updatedAt: true,
    },
  });

  return deletedCategory;
};


// restoreCategoryService
export const restoreCategoryService = async (id: string) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error("Category not found!");
  }

  if (!category.isDeleted) {
    throw new Error("Category is not deleted!");
  }

  // Restore logic (setting isDeleted: false and deletedAt: null)
  const restoredCategory = await prisma.category.update({
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

  return restoredCategory;
};


// getPublicCategoriesService
export const getPublicCategoriesService = async () => {
  const categories = await prisma.category.findMany({
    where: {
      isDeleted: false,
      status: CategoryStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};