import { Request, Response } from "express";
import { createUserService, getAllUsersService, getUserByIdService, getUserProfileService, restoreUserService, softDeleteUserService, updateUserProfileService, updateUserRoleService, updateUserStatusService } from "../services/user.service";


// createUser
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try{

    const {email, password, role, status} = req.body;

    // check email and password
    if(!email || !password){
      res.status(400).json({
        success: false,
        message: 'Email and password are required!',
      });
      return;
    }

    // Strong Password Validation Check (Regex)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if(!passwordRegex.test(password)){
      res.status(400).json({
      success: false,
      message:'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
      });
      return;
    }

    // Saving to the database by making a service call
    const result = await createUserService({ email, password, role, status });

    // Final success response
    res.status(201).json({
      success: true,
      message: 'User created successfully!',
      data: result,
    });
    return;

  }catch(error:any){
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong!',
    });
    return;
  }
};

// getAllUsers
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {

  try{

    // Receiving isDeleted and searchTerm from (req.query)
    const filters = {
      isDeleted: req.query.isDeleted as string | undefined,
      searchTerm: req.query.searchTerm as string | undefined,
    };

    const result = await getAllUsersService(filters);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully!',
      data: result,
    });
    return;

  }catch(error: any){
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users!',
    });
    return;
  }

};

// getUserById
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // params id
    const result = await getUserByIdService(id as string);

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully!',
      data: result,
    });
    return;
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'User not found!',
    });
    return;
  }
};

// updateUserRole
export const updateUserRole = async (req: Request,res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const requestedAdminId = (req as any)?.user.id;

    const result = await updateUserRoleService(id as string, requestedAdminId, role);

    res.status(200).json({
      success: true,
      message: "User role updated successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update user role",
    });
  }
};


// updateUserStatus
export const updateUserStatus = async (req: Request,res: Response ): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const requestedUserId = (req as any).user?.id;

    const result = await updateUserStatusService(id as string,requestedUserId,status);

    res.status(200).json({
      success: true,
      message: "User status updated successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update user status",
    });
  }
};


// softDeleteUser
export const softDeleteUser = async ( req: Request, res: Response ): Promise<void> => {
  try {

    const { id } = req.params;
    const requestedAdminId = (req as any).user?.id;

    const result = await softDeleteUserService(id as string,requestedAdminId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
};


// restoreUser
export const restoreUser = async (req: Request,res: Response ): Promise<void> => {
  try {
    const { id } = req.params;
    const requestedAdminId = (req as any).user?.id;

    const result = await restoreUserService(id as string, requestedAdminId);

    res.status(200).json({
      success: true,
      message: "User restored successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to restore user",
    });
  }
};


// getUserProfile
export const getUserProfile = async ( req: Request, res: Response ): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const result = await getUserProfileService(userId);

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch user profile",
    });
  }
};


// updateUserProfile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const file = (req as any).file;
    
    // Generating data and relative file paths from Multer
    const payload = {
      ...req.body,
      ...(file && { profileImage: `/uploads/${file.filename}` }),
    };

    const result = await updateUserProfileService(userId, payload);

    res.status(200).json({
      success: true,
      message: "User profile updated successfully!",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update user profile",
    });
  }
};