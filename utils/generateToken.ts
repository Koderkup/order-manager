import jwt, { SignOptions } from "jsonwebtoken";

export interface AppJwtPayload {
  id: number;
  role: string;
  email: string;
  access: number; // 0 или 1
  create_time: string;
  code: string;
  name: string;
  inn: string;
  kpp: string;
  legal_address: string;
  actual_address: string;
  active: number; // 0 или 1
  phone?: string | null;
}

export const createAccessToken = (payload: AppJwtPayload) => {
  return jwt.sign(payload, process.env.NEXT_PUBLIC_JWT_SECRET!, {
    expiresIn: "15m",
  } as SignOptions);
};

export const createRefreshToken = (payload: AppJwtPayload) => {
  return jwt.sign(payload, process.env.NEXT_PUBLIC_JWT_SECRET!, {
    expiresIn: "7d",
  } as SignOptions);
};
