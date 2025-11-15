import jwt from "jsonwebtoken";
import config from "../config";

export function generateToken(payload: object, expiresIn?: string): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: (expiresIn || config.JWT_EXPIRES_IN) as any,
  });
}

export function generateRefreshToken(payload: object): string {
  return jwt.sign(payload, config.REFRESH_TOKEN_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, config.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
}
