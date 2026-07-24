import { Router } from "express";
import sanitizeHtml from "sanitize-html";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middlewares/auth.js";
import { uploadImage } from "../middlewares/upload.js";
import { uploadBuffer, destroyImage } from "../services/upload.service.js";
import { feedbackSchema } from "../validators/schemas.js";
import { validate } from "../middlewares/validate.js";
import { ok, page } from "../utils/response.js";
import { publicUser } from "../utils/security.js";
import { requestBorrow, requestBorrowMany } from "../services/borrow.service.js";
import { AppError } from "../utils/AppError.js";
import { publishAdminActivity, publishNotificationChange, subscribeToNotificationChanges } from "../services/notification.service.js";

export const userRouter = Router();
userRouter.use(requireAuth);
userRouter.get("/me", (req, res) => ok(res, publicUser(req.user)));
userRouter.patch("/me", async (req, res) => { const allowed = ["lastMiddleName", "firstName", "phone", "zaloPhone", "zaloId", "theme", "emailNotifications"]; const data = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, typeof req.body[key] === "string" ? sanitizeHtml(req.body[key], { allowedTags: [] }).trim() : req.body[key]])); return ok(res, publicUser(await prisma.user.update({ where: { id: req.user.id }, data })), "Đã cập nhật hồ sơ"); });
userRouter.post("/me/avatar", uploadImage.single("image"), async (req, res) => { const image = await uploadBuffer(req.file.buffer, "acme-library/avatars"); const user = await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl: image.url, avatarPublicId: image.publicId } }); await destroyImage(req.user.avatarPublicId); return ok(res, publicUser(user), "Đã cập nhật ảnh đại diện"); });
userRouter.get("/my-borrows", async (req, res) => ok(res, await prisma.borrowRecord.findMany({ where: { userId: req.user.id }, include: { book: { select: { id: true, title: true, slug: true, coverUrl: true, reviews: { where: { userId: req.user.id }, select: { id: true, rating: true, comment: true, status: true } } } }, bookCopy: { select: { copyCode: true } }, fine: true }, orderBy: { createdAt: "desc" } })));
userRouter.post("/borrow-requests", async (req, res) => {
  if (typeof req.body.bookId !== "string") throw new AppError(422, "Thiếu mã sách");
  return ok(res, await requestBorrow(req.user.id, req.body.bookId, req.body.returnDate), "Đã gửi yêu cầu mượn", 201);
});
userRouter.post("/borrow-requests/bulk", async (req, res) => {
  if (!Array.isArray(req.body.bookIds) || req.body.bookIds.some((id) => typeof id !== "string" || !id.trim())) throw new AppError(422, "Danh sách sách mượn không hợp lệ");
  const records = await requestBorrowMany(req.user.id, req.body.bookIds, req.body.returnDate);
  return ok(res, records, `Đã gửi ${records.length} yêu cầu mượn sách`, 201);
});
userRouter.patch("/reviews/:id", async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError(422, "Điểm đánh giá phải từ 1 đến 5");
  const result = await prisma.review.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { rating, comment: sanitizeHtml(String(req.body.comment || ""), { allowedTags: [] }), status: "PENDING" } });
  if (!result.count) throw new AppError(404, "Không tìm thấy đánh giá");
  return ok(res, null, "Đã cập nhật đánh giá");
});
userRouter.get("/my-fines", async (req, res) => ok(res, await prisma.fine.findMany({ where: { borrowRecord: { userId: req.user.id } }, include: { borrowRecord: { include: { book: { select: { title: true, slug: true } } } } }, orderBy: { createdAt: "desc" } })));
userRouter.get("/my-view-history", async (req, res) => ok(res, await prisma.viewHistory.findMany({ where: { userId: req.user.id }, include: { book: { include: { category: true, authors: { include: { author: true } }, copies: true, reviews: true } } }, orderBy: { lastViewedAt: "desc" }, take: 100 })));
userRouter.post("/feedback", uploadImage.single("image"), validate(feedbackSchema), async (req, res) => {
  let image = {};
  if (req.file) image = await uploadBuffer(req.file.buffer, "acme-library/feedback");
  const body = req.validated.body;
  const item = await prisma.feedback.create({ data: { userId: req.user.id, subject: body.subject, category: body.category, message: sanitizeHtml(body.message, { allowedTags: [] }), attachmentUrl: image.url, attachmentPublicId: image.publicId } });
  await publishAdminActivity({ activityId: `feedback:${item.id}`, kind: "FEEDBACK", title: "Góp ý mới", message: `${req.user.lastMiddleName} ${req.user.firstName} · ${item.subject}`, href: "/admin/gop-y" });
  return ok(res, item, "Đã gửi góp ý", 201);
});
userRouter.get("/my-feedback", async (req, res) => ok(res, await prisma.feedback.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } })));
userRouter.get("/notifications/stream", (req, res) => {
  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
  const push = (event) => res.write(`event: notification\ndata: ${JSON.stringify(event)}\n\n`);
  const unsubscribe = subscribeToNotificationChanges(req.user.id, push);
  const heartbeat = setInterval(() => res.write(`: heartbeat ${Date.now()}\n\n`), 25000);
  const lifetime = setTimeout(() => { res.write("event: reconnect\ndata: {}\n\n"); res.end(); }, 14 * 60 * 1000);
  let closed = false;
  const close = () => { if (closed) return; closed = true; clearInterval(heartbeat); clearTimeout(lifetime); unsubscribe(); };
  req.on("close", close);
  res.on("close", close);
});
userRouter.get("/notifications", async (req, res) => {
  const current = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const where = { userId: req.user.id, ...(req.query.unread === "true" ? { readAt: null } : {}), ...(req.query.type ? { type: String(req.query.type) } : {}) };
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (current - 1) * limit, take: limit }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, readAt: null } }),
  ]);
  return ok(res, { items, unreadCount, pagination: { page: current, limit, total, pages: Math.ceil(total / limit) } });
});
userRouter.patch("/notifications/read-all", async (req, res) => { await prisma.notification.updateMany({ where: { userId: req.user.id, readAt: null }, data: { readAt: new Date() } }); publishNotificationChange(req.user.id, { action: "read_all" }); return ok(res, null, "Đã đọc tất cả"); });
userRouter.patch("/notifications/:id/read", async (req, res) => { await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { readAt: new Date() } }); publishNotificationChange(req.user.id, { action: "read", notificationId: req.params.id }); return ok(res, null, "Đã đọc"); });
