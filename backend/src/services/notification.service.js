import { EventEmitter } from "node:events";
import { prisma } from "../config/prisma.js";

const notificationEvents = new EventEmitter();
notificationEvents.setMaxListeners(0);

export function publishNotificationChange(userId, event = {}) {
  if (userId) notificationEvents.emit(`user:${userId}`, { type: "notification_changed", at: new Date().toISOString(), ...event });
}

export function subscribeToNotificationChanges(userId, listener) {
  const channel = `user:${userId}`;
  notificationEvents.on(channel, listener);
  return () => notificationEvents.off(channel, listener);
}

export async function publishAdminActivity(event = {}) {
  const activityId = event.activityId || crypto.randomUUID();
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE", deletedAt: null }, select: { id: true } });
  if (admins.length) await prisma.notification.createMany({ data: admins.map((admin) => ({
    userId: admin.id,
    type: "SYSTEM",
    title: event.title || "Thông báo Admin mới",
    message: event.message || "Có nghiệp vụ mới cần kiểm tra",
    dedupeKey: `admin-activity:${activityId}:${admin.id}`,
    data: { adminActivity: true, kind: event.kind || "SYSTEM", href: event.href || "/admin" },
  })), skipDuplicates: true });
  notificationEvents.emit("admin:activity", { type: "admin_activity", at: new Date().toISOString(), ...event });
  return admins.length;
}

export function subscribeToAdminActivity(listener) {
  notificationEvents.on("admin:activity", listener);
  return () => notificationEvents.off("admin:activity", listener);
}

export class WebNotificationProvider {
  async send(notification, tx = prisma) {
    const created = await tx.notification.create({ data: notification });
    if (tx === prisma) publishNotificationChange(notification.userId, { notificationId: created.id });
    return created;
  }
}
export const notificationProvider = new WebNotificationProvider();
