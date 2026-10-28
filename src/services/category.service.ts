import prisma from "../prisma";
import { CategoryStatus } from "@prisma/client";

// Define TypeScript interface for the category creation payload structure
export interface ICreateCategoryPayload{
  name: string;
  description?: string;
  status?: CategoryStatus;
  createdBy: string;
};

// Define TypeScript interface for the get all categories payload structure
export interface IGetAllCategoriesPayload {
  isDeleted: boolean;
  searchTerm?: string;
};


// Update Category Status Payload Interface
export interface IUpdateCategoryStatusPayload {
  status: CategoryStatus;
};

// Define TypeScript interface for the update category payload structure
export interface IUpdateCategoryPayload {
  name?: string;
  description?: string;
};

// create category service
export const createCategoryService = async (payload: ICreateCategoryPayload) => {

  // Check if a category with the same name already exists in the database (case-insensitive check)
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: payload.name,
        mode: "insensitive", // Matches regardless of case (uppercase/lowercase)
      },
    },
  });

  // Throw an error if a duplicate category name is found
  if (existingCategory) {
    throw new Error("Category with this name already exists!");
  }

  // Creating a new category record in the database and connecting it to the creator user
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

  // Return the result of the created category
  return result;

};


// getAllCategoryService
export const getAllCategoryService = async (payload: IGetAllCategoriesPayload) => {

  // Extract filter parameters from the payload
  const { isDeleted, searchTerm } = payload;

  // Initialize the where clause conditions object with the isDeleted filter
  const whereConditions: any = { isDeleted };

  // Check if a search term was provided in the query parameters
  if (searchTerm) {
    const cleanedSearchTerm = searchTerm.trim().toLowerCase();

    // Add case-insensitive name filter condition for searching categories
    whereConditions.name = {
      contains: cleanedSearchTerm,
      mode: 'insensitive',
    };
  }

  // Retrieving category records from the database based on conditions, sorted by creation date descending
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

  // Return the fetched category list
  return result;

};

// getAllActiveCategoryService
export const getAllActiveCategoryService = async () => {
  // Fetch categories where isDeleted is false and status is ACTIVE, ordered by creation date descending
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

  // Return the list of active categories
  return result;
};

// getAllPublicCategoryService
export const getAllPublicCategoryService = async () => {
  // Fetch categories where status is ACTIVE, not deleted, and contains at least one active and non-deleted product
  const result = await prisma.category.findMany({
    where: {
      isDeleted: false,
      status: "ACTIVE",
      // Filter categories that have at least one active product associated with them
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

  // Return the list of filtered public categories
  return result;
};


// Get Single Category Service
export const getSingleCategoryService = async (id: string) => {
  // Fetch the unique category record along with creator details and associated products count
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
  // Return the fetched category object or null if not found
  return result;
};

// updateCategoryStatusService
export const updateCategoryStatusService = async (id: string,
  payload: IUpdateCategoryStatusPayload) => {
    // Perform database update query for the specific category ID
    const result = await prisma.category.update({
      where: { id },
      data: {
        status: payload.status,
      },
    });
    // Return the updated category record
    return result;
};

// deleteCategoryService
export const deleteCategoryService = async (id: string) => {
  // Update the category record to mark it as deleted and set the deletion timestamp
  const result = await prisma.category.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
  // Return the updated category record
  return result;
};

// restoreCategoryService
export const restoreCategoryService = async (id: string) => {
  // Update the category record to undo soft-deletion
  const result = await prisma.category.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
  // Return the updated category record
  return result;
};


// updateCategoryService
export const updateCategoryService = async ( id: string, payload: IUpdateCategoryPayload) => {

  // Check whether the category exists and has not been deleted
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  // Throw an error if the category is not found or already deleted
  if (!existingCategory) {
    throw new Error("Category not found!");
  }

  // If a new name is submitted, check for duplicate names in other categories (case-insensitive)
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

    // Throw an error if another category with the same name already exists
    if (duplicateCategory) {
      throw new Error("Category with this name already exists!");
    }
  }

  // Prepare dynamic update data object (only include fields that were provided)
  const updateData: Record<string, any> = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }

  if (payload.description !== undefined) {
    updateData.description = payload.description;
  }

  // Perform database update query for the specific category ID and select specific fields to return
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

  // Return the updated category record
  return result;
};