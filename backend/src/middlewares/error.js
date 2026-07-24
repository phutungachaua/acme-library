import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError.js";

export function notFound(req, _res, next) { next(new AppError(404, `Không tìm thấy ${req.method} ${req.path}`)); }
export function errorHandler(error, req, res, _next) {
  req.log?.error({ err: error, requestId: req.id }, "request failed");
  let status = error.statusCode || 500;
  let message = error.message || "Lỗi hệ thống";
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { status = 409; message = "Dữ liệu đã tồn tại"; }
  if (error instanceof Prisma.PrismaClientValidationError) { status = 400; message = "Dữ liệu không hợp lệ"; }
  res.status(status).json({ success: false, message: status === 500 && process.env.NODE_ENV === "production" ? "Lỗi hệ thống" : message, errors: error.errors || [], ...(process.env.NODE_ENV !== "production" && status === 500 ? { requestId: req.id } : {}) });
}
