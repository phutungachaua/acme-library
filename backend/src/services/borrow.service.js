import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { audit } from "./audit.service.js";
import { publishAdminActivity, publishNotificationChange } from "./notification.service.js";

const dayMs = 86400000;
const vietnamDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
export const dateOrdinal = (value) => {
  const parts = Object.fromEntries(vietnamDate.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
};
export const daysLate = (returnedAt, dueAt) => Math.max(0, Math.round((dateOrdinal(returnedAt) - dateOrdinal(dueAt)) / dayMs));
export function parseRequestedReturnDate(value, now = new Date()) {
  const today = dateOrdinal(now);
  const fallback = vietnamDate.format(new Date(today + 3 * dayMs));
  const input = value || fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) throw new AppError(422, "Ngày trả không hợp lệ");
  const parsed = new Date(`${input}T12:00:00+07:00`);
  if (Number.isNaN(parsed.getTime()) || vietnamDate.format(parsed) !== input) throw new AppError(422, "Ngày trả không hợp lệ");
  const daysFromToday = Math.round((dateOrdinal(parsed) - today) / dayMs);
  if (daysFromToday < 1) throw new AppError(422, "Ngày trả phải từ ngày mai trở đi");
  if (daysFromToday > 90) throw new AppError(422, "Ngày trả không được quá 90 ngày kể từ hôm nay");
  return parsed;
}

const activeBorrowStatuses = ["PENDING", "APPROVED", "BORROWING", "OVERDUE"];

export async function requestBorrowMany(userId, inputBookIds, returnDateInput) {
  const bookIds = [...new Set(inputBookIds)];
  const requestedReturnDate = parseRequestedReturnDate(returnDateInput);
  if (!bookIds.length || bookIds.length !== inputBookIds.length) {
    throw new AppError(422, "Danh sách sách mượn không hợp lệ hoặc có sách bị trùng");
  }
  if (bookIds.length > 20) throw new AppError(422, "Mỗi lần chỉ được gửi tối đa 20 cuốn sách");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const records = await prisma.$transaction(async (tx) => {
        const [settings, active, duplicates, books] = await Promise.all([
          tx.systemSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
          tx.borrowRecord.count({ where: { userId, status: { in: activeBorrowStatuses } } }),
          tx.borrowRecord.findMany({ where: { userId, bookId: { in: bookIds }, status: { in: activeBorrowStatuses } }, select: { bookId: true, book: { select: { title: true } } } }),
          tx.book.findMany({ where: { id: { in: bookIds }, status: "VISIBLE", deletedAt: null }, select: { id: true, title: true, copies: { where: { status: "AVAILABLE", deletedAt: null }, select: { id: true }, take: 1 } } }),
        ]);

        if (active + bookIds.length > settings.maxConcurrentBorrows) {
          const remaining = Math.max(0, settings.maxConcurrentBorrows - active);
          throw new AppError(409, `Bạn chỉ còn có thể mượn thêm ${remaining} cuốn (tối đa ${settings.maxConcurrentBorrows} cuốn cùng lúc)`);
        }
        if (duplicates.length) throw new AppError(409, `Bạn đã có yêu cầu hoặc đang mượn: ${duplicates.map((item) => item.book.title).join(", ")}`);
        if (books.length !== bookIds.length) throw new AppError(404, "Có sách không còn tồn tại hoặc đã ngừng phục vụ");
        const unavailable = books.filter((book) => !book.copies.length);
        if (unavailable.length) throw new AppError(409, `Sách hiện đã hết bản: ${unavailable.map((book) => book.title).join(", ")}`);

        return Promise.all(bookIds.map((bookId) => tx.borrowRecord.create({ data: { userId, bookId, status: "PENDING", dueDate: requestedReturnDate }, include: { book: true } })));
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      await publishAdminActivity({ activityId: `borrow:${records.map((record) => record.id).join(":")}`, kind: "BORROW", title: records.length > 1 ? `${records.length} yêu cầu mượn sách mới` : "Yêu cầu mượn sách mới", message: records.map((record) => record.book.title).join(", "), href: "/admin/muon-tra" });
      return records;
    } catch (error) {
      if (error?.code !== "P2034" || attempt === 2) throw error;
    }
  }
  throw new AppError(409, "Hệ thống đang xử lý yêu cầu mượn khác, vui lòng thử lại");
}

export async function requestBorrow(userId, bookId, returnDateInput) {
  const [record] = await requestBorrowMany(userId, [bookId], returnDateInput);
  return record;
}

export async function approveBorrow(id, requestedCopyId, req) {
  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.borrowRecord.findUnique({ where: { id }, include: { book: true } });
    if (!record || record.status !== "PENDING") throw new AppError(409, "Yêu cầu không còn ở trạng thái chờ duyệt");
    const settings = await tx.systemSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    const borrowDate = new Date();
    if (record.dueDate && dateOrdinal(record.dueDate) <= dateOrdinal(borrowDate)) throw new AppError(409, "Ngày trả người dùng đã chọn không còn phù hợp; hãy từ chối yêu cầu để người dùng tạo lại");
    const dueDate = record.dueDate || new Date(borrowDate.getTime() + (record.book.borrowDays || settings.defaultBorrowDays) * dayMs);
    const copy = await tx.bookCopy.findFirst({ where: { ...(requestedCopyId ? { id: requestedCopyId } : {}), bookId: record.bookId, status: "AVAILABLE", deletedAt: null }, orderBy: { createdAt: "asc" } });
    if (!copy) throw new AppError(409, "Không còn bản sách khả dụng");
    const claimed = await tx.bookCopy.updateMany({ where: { id: copy.id, status: "AVAILABLE" }, data: { status: "BORROWED" } });
    if (claimed.count !== 1) throw new AppError(409, "Bản sách vừa được cấp cho yêu cầu khác, vui lòng thử lại");
    const updated = await tx.borrowRecord.update({ where: { id }, data: { status: "BORROWING", bookCopyId: copy.id, borrowDate, dueDate, finePerDay: record.book.finePerDay ?? settings.defaultFinePerDay }, include: { book: true, bookCopy: true } });
    await tx.book.update({ where: { id: record.bookId }, data: { borrowCount: { increment: 1 } } });
    await tx.notification.create({ data: { userId: record.userId, type: "BORROW", title: "Yêu cầu mượn đã được duyệt", message: `Bạn nhận bản ${copy.copyCode}. Hạn trả ${dueDate.toLocaleDateString("vi-VN")}.` } });
    await audit({ req, action: "BORROW_APPROVED", entityType: "BorrowRecord", entityId: id, after: { copyCode: copy.copyCode, dueDate } }, tx);
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  publishNotificationChange(updated.userId, { action: "created" });
  return updated;
}

export async function returnBorrow(id, input, req) {
  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.borrowRecord.findUnique({ where: { id }, include: { bookCopy: true } });
    if (!record || !["BORROWING", "OVERDUE"].includes(record.status) || !record.bookCopyId) throw new AppError(409, "Phiếu mượn không thể xác nhận trả");
    const returnDate = input.returnDate ? new Date(input.returnDate) : new Date();
    const overdueDays = daysLate(returnDate, record.dueDate);
    const fineAmount = Number(record.finePerDay) * overdueDays;
    const copyStatus = input.condition === "LOST" ? "LOST" : input.condition === "DAMAGED" ? "DAMAGED" : "AVAILABLE";
    await tx.bookCopy.update({ where: { id: record.bookCopyId }, data: { status: copyStatus, conditionNote: input.conditionNote || null } });
    const updated = await tx.borrowRecord.update({ where: { id }, data: { returnDate, returnCondition: input.condition, overdueDays, fineAmount, fineStatus: fineAmount > 0 ? "UNPAID" : "NONE", status: input.condition === "LOST" ? "LOST" : "RETURNED", adminNote: input.adminNote || null } });
    if (fineAmount > 0) {
      await tx.fine.upsert({ where: { borrowRecordId: id }, update: { originalAmount: fineAmount, finalAmount: fineAmount, status: "UNPAID" }, create: { borrowRecordId: id, originalAmount: fineAmount, finalAmount: fineAmount } });
      await tx.notification.upsert({ where: { dedupeKey: `fine:${id}` }, update: { title: "Phí phạt quá hạn", message: `Bạn có phí phạt ${fineAmount.toLocaleString("vi-VN")}đ cho lượt mượn quá hạn.` }, create: { userId: record.userId, type: "FINE", title: "Phí phạt quá hạn", message: `Bạn có phí phạt ${fineAmount.toLocaleString("vi-VN")}đ cho lượt mượn quá hạn.`, dedupeKey: `fine:${id}`, data: { borrowRecordId: id } } });
    }
    await audit({ req, action: "BORROW_RETURNED", entityType: "BorrowRecord", entityId: id, after: { returnDate, overdueDays, fineAmount, copyStatus } }, tx);
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (Number(updated.fineAmount) > 0) publishNotificationChange(updated.userId, { action: "created", type: "FINE" });
  return updated;
}
