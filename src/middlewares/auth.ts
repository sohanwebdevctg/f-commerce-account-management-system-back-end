import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from "../prisma";

export const auth = (...requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try{

      // Extracting only the actual token from the Authorization Header
      const token = req.headers.authorization?.split(' ')[1];

      // check token
      if(!token){
        res.status(401).json({
          success: false,
          message: 'unauthorized access',
          statusCode: 401,
          data: null
        })
        return;
      }

    // JWT Secret Check
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables!');
    }

    // decoded the token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const {id, email, role} = decoded;

    // find user
    const user = await prisma.user.findUnique({
      where:{
        id: id,
      }
    });

    // check user
    if(!user){
      res.status(404).json({
        success: false,
        message: 'user not found',
        statusCode: 404,
        data: null
      });
      return;
    }

    // Has the user been soft-deleted?
    if (user.isDeleted) {
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'This account has been deleted!',
        data: null,
      });
      return;
    }

    // Is the user's status APPROVED?
    if (user.status !== 'APPROVED') {
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'User account is not approved!',
        data: null,
      });
      return;
    }

    // check roles
    if(requiredRoles.length && !requiredRoles.includes(user.role)){
      res.status(403).json({
        success: false,
        message: 'Forbidden access!',
        statusCode: 403,
        data: null,
      });
      return;
    };

    // Adding a custom user object to the request
    (req as any).user = decoded;

    // call next function
    next();

    }catch(error:any){
      res.status(401).json({
        success:false,
        message: 'unauthorize access',
        statusCode: 401,
        data: null
      })
    }
  }
}
