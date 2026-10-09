import { Request, Response } from "express";
import { loginUserService } from "../services/auth.service";


// loginUser
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try{

    // get user information from request body
  const {email, password} = req.body;

  // Check if required fields exist
  if(!email || !password){
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'email and password are required!',
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

    const result = await loginUserService({email, password});

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User logged in successfully!',
      data: result
    });
    return;

  }catch(error: any){
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Something went wrong',
      data: null
    });
    return;
  }
}
