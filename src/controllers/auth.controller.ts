// Import Request and Response types from Express for handling HTTP communication
import { Request, Response } from "express";
// Import login user service function to handle authentication business logic
import { loginUserService } from "../services/auth.service";


// loginUser
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try{

  // Extract email and password from the request body
  const {email, password} = req.body;

  // Validate if required fields (email and password) are provided
  if(!email || !password){
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'email and password are required!',
      data: null
    });
    return;
  }

    // Define regex for strong password validation (min 8 chars, uppercase, lowercase, number, special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    // Validate password format against the regex pattern
    if(!passwordRegex.test(password)){
      res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
      data: null
      });
      return;
    }

    // Call authentication service to process user login and generate token
    const result = await loginUserService({email, password});

    // Send successful response with the authentication token and user data
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User logged in successfully!',
      data: result
    });
    return;

  }catch(error: any){
    // Handle any unexpected errors during the login process and return server error response
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Something went wrong',
      data: null
    });
    return;
  }
}
