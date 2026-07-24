import { cloudinary } from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";

export const uploadBuffer = (buffer, folder) => new Promise((resolve, reject) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return reject(new AppError(503, "Cloudinary chưa được cấu hình"));
  const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image", transformation: [{ width: 1400, height: 1800, crop: "limit", quality: "auto", fetch_format: "auto" }] }, (error, result) => error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id }));
  stream.end(buffer);
});
export const destroyImage = async (publicId) => publicId && cloudinary.uploader.destroy(publicId).catch(() => null);
