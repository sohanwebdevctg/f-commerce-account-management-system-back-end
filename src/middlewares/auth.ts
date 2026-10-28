// Import Express framework types for handling HTTP requests, responses, and middleware execution
import { NextFunction, Request, Response } from "express";
// Import jsonwebtoken module and JwtPayload type for token verification and decoding
import jwt, { JwtPayload } from 'jsonwebtoken';
// Import the configured Prisma client instance for database queries
import prisma from "../prisma";

// Middleware function to handle authentication and role-based authorization
export const auth = (...requiredRoles: string[]) => {
  // Return the asynchronous middleware handler function
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try{

      // Extracting the bearer token from the authorization header
      const token = req.headers.authorization?.split(' ')[1];

      // Validate if the token is missing or undefined
      if(!token){
        res.status(401).json({
          success: false,
          message: 'unauthorized access',
          statusCode: 401,
          data: null
        })
        return;
      }

    // Retrieve and validate the JWT secret key from environment variables
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables!');
    }

    // Verify the token using the secret key and decode the payload
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const {id, email, role} = decoded;

    // Fetch the user record from the database using the decoded user ID
    const user = await prisma.user.findUnique({
      where:{
        id: id,
      }
    });

    // Check if the user exists in the database
    if(!user){
      res.status(404).json({
        success: false,
        message: 'user not found',
        statusCode: 404,
        data: null
      });
      return;
    }

    // Check if the user account has been soft-deleted
    if (user.isDeleted) {
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'This account has been deleted!',
        data: null,
      });
      return;
    }

    // Verify if the user account status is currently approved
    if (user.status !== 'APPROVED') {
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'User account is not approved!',
        data: null,
      });
      return;
    }

    // Validate if the user's role is authorized for the requested route
    if(requiredRoles.length && !requiredRoles.includes(user.role)){
      res.status(403).json({
        success: false,
        message: 'Forbidden access!',
        statusCode: 403,
        data: null,
      });
      return;
    };

    // Attach the decoded user information to the request object
    (req as any).user = decoded;

    // Proceed to the next middleware or controller function
    next();

    }catch(error:any){
      // Handle any token verification or unexpected server errors
      res.status(401).json({
        success:false,
        message: 'unauthorize access',
        statusCode: 401,
        data: null
      })
    }
  }
}
