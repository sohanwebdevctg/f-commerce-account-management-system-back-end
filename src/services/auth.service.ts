// Import the configured Prisma client instance for database queries
import prisma from "../prisma";
// Import jsonwebtoken module for generating access tokens
import jwt from 'jsonwebtoken';
// Import bcryptjs for secure password comparison and hashing
import bcrypt from "bcryptjs";

// Define TypeScript interface for login payload structure
export interface ILoginPayload{
  email: string;
  password: string;
}

// loginUserService
export const loginUserService = async (payload: ILoginPayload) => {

  // Fetch the user record from the database using the provided email
  const user = await prisma.user.findUnique({
    where:{
      email: payload.email
    }
  });

  // Verify if the user exists in the database
  if(!user){
    throw new Error('Invalid email or password!');
  }

  // Check if the user account has been soft-deleted
  if(user.isDeleted){
    throw new Error('Your account has been deleted. Please contact support.');
  }

  // Verify if the user account status is approved
  if(user.status !== "APPROVED"){
    throw new Error(`Your account status is ${user.status}. Access denied.`);
  }

  // Compare the input password with the hashed password stored in the database
  const isPasswordMatched = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordMatched) {
    throw new Error('Invalid email or password!');
  }

  // Retrieve and validate the JWT secret key from environment variables
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables!');
  }

  // Generate a JSON Web Token (JWT) containing user ID, email, and role with a 7-day expiration
  const accessToken = jwt.sign({
    id: user.id,
    email: user.email,
    role: user.role
  }, jwtSecret, { expiresIn: '7d'}
  );

  // Return the generated access token and essential user details
  return {
    token: accessToken,
    id: user.id,
    email: user.email,
    role: user.role
  };
};
