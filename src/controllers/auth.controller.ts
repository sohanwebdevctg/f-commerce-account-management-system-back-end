import { Request, Response } from 'express';
import { loginUserService } from '../services/auth.service';

// login user
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUserService(req.body);

    // Setting the token in a secure HttpOnly cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'User logged in successfully!',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
    return;
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed!',
    });
    return;
  }
};