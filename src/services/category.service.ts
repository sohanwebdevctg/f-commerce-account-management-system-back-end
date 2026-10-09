import prisma from "../prisma";
import { CategoryStatus } from "@prisma/client";

export interface ICreateCategoryPayload{
  name: string;
  description?: string;
  status?: CategoryStatus;
  createdBy: string;
}

export interface IGetAllCategoriesPayload {
  isDeleted: boolean;
  searchTerm?: string;
}


// Update Category Status Payload Interface
export interface IUpdateCategoryStatusPayload {
  status: CategoryStatus;
}

// update category payload
export interface IUpdateCategoryPayload {
  name?: string;
  description?: string;
}

// create category service
export const createCategoryService = async (payload: ICreateCategoryPayload) => {

  // Check for duplicate names (case-insensitive)
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: payload.name,
        mode: "insensitive", // Matches regardless of case (uppercase/lowercase)
      },
    },
  });

  if (existingCategory) {
    throw new Error("Category with this name already exists!");
  }

  // Creating a new category in the database
  const result = await prisma.category.create({
    data: {
      name: payload.name,
      description: payload.description,
      status: payload.status,
      createdBy: {
        connect: {
          id: payload.createdBy,
        },
      },
    },
    select: {
      name: true,
    },
  });

  return result;

}


// get all category service
export const getAllCategoryService = async (payload: IGetAllCategoriesPayload) => {

  // get payload data
  const { isDeleted, searchTerm } = payload;

  // sending data
  const whereConditions: any = { isDeleted };

  // if search data
  if (searchTerm) {
    const cleanedSearchTerm = searchTerm.trim().toLowerCase();

    // check search data value
    whereConditions.name = {
      contains: cleanedSearchTerm,
      mode: 'insensitive',
    };
  }

  // Retrieving data from the database
  const result = await prisma.category.findMany({
    where: whereConditions,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
      status: true,
      isDeleted: true,
      createdAt: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return result;

}

// getAllActiveCategoryService
export const getAllActiveCategoryService = async () => {
  const result = await prisma.category.findMany({
    where: {
      isDeleted: false,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

// Get All Public Category Service
export const getAllPublicCategoryService = async () => {
  const result = await prisma.category.findMany({
    where: {
      isDeleted: false,
      status: "ACTIVE",
      // যেসব ক্যাটাগরির আন্ডারে অন্তত একটি active প্রোডাক্ট আছে শুধু সেগুলো আসবে
      products: {
        some: {
          isActive: true,
          isDeleted: false,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};


// Get Single Category Service
export const getSingleCategoryService = async (id: string) => {
  const result = await prisma.category.findUnique({
    where: { 
      id,
      isDeleted: false,
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
      _count: {
        select: {
          products: true,
        },
      },
    },
  });
  return result;
};

// updateCategoryStatusService
export const updateCategoryStatusService = async (id: string,
  payload: IUpdateCategoryStatusPayload) => {
    const result = await prisma.category.update({
      where: { id },
      data: {
        status: payload.status,
      },
    });
    return result;
}

// Soft Delete Category Service
export const deleteCategoryService = async (id: string) => {
  const result = await prisma.category.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
  return result;
}

// restoreCategoryService
export const restoreCategoryService = async (id: string) => {
  const result = await prisma.category.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
  return result;
}


// update category service
export const updateCategoryService = async ( id: string, payload: IUpdateCategoryPayload) => {

  // Checking whether the category is genuine and has not been deleted.
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingCategory) {
    throw new Error("Category not found!");
  }

  // If a new name is submitted, match it against names in other categories (case-insensitive).
  if (payload.name) {
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: payload.name,
          mode: "insensitive",
        },
        isDeleted: false,
      },
    });

    if (duplicateCategory) {
      throw new Error("Category with this name already exists!");
    }
  }

  // Preparing update data (only the data that has been sent will be updated)
  const updateData: Record<string, any> = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }

  if (payload.description !== undefined) {
    updateData.description = payload.description;
  }

  // Database update
  const result = await prisma.category.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updatedAt: true,
    },
  });

  return result;
};