"use client";

import { BadgeDollarSign, Bell, BookOpenCheck, Clock3, Info, MessageSquareReply, TriangleAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const typeStyles = {
  BORROW: { icon: BookOpenCheck, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950" },
  DUE_SOON: { icon: Clock3, color: "bg-amber-100 text-amber-700 dark:bg-amber-950" },
  DUE_TODAY: { icon: Clock3, color: "bg-orange-100 text-orange-700 dark:bg-orange-950" },
  OVERDUE: { icon: TriangleAlert, color: "bg-red-100 text-red-700 dark:bg-red-950" },
  FINE: { icon: BadgeDollarSign, color: "bg-rose-100 text-rose-700 dark:bg-rose-950" },
  FEEDBACK_REPLY: { icon: MessageSquareReply, color: "bg-sky-100 text-sky-700 dark:bg-sky-950" },
  SYSTEM: { icon: Info, color: "bg-slate-100 text-slate-700 dark:bg-slate-800" },
};

export function notificationHref(notification) {
  const requested = notification?.data && typeof notification.data === "object" ? notification.data.href || notification.data.url : null;
  if (typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//")) return requested;
  if (["BORROW", "DUE_SOON", "DUE_TODAY", "OVERDUE", "FINE"].includes(notification.type)) return "/lich-su-muon";
  if (notification.type === "FEEDBACK_REPLY") return "/gop-y";
  return "/thong-bao";
}

export function NotificationItem({ notification, onClick, compact = false }) {
  const config = typeStyles[notification.type] || { icon: Bell, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950" };
  const Icon = config.icon;
  return <button type="button" onClick={() => onClick(notification)} className={`group flex w-full items-start gap-3 rounded-xl text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${compact ? "px-3 py-3" : "p-4"} ${!notification.readAt ? "bg-emerald-50/70 dark:bg-emerald-950/20" : ""}`}>
    <span className={`grid shrink-0 place-items-center rounded-full ${compact ? "h-11 w-11" : "h-12 w-12"} ${config.color}`}><Icon size={compact ? 19 : 21} /></span>
    <span className="min-w-0 flex-1">
      <span className={`block text-sm leading-5 ${!notification.readAt ? "font-bold text-slate-900 dark:text-white" : "font-semibold"}`}>{notification.title}</span>
      <span className={`mt-0.5 block text-sm text-slate-600 dark:text-slate-300 ${compact ? "line-clamp-2" : "leading-6"}`}>{notification.message}</span>
      <span className={`mt-1 block text-xs font-medium ${!notification.readAt ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`}>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}</span>
    </span>
    {!notification.readAt && <span className="mt-5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" aria-label="Chưa đọc" />}
  </button>;
}
