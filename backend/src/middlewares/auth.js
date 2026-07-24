import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function requireAuth(req, _res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  if (!token) throw new AppError(401, "Vui lòng đăng nhập");
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await prisma.user.findFirst({ where: { id: payload.sub, status: "ACTIVE", deletedAt: null } });
    if (!user) throw new Error("inactive");
    req.user = user;
    next();
  } catch {
    throw new AppError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
  }
}

export const optionalAuth = async (req, _res, next) => {
  if (!req.headers.authorization) return next();
  return requireAuth(req, _res, next);
};
export const requireRole = (...roles) => (req, _res, next) => roles.includes(req.user?.role) ? next() : next(new AppError(403, "Bạn không có quyền thực hiện thao tác này"));
