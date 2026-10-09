import bcrypt from "bcryptjs";
import prisma from "../prisma";
import { Role, UserStatus } from "@prisma/client";
import fs from "fs";
import path from "path";


// Type definition for the service function's input object
export interface ICreateUserPayload{
  name?: string;
  email: string;
  password: string;
  role?: Role;
  status?: UserStatus;
}

// Get All User Table Data
export interface IGetAllUsersPayload{
  isDeleted: boolean;
  searchTerm?: string;
}

// update user profile
interface IUpdateUserProfilePayload {
  name?: string;
  email?: string;
  password?: string;
  profileImage?: string;
}

// Update User Role
export interface IUpdateRolePayload {
  role: Role;
}

// Update User Status
export interface IUpdateStatusPayload {
  status: UserStatus;
}


// createUserService
export const createUserService = async (payload: ICreateUserPayload) => {

  // email validation
  const isEmailExist = await prisma.user.findUnique({
    where:{
      email: payload.email
    }
  });

  if(isEmailExist){
    throw new Error('User already exists with this email!');
  }

  // Password Hashing
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.password, salt);

  // create user
  const result = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: payload.role || "STAFF",
      status: payload.status || "APPROVED"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return result;

};


// getAllUserService
export const getAllUserService = async (payload: IGetAllUsersPayload) => {

  // get payload data
  const {isDeleted, searchTerm} = payload;

  // sending data
  const whereConditions: any = {isDeleted};

  // if search data
  if(searchTerm){
    const cleanedSearchTerm = searchTerm.trim().toLowerCase();

    // check search data value
    whereConditions.OR = [
      { name: { contains: cleanedSearchTerm, mode: 'insensitive' } },
      { email: { contains: cleanedSearchTerm, mode: 'insensitive' } },
    ];
  }

  const result = await prisma.user.findMany({
    where: whereConditions,
    orderBy: {
    createdAt: 'desc',
  },
    select: {
    id: true,
    profileImage: true,
    name: true,
    email: true,
    role: true,
    status: true,
    isDeleted: true,
    createdAt: true,
  },
  });
  return result;
}

// get user profile service
export const getUserProfileService = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id },
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
    },
  });
  return result;
};

// update user profile service
export const updateUserProfileService = async (userId: string, payload: IUpdateUserProfilePayload) => {

  // Checking if it exists in the user database
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser || currentUser.isDeleted) {
    throw new Error("User not found!");
  }

  const updatedData: Record<string, any> = {};

  // Email Update Condition (Unique Email Check)
  if (payload.email && payload.email !== currentUser.email) {
    const isEmailExist = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (isEmailExist) {
      throw new Error("Email is already taken by another user!");
    }

    updatedData.email = payload.email;
  }

  if (payload.name) {
    updatedData.name = payload.name;
  }

  if (payload.profileImage) {

    // Delete the existing image from the folder if it exists
    if (currentUser.profileImage) {
      const oldImagePath = path.join(__dirname, "../../public", currentUser.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    updatedData.profileImage = payload.profileImage;
  }


  // Password hashing condition (hashes the password if a new one is provided)
  if (payload.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);
    updatedData.password = hashedPassword;
  }

  // update user
  const result = await prisma.user.update({
    where: { id: userId },
    data: updatedData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      updatedAt: true,
    },
  });

  return result;

}

// Get Single User Service
export const getSingleUserService = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id },
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
    },
  });
  return result;
};


// updateUserRoleService
export const updateUserRoleService = async (id: string, payload: IUpdateRolePayload) => {
  const result = await prisma.user.update({
    where: { id },
    data: {
      role: payload.role,
    },
  });
  return result;
}


// updateUserStatusService
export const updateUserStatusService = async (id: string, payload: IUpdateStatusPayload) => {
  const result = await prisma.user.update({
    where: { id },
    data: {
      status: payload.status,
    },
  });
  return result;
};

// Soft Delete User Service
export const deleteUserService = async (id: string) => {
  const result = await prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
  return result;
};


// Restore User Service
export const restoreUserService = async (id: string) => {
  const result = await prisma.user.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
  return result;
};