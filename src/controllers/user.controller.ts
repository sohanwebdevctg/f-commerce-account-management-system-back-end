// Import Request and Response types from Express for handling HTTP communication
import { Request, Response } from "express";
// Import all user-related service functions from the service layer
import { createUserService, deleteUserService, getAllUserService, getSingleUserService, getUserProfileService, restoreUserService, updateUserProfileService, updateUserRoleService, updateUserStatusService } from "../services/user.service";
import fs from "fs";
import path from "path";

// createUser
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try{

    // get user information from request body
    const {name, email, password,role, status} = req.body;

    // Check if required fields exist
    if(!email || !password){
      res.status(400).json({
      success: false,
      message: 'email and password are required!',
      statusCode: 400,
      data: null
    });
    return;
    }

    // Strong Password Validation Check (Regex)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if(!passwordRegex.test(password)){
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
        data: null
      });
      return;
    }

    // create user service
    const result = await createUserService({name,email,password,role,status});

    res.status(201).json({
      success: true,
      message: 'User Created Successfully',
      statusCode: 201,
      data: result
    });
    return;

  }catch(error: any){
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
      statusCode: 500,
      data: null
    });
    return;
  }
}

// getAllUsers
export const getAllUsers = async (req: Request, res: Response):Promise<void> => {
  try{

    // Retrieving parameters from the URL query
    const isDeleted = req.query.isDeleted === 'true';
    const searchTerm = req.query.searchTerm as string | undefined;

    // Sending data to the service layer for processing
    const result = await getAllUserService({isDeleted, searchTerm});

    // Sending a successful response to the client
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      statusCode: 200,
      data: result
    });
    return;

  }catch(error: any){
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
      statusCode: 500,
      data: null
    });
    return;
  }
}

// get user profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Data has been passed to req.user from the auth middleware.
    const loggedInUser = (req as any).user;

    if (!loggedInUser?.id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access!",
        statusCode: 401,
        data: null,
      });
      return;
    }

    const result = await getUserProfileService(loggedInUser.id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "User profile not found!",
        statusCode: 404,
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
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


// updateUserProfile Controller (Testing Step)
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const file = (req as any).file;
  try {
    const userId = (req as any).user?.id;
    const { name, email, password } = req.body;

    // Password Regex Check (If the user sends a new password)
    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!\%*?&#]{8,}$/;

      if (!passwordRegex.test(password)) {
        if (file) {
          const uploadedFilePath = path.join(__dirname, "../../public/uploads", file.filename);
          if (fs.existsSync(uploadedFilePath)) {
            fs.unlinkSync(uploadedFilePath);
          }
        }

        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
          data: null
        });
        return;
      }
    }

    const payload = {
      name,
      email,
      password: password || undefined,
      profileImage: file ? `/uploads/${file.filename}` : undefined,
    };

    // Call Service
    const result = await updateUserProfileService(userId, payload);

    res.status(200).json({
      success: true,
      message: 'User Profile Updated Successfully',
      statusCode: 200,
      data: result
    });
    return;

  } catch (error: any) {

    if (file) {
      const uploadedFilePath = path.join(__dirname, "../../public/uploads", file.filename);
      if (fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
      data: null
    });
    return;
  }
};



// getSingleUser
export const getSingleUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // check id validation
    if (!id) {
      res.status(400).json({
        success: false,
        message: "User ID is required!",
        statusCode: 400,
        data: null,
      });
      return;
    }

    const result = await getSingleUserService(id as string);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "User not found!",
        statusCode: 404,
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
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

// updateUserRole
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {

  try{

    const {id} = req.params;
    const loggedInUser = (req as any).user;
    const {role} = req.body;

    // checked user role is admin
    if (loggedInUser?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only ADMIN can change user roles!",
        statusCode: 403,
        data: null
      });
      return;
    }

    // check user id
    if(id === loggedInUser?.id){
        res.status(403).json({
        success: false,
        message: "You cannot update your own role!",
        statusCode: 403,
        data: null
      });
      return;
    }

    const result = await updateUserRoleService(id as string,{role});

      res.status(200).json({
      success: true,
      message: "User role updated successfully",
      statusCode: 200,
      data: result
    });
    return;

  }catch(error: any){
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
      statusCode: 500,
      data: null
    });
    return;
  }

}


// updateUserStatus
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const loggedInUser = (req as any).user;
    const { status } = req.body;

    // checked user id
    if (id === loggedInUser?.id) {
      res.status(403).json({
        success: false,
        message: "You cannot update your own status!",
        statusCode: 403,
        data: null,
      });
      return;
    }

    const result = await updateUserStatusService(id as string, { status });

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      statusCode: 200,
      data: result,
    });
    return;

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
      statusCode: 500,
      data: null,
    });
    return;
  }
};

// deleteUser
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const loggedInUser = (req as any).user;

    // checked user id
    if (id === loggedInUser?.id) {
      res.status(403).json({
        success: false,
        message: "You cannot delete your own account!",
        statusCode: 403,
        data: null,
      });
      return;
    }

    const result = await deleteUserService(id as string);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
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

// restoreUser
export const restoreUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await restoreUserService(id as string);

    res.status(200).json({
      success: true,
      message: "User restored successfully",
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