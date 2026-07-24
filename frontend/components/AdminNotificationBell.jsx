"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, BellOff, BookCopy, LoaderCircle, MessageSquare, Star, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { api, subscribeAdminActivityStream } from "@/lib/api";

const icons = { REGISTER: UserPlus, BORROW: BookCopy, REVIEW: Star, FEEDBACK: MessageSquare };
const colors = {
  REGISTER: "bg-blue-100 text-blue-700 dark:bg-blue-950",
  BORROW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950",
  REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-950",
  FEEDBACK: "bg-violet-100 text-violet-700 dark:bg-violet-950",
};

export function adminNotificationHref(notification) {
  const href = notification?.data && typeof notification.data === "object" ? notification.data.href : null;
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") ? href : "/admin/thong-bao";
}

export function AdminNotificationItem({ notification, onClick, compact = false }) {
  const kind = notification?.data?.kind;
  const Icon = icons[kind] || Bell;
  return <button type="button" onClick={() => onClick(notification)} className={`group flex w-full items-start gap-3 rounded-xl text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${compact ? "px-3 py-3" : "p-4"} ${!notification.readAt ? "bg-blue-50/80 dark:bg-blue-950/20" : ""}`}>
    <span className={`grid shrink-0 place-items-center rounded-full ${compact ? "h-11 w-11" : "h-12 w-12"} ${colors[kind] || "bg-slate-100 text-slate-700 dark:bg-slate-800"}`}><Icon size={compact ? 19 : 21} /></span>
    <span className="min-w-0 flex-1">
      <span className={`block text-sm leading-5 ${!notification.readAt ? "font-bold text-slate-950 dark:text-white" : "font-semibold"}`}>{notification.title}</span>
      <span className={`mt-0.5 block text-sm text-slate-600 dark:text-slate-300 ${compact ? "line-clamp-2" : "leading-6"}`}>{notification.message}</span>
      <time className={`mt-1 block text-xs font-medium ${!notification.readAt ? "text-blue-700 dark:text-blue-400" : "text-slate-400"}`}>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}</time>
    </span>
    {!notification.readAt && <span className="mt-5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-label="Chưa đọc" />}
  </button>;
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  const rootRef = useRef(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-notifications", "preview", unreadOnly],
    queryFn: () => api(`/admin/notifications?page=1&limit=8${unreadOnly ? "&unread=true" : ""}`),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  const markRead = useMutation({ mutationFn: (id) => api(`/admin/notifications/${id}/read`, { method: "PATCH" }), onSuccess: refresh });
  const markAll = useMutation({ mutationFn: () => api("/admin/notifications/read-all", { method: "PATCH" }), onSuccess: refresh });

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  useEffect(() => {
    let stopped = false;
    const controller = new AbortController();
    const connect = async () => {
      while (!stopped) {
        try {
          setRealtimeStatus("connecting");
          await subscribeAdminActivityStream({ signal: controller.signal, onEvent: ({ event, data: eventData }) => {
            if (event === "connected") setRealtimeStatus("live");
            if (event === "admin_activity") {
              setRealtimeStatus("live");
              refresh();
              queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
              toast.custom((toastId) => <div className="w-[min(92vw,390px)] overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-[#13201d]">
                <div className="flex items-center justify-between border-b px-4 py-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /><strong className="text-sm">Thông báo quản trị mới</strong></div><button type="button" className="grid h-7 w-7 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Đóng" onClick={() => toast.dismiss(toastId)}><X size={15} /></button></div>
                <button type="button" className="block w-full px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { toast.dismiss(toastId); router.push(eventData.href || "/admin/thong-bao"); }}><strong className="block text-sm">{eventData.title || "Có nghiệp vụ mới"}</strong><span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{eventData.message}</span></button>
              </div>, { position: "bottom-right", duration: 8000 });
            }
          } });
        } catch (error) {
          if (stopped || error.name === "AbortError") break;
        }
        if (!stopped) { setRealtimeStatus("retrying"); await new Promise((resolve) => setTimeout(resolve, 3000)); }
      }
    };
    connect();
    return () => { stopped = true; controller.abort(); };
  }, [queryClient, router]);

  const openNotification = async (notification) => {
    try { if (!notification.readAt) await markRead.mutateAsync(notification.id); } finally {
      setOpen(false);
      router.push(adminNotificationHref(notification));
    }
  };
  const unreadCount = data?.unreadCount || 0;
  const pendingCount = data?.pending?.total || 0;

  return <div className="relative" ref={rootRef}>
    <button type="button" className={`relative grid h-11 w-11 place-items-center rounded-full border transition ${open ? "border-blue-300 bg-blue-100 text-blue-800 dark:bg-blue-950" : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"}`} aria-label={`Thông báo quản trị${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <Bell size={21} />
      {unreadCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-none text-white dark:border-[#101816]">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>

    {open && <section className="notification-popover-mobile fixed inset-x-3 top-[76px] z-50 flex w-auto flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-[#13201d] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:mt-2 sm:w-[min(92vw,430px)]" aria-label="Danh sách thông báo quản trị">
      <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-4"><div><h2 className="font-serif text-2xl font-semibold">Thông báo quản trị</h2><p className={`mt-1 flex items-center gap-1.5 text-[11px] font-semibold ${realtimeStatus === "live" ? "text-emerald-700" : "text-amber-700"}`}><span className={`h-2 w-2 rounded-full ${realtimeStatus === "live" ? "bg-emerald-500" : "animate-pulse bg-amber-500"}`} />{realtimeStatus === "live" ? "Đang cập nhật trực tiếp" : "Đang kết nối lại"}</p></div><button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-950" disabled={!unreadCount || markAll.isPending} onClick={() => markAll.mutate()}>{markAll.isPending ? "Đang xử lý..." : "Đánh dấu đã đọc"}</button></header>
      <div className="flex items-center justify-between gap-3 px-4 pb-3"><div className="flex gap-2"><button type="button" className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!unreadOnly ? "bg-blue-100 text-blue-800 dark:bg-blue-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setUnreadOnly(false)}>Tất cả</button><button type="button" className={`rounded-full px-3 py-1.5 text-sm font-semibold ${unreadOnly ? "bg-blue-100 text-blue-800 dark:bg-blue-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setUnreadOnly(true)}>Chưa đọc</button></div><span className="text-xs font-semibold text-slate-500">{pendingCount} chờ xử lý</span></div>
      <div className="min-h-0 flex-1 overflow-y-auto border-y p-1 sm:max-h-[62vh]" aria-busy={isFetching}>
        {isLoading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Đang tải thông báo...</div> : data?.items?.length ? data.items.map((notification) => <AdminNotificationItem key={notification.id} notification={notification} onClick={openNotification} compact />) : <div className="grid min-h-48 place-items-center px-6 text-center"><div><BellOff className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm font-semibold">{unreadOnly ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo quản trị"}</p></div></div>}
      </div>
      <Link href="/admin/thong-bao" onClick={() => setOpen(false)} className="block px-4 py-3 text-center text-sm font-bold text-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800">Xem tất cả thông báo</Link>
    </section>}
  </div>;
}
