import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { hashToken, publicUser, refreshMaxAge, signAccessToken, signRefreshToken } from "../utils/security.js";
import { publishAdminActivity } from "./notification.service.js";

const expiry = () => new Date(Date.now() + refreshMaxAge);
export async function createSession(user, req) {
  const session = await prisma.refreshToken.create({ data: { tokenHash: `pending-${crypto.randomUUID()}`, expiresAt: expiry(), userId: user.id, userAgent: req.get("user-agent")?.slice(0, 255), ipAddress: req.ip } });
  const refreshToken = signRefreshToken(user, session.id);
  await prisma.refreshToken.update({ where: { id: session.id }, data: { tokenHash: hashToken(refreshToken) } });
  return { accessToken: signAccessToken(user), refreshToken, user: publicUser(user) };
}
export async function register(input, req) {
  const exists = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])] } });
  if (exists) throw new AppError(409, "Email hoặc số điện thoại đã được sử dụng");
  const { password, ...profile } = input;
  const user = await prisma.user.create({ data: { ...profile, passwordHash: await argon2.hash(password, { type: argon2.argon2id }) } });
  await publishAdminActivity({ activityId: `register:${user.id}`, kind: "REGISTER", title: "Đăng ký tài khoản mới", message: `${user.lastMiddleName} ${user.firstName}`, href: "/admin/nguoi-dung" });
  return createSession(user, req);
}
export async function login(input, req) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await argon2.verify(user.passwordHash, input.password))) throw new AppError(401, "Email hoặc mật khẩu không đúng");
  if (user.status !== "ACTIVE" || user.deletedAt) throw new AppError(403, "Tài khoản đã bị khóa");
  return createSession(user, req);
}
export async function rotate(rawToken, req) {
  if (!rawToken) throw new AppError(401, "Thiếu refresh token");
  let payload;
  try { payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET); } catch { throw new AppError(401, "Refresh token không hợp lệ"); }
  const session = await prisma.refreshToken.findUnique({ where: { id: payload.sid }, include: { user: true } });
  if (!session || session.tokenHash !== hashToken(rawToken) || session.revokedAt || session.expiresAt < new Date()) throw new AppError(401, "Phiên đăng nhập đã hết hạn");
  await prisma.refreshToken.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  return createSession(session.user, req);
}
