import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
export const parseDuration = (value) => {
  const match = String(value).match(/^(\d+)([mhd])$/);
  if (!match) throw new Error("Invalid token duration");
  return Number(match[1]) * ({ m: 60000, h: 3600000, d: 86400000 }[match[2]]);
};
export const refreshMaxAge = parseDuration(env.REFRESH_TOKEN_EXPIRES_IN);
export const signAccessToken = (user) => jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN });
export const signRefreshToken = (user, sessionId) => jwt.sign({ sub: user.id, sid: sessionId }, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN });
export const publicUser = ({ passwordHash, ...user }) => user;
export const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: env.NODE_ENV === "production" ? "none" : "lax", path: "/api/auth", maxAge: refreshMaxAge };
