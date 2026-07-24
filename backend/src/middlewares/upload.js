import multer from "multer";
import { AppError } from "../utils/AppError.js";
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
export const uploadImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => allowed.has(file.mimetype) ? cb(null, true) : cb(new AppError(415, "Chỉ hỗ trợ JPG, PNG hoặc WebP")) });
