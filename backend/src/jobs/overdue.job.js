import cron from "node-cron";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { dateOrdinal, daysLate } from "../services/borrow.service.js";
import { publishNotificationChange } from "../services/notification.service.js";

export async function processDueBorrows(now = new Date()) {
  const records = await prisma.borrowRecord.findMany({ where: { status: { in: ["BORROWING", "OVERDUE"] }, dueDate: { not: null } }, include: { book: true } });
  for (const record of records) {
    const diff = Math.round((dateOrdinal(record.dueDate) - dateOrdinal(now)) / 86400000);
    const overdueDays = daysLate(now, record.dueDate);
    if (overdueDays > 0) {
      const amount = Number(record.finePerDay) * overdueDays;
      await prisma.$transaction([
        prisma.borrowRecord.update({ where: { id: record.id }, data: { status: "OVERDUE", overdueDays, fineAmount: amount, fineStatus: "UNPAID" } }),
        prisma.fine.upsert({ where: { borrowRecordId: record.id }, update: { originalAmount: amount, finalAmount: amount }, create: { borrowRecordId: record.id, originalAmount: amount, finalAmount: amount } })
      ]);
    }
    const type = diff === 1 ? "DUE_SOON" : diff === 0 ? "DUE_TODAY" : [1,3,7].includes(overdueDays) ? "OVERDUE" : null;
    const marker = diff >= 0 ? `due-${diff}` : `overdue-${overdueDays}`;
    if (type) {
      await prisma.notification.upsert({ where: { dedupeKey: `${record.id}:${marker}` }, update: {}, create: { userId: record.userId, type, title: overdueDays ? `Sách quá hạn ${overdueDays} ngày` : diff === 1 ? "Sách sắp đến hạn" : "Sách đến hạn hôm nay", message: `${record.book.title} — hạn trả ${record.dueDate.toLocaleDateString("vi-VN")}`, dedupeKey: `${record.id}:${marker}`, data: { borrowRecordId: record.id } } });
      publishNotificationChange(record.userId, { action: "created", type });
    }
  }
}
export function startJobs() {
  if (env.CRON_ENABLED !== "true") return;
  processDueBorrows().catch(console.error);
  cron.schedule("0 0 * * *", () => processDueBorrows().catch(console.error), { timezone: "Asia/Ho_Chi_Minh" });
}
