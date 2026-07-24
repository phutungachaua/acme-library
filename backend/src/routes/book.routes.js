import { Router } from "express";
import sanitizeHtml from "sanitize-html";
import { prisma } from "../config/prisma.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { reviewSchema } from "../validators/schemas.js";
import { AppError } from "../utils/AppError.js";
import { ok, page } from "../utils/response.js";
import { requestBorrow } from "../services/borrow.service.js";
import { publishAdminActivity } from "../services/notification.service.js";

export const bookRouter = Router();
const bookInclude = { category: true, publisher: true, authors: { include: { author: true } }, copies: { where: { deletedAt: null }, select: { status: true, location: true } }, reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } };
bookRouter.get("/", async (req, res) => {
  const current = Math.max(1, Number(req.query.page) || 1), limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const search = String(req.query.search || "").trim();
  const where = { status: "VISIBLE", deletedAt: null, ...(req.query.category ? { category: { slug: String(req.query.category) } } : {}), ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { authors: { some: { author: { name: { contains: search, mode: "insensitive" } } } } }] } : {}), ...(req.query.availability === "available" ? { copies: { some: { status: "AVAILABLE", deletedAt: null } } } : {}) };
  const orderBy = req.query.sort === "popular" ? { borrowCount: "desc" } : req.query.sort === "title" ? { title: "asc" } : { createdAt: "desc" };
  const [items, total] = await prisma.$transaction([prisma.book.findMany({ where, include: bookInclude, orderBy, skip: (current - 1) * limit, take: limit }), prisma.book.count({ where })]);
  return page(res, items.map(summarizeBook), total, current, limit);
});
bookRouter.get("/:id", optionalAuth, async (req, res) => {
  const book = await prisma.book.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }], status: "VISIBLE", deletedAt: null }, include: { ...bookInclude, reviews: { where: { status: "PUBLISHED" }, include: { user: { select: { firstName: true, lastMiddleName: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" } } } });
  if (!book) throw new AppError(404, "Không tìm thấy sách");
  return ok(res, summarizeBook(book, true));
});
bookRouter.get("/:id/reviews", async (req, res) => ok(res, await prisma.review.findMany({ where: { bookId: req.params.id, status: "PUBLISHED" }, include: { user: { select: { firstName: true, lastMiddleName: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" } })));
bookRouter.post("/:id/view", requireAuth, async (req, res) => ok(res, await prisma.viewHistory.upsert({ where: { userId_bookId: { userId: req.user.id, bookId: req.params.id } }, create: { userId: req.user.id, bookId: req.params.id }, update: { lastViewedAt: new Date(), viewCount: { increment: 1 } } }), "Đã ghi nhận"));
bookRouter.post("/:id/borrow", requireAuth, async (req, res) => ok(res, await requestBorrow(req.user.id, req.params.id, req.body.returnDate), "Đã gửi yêu cầu mượn", 201));
bookRouter.post("/:id/reviews", requireAuth, validate(reviewSchema), async (req, res) => {
  const eligible = await prisma.borrowRecord.findFirst({ where: { userId: req.user.id, bookId: req.params.id, status: "RETURNED" } });
  if (!eligible) throw new AppError(403, "Bạn chỉ có thể đánh giá sau khi đã trả sách");
  const settings = await prisma.systemSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const body = req.validated.body;
  const review = await prisma.review.upsert({ where: { userId_bookId: { userId: req.user.id, bookId: req.params.id } }, create: { userId: req.user.id, bookId: req.params.id, rating: body.rating, comment: sanitizeHtml(body.comment || "", { allowedTags: [], allowedAttributes: {} }), status: settings.requireReviewApproval ? "PENDING" : "PUBLISHED" }, update: { rating: body.rating, comment: sanitizeHtml(body.comment || "", { allowedTags: [], allowedAttributes: {} }), status: settings.requireReviewApproval ? "PENDING" : "PUBLISHED" } });
  await publishAdminActivity({ activityId: `review:${review.id}:${review.updatedAt.toISOString()}`, kind: "REVIEW", title: "Đánh giá sách mới", message: `${req.user.lastMiddleName} ${req.user.firstName} · ${body.rating} sao`, href: "/admin/danh-gia" });
  return ok(res, review, "Đánh giá đã được lưu", 201);
});
function summarizeBook(book, detail = false) {
  const availableCount = book.copies.filter((c) => c.status === "AVAILABLE").length;
  const ratings = book.reviews.map((r) => r.rating);
  const result = { ...book, availableCount, totalCopies: book.copies.length, ratingAverage: ratings.length ? Math.round(ratings.reduce((a,b) => a+b, 0) / ratings.length * 10) / 10 : 0, ratingCount: ratings.length };
  if (!detail) { delete result.editorialReview; delete result.highlights; delete result.recommendedFor; delete result.excerpt; }
  return result;
}
