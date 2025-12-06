import jwt, { SignOptions } from "jsonwebtoken";

interface JwtPayload {
  id: number;
  name: string;
  email: string;
  inn: number;
  role: string;
  access: number;
}

export const createAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, process.env.NEXT_PUBLIC_JWT_SECRET!, {
    expiresIn: "15m",
  } as SignOptions);
};

export const createRefreshToken = (payload: JwtPayload) => {
  return jwt.sign(payload, process.env.NEXT_PUBLIC_JWT_SECRET!, {
    expiresIn: "7d",
  } as SignOptions);
};
