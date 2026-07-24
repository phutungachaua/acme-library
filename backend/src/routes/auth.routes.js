import { Router } from "express";
import argon2 from "argon2";
import { prisma } from "../config/prisma.js";
import { login, register, rotate } from "../services/auth.service.js";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { loginSchema, registerSchema } from "../validators/schemas.js";
import { cookieOptions, hashToken, publicUser } from "../utils/security.js";
import { ok } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";

export const authRouter = Router();
const setSession = (res, data) => { res.cookie("refreshToken", data.refreshToken, cookieOptions); return ok(res, { accessToken: data.accessToken, user: data.user }); };
authRouter.post("/register", validate(registerSchema), async (req, res) => setSession(res, await register(req.validated.body, req)));
authRouter.post("/login", validate(loginSchema), async (req, res) => setSession(res, await login(req.validated.body, req)));
authRouter.post("/refresh-token", async (req, res) => setSession(res, await rotate(req.cookies.refreshToken, req)));
authRouter.post("/logout", async (req, res) => { const raw = req.cookies.refreshToken; if (raw) await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(raw), revokedAt: null }, data: { revokedAt: new Date() } }); res.clearCookie("refreshToken", cookieOptions); return ok(res, null, "Đã đăng xuất"); });
authRouter.get("/me", requireAuth, (req, res) => ok(res, publicUser(req.user)));
authRouter.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== "string" || newPassword.length < 10) throw new AppError(422, "Mật khẩu mới cần ít nhất 10 ký tự");
  if (!(await argon2.verify(req.user.passwordHash, currentPassword || ""))) throw new AppError(400, "Mật khẩu hiện tại không đúng");
  await prisma.$transaction([prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await argon2.hash(newPassword) } }), prisma.refreshToken.updateMany({ where: { userId: req.user.id, revokedAt: null }, data: { revokedAt: new Date() } })]);
  res.clearCookie("refreshToken", cookieOptions); return ok(res, null, "Đã đổi mật khẩu, vui lòng đăng nhập lại");
});
