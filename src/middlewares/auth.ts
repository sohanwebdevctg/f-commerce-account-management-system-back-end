import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '../prisma';

// auth
export const auth = (...requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      // Extracting the token from the header
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

      if (!token) {
        res.status(401).json({ success: false, message: 'You are not authorized!' });
        return;
      }

      // Verifying the token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is missing!');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      const { id, role } = decoded;

      // Live verification from the database (Live DB Check)
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found!' });
        return;
      }

      if (user.isDeleted) {
        res.status(403).json({ success: false, message: 'Account is deleted!' });
        return;
      }

      if (user.status !== 'APPROVED') {
        res.status(403).json({ success: false, message: 'Account is not approved!' });
        return;
      }

      // Role permission check
      if (requiredRoles.length && !requiredRoles.includes(role)) {
        res.status(403).json({ success: false, message: 'Forbidden! Access denied.' });
        return;
      }

      // Adding a custom user object to the request
      (req as any).user = decoded;

      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Unauthorized access!' });
    }
  };
};