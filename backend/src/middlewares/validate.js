import { AppError } from "../utils/AppError.js";
export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!parsed.success) return next(new AppError(422, "Dữ liệu không hợp lệ", parsed.error.issues.map(({ path, message }) => ({ field: path.join("."), message }))));
  req.validated = parsed.data;
  next();
};
