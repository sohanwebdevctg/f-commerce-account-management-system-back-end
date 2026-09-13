import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

interface ILoginPayload {
  email: string;
  password: string;
}

// loginUserService
export const loginUserService = async (payload: ILoginPayload) => {
  const { email, password } = payload;

  // Check if it exists in the user database
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid email or password!');
  }

  // soft delete user check
  if (user.isDeleted) {
    throw new Error('Your account has been deleted. Please contact support.');
  }

  // Check live account status (must be APPROVED)
  if (user.status !== 'APPROVED') {
    throw new Error(`Your account status is ${user.status}. Access denied.`);
  }

  // password validation
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new Error('Invalid email or password!');
  }

  // Generating a secure JWT token
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables!');
}

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: '7d' }
  );

  // Excluding the password from the response
  const { password: userPassword, ...userData } = user;

  return {
    accessToken: token,
    user: userData,
  };
};