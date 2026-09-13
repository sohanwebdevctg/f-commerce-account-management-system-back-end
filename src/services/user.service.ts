import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { Role, UserStatus } from '@prisma/client';
import fs from "fs";
import path from "path";


interface ICreateUserPayload {
email: string; // Email must be a string (required)
password: string; // Password must be a string (required)
role?: Role; // Role must be the Prisma Role Enum (optional: ?)
status?: UserStatus; // Status must be the UserStatus Enum (optional: ?)
}

interface IGetAllUsersQuery{
  isDeleted?: string;
  searchTerm?: string;
}

interface IUpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
  profileImage?: string;
}

// createUserService
export const createUserService = async (payload: ICreateUserPayload) => {
  // duplicate email check
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // if user exist
  if (existingUser) {
    throw new Error('User with this email already exists!');
  }

  // password hashing
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Create user in the database
  const newUser = await prisma.user.create({
    data: {
      email: payload.email,
      password: hashedPassword,
      role: payload.role || Role.STAFF,
      status: payload.status || UserStatus.APPROVED,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return newUser;
};

// getAllUsersService
export const getAllUsersService = async (query: IGetAllUsersQuery) => {
  const {isDeleted, searchTerm} = query;

  // Dynamic filter object
  const whereCondition: any = {};

  // Tab logic (Active vs Deleted)
  if(isDeleted !== undefined){
    whereCondition.isDeleted = isDeleted === 'true';
  };

  // Search logic (Name or Email)
  if(searchTerm){
    whereCondition.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ];
  };

  // Retrieving the count of users and their orders from the database.
  const users = await prisma.user.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
      status: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          createdOrders: true, // Counting the number of orders the user has
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users;
}

// getUserByIdService (Service to retrieve detailed data for a single user using an ID)
export const getUserByIdService = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          createdOrders: true,
          createdProducts: true,
          categories: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found!');
  }

  return user;
};


// updateUserRoleService
export const updateUserRoleService = async ( targetUserId: string,
  requestedAdminId: string, newRole: string ) => {

  // You should not be allowed to update your own role
  if (targetUserId === requestedAdminId) {
    throw new Error("You cannot change your own role!");
  }

  // Check if it exists in the user database
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user || user.isDeleted) {
    throw new Error("User not found!");
  }

  // Role Update
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole as any },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};


// updateUserStatusService
export const updateUserStatusService = async ( targetUserId: string,
  requestedUserId: string, newStatus: string ) => {

  // You shouldn't let yourself update your own status.
  if (targetUserId === requestedUserId) {
    throw new Error("You cannot change your own status!");
  }

  // Check if it exists in the user database
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user || user.isDeleted) {
    throw new Error("User not found!");
  }

  // Status Update
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: newStatus as any },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// softDeleteUserService
export const softDeleteUserService = async (targetUserId: string,requestedAdminId: string ) => {

  // The admin cannot delete themselves.
  if (targetUserId === requestedAdminId) {
    throw new Error("You cannot delete your own account!");
  }

  // Check if it exists in the user database
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  if (user.isDeleted) {
    throw new Error("User is already deleted!");
  }

  // Soft delete (setting isDeleted: true and deletedAt)
  const deletedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      role: true,
      isDeleted: true,
      deletedAt: true,
    },
  });

  return deletedUser;
};


// restoreUserService
export const restoreUserService = async (targetUserId: string,requestedAdminId: string ) => {

  // Restore request blocked on own ID
  if (targetUserId === requestedAdminId) {
    throw new Error("You cannot restore your own account!");
  }

  // Check if it exists in the user database
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  if (!user.isDeleted) {
    throw new Error("User is not deleted!");
  }

  // Restore logic (isDeleted: false and deletedAt: null)
  const restoredUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isDeleted: true,
      updatedAt: true,
    },
  });

  return restoredUser;
};


// getUserProfileService
export const getUserProfileService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      profileImage: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || user.isDeleted) {
    throw new Error("User not found!");
  }

  return user;
};

// updateUserProfileService
export const updateUserProfileService = async (userId: string,payload: IUpdateProfilePayload) => {

  // Check user existence and active status
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser || currentUser.isDeleted) {
    throw new Error("User not found!");
  }

  const updatedData: Record<string, any> = {};

  // Uniqueness check when attempting to change email
  if (payload.email && payload.email !== currentUser.email) {
    const isEmailExist = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (isEmailExist) {
      throw new Error("Email is already taken by another user!");
    }

    updatedData.email = payload.email;
  }

  // Update Name and Profile Image
  if (payload.name) updatedData.name = payload.name;

  if (payload.profileImage) {

    // Delete the previous image from the local folder if it exists
    if (currentUser.profileImage) {
      const oldImagePath = path.join(__dirname, "../../public", currentUser.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    updatedData.profileImage = payload.profileImage;
  }

  // Password Update (Hashed)
  if (payload.password) {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    updatedData.password = hashedPassword;
  }

  // Database update (excluding roll and status entirely)
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updatedData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      profileImage: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};