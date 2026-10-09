import prisma from "../prisma";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";

export interface ILoginPayload{
  email: string;
  password: string;
}

export const loginUserService = async (payload: ILoginPayload) => {

  // verified use data from email
  const user = await prisma.user.findUnique({
    where:{
      email: payload.email
    }
  });

  // check user email
  if(!user){
    throw new Error('Invalid email or password!');
  }

  // check user deleted
  if(user.isDeleted){
    throw new Error('Your account has been deleted. Please contact support.');
  }

  // check user status
  if(user.status !== "APPROVED"){
    throw new Error(`Your account status is ${user.status}. Access denied.`);
  }

  // check password match
  const isPasswordMatched = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordMatched) {
    throw new Error('Invalid email or password!');
  }

  // JWT Secret Check
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables!');
  }

  // Generate Access Token
  const accessToken = jwt.sign({
    id: user.id,
    email: user.email,
    role: user.role
  }, jwtSecret, { expiresIn: '7d'}
  );

  return {
    token: accessToken,
    id: user.id,
    email: user.email,
    role: user.role
  };
};
