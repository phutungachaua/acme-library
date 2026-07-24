"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { api, subscribeNotificationStream } from "@/lib/api";
import { NotificationItem, notificationHref } from "@/components/NotificationItem";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  const rootRef = useRef(null);
  const shownToastIds = useRef(new Set());
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["notifications", "preview", unreadOnly],
    queryFn: () => api(`/notifications?limit=8${unreadOnly ? "&unread=true" : ""}`),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({ mutationFn: (id) => api(`/notifications/${id}/read`, { method: "PATCH" }), onSuccess: refresh });
  const markAll = useMutation({ mutationFn: () => api("/notifications/read-all", { method: "PATCH" }), onSuccess: refresh });

  const showRealtimeToast = async () => {
    const latest = await api("/notifications?limit=1&unread=true").catch(() => null);
    const notification = latest?.items?.[0];
    if (!notification || shownToastIds.current.has(notification.id)) return;
    shownToastIds.current.add(notification.id);
    toast.custom((toastId) => <div className="w-[min(92vw,390px)] overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-[#13201d]">
      <div className="flex items-center justify-between border-b px-4 py-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><strong className="text-sm">Thông báo mới</strong></div><button type="button" className="grid h-7 w-7 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Đóng thông báo" onClick={() => toast.dismiss(toastId)}><X size={15} /></button></div>
      <NotificationItem notification={notification} compact onClick={(item) => { toast.dismiss(toastId); openNotification(item); }} />
    </div>, { position: "bottom-right", duration: 8000 });
  };

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
          await subscribeNotificationStream({ signal: controller.signal, onEvent: ({ event, data: eventData }) => {
            if (event === "connected") setRealtimeStatus("live");
            if (event === "notification") {
              setRealtimeStatus("live");
              if (eventData?.action === "created") showRealtimeToast();
              refresh();
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
  }, [queryClient]);

  const openNotification = async (notification) => {
    try { if (!notification.readAt) await markRead.mutateAsync(notification.id); } finally {
      setOpen(false);
      router.push(notificationHref(notification));
    }
  };
  const unreadCount = data?.unreadCount || 0;

  return <div className="relative" ref={rootRef}>
    <button type="button" className={`relative grid h-10 w-10 place-items-center rounded-full transition ${open ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950" : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"}`} aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <Bell size={20} />
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#f7f6f2] bg-red-600 px-1 text-[10px] font-bold leading-none text-white dark:border-[#101816]">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>

    {open && <section className="notification-popover-mobile fixed inset-x-3 top-[76px] z-50 flex w-auto flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-[#13201d] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[min(92vw,410px)]" aria-label="Danh sách thông báo">
      <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <div><h2 className="font-serif text-2xl font-semibold">Thông báo</h2><p className={`mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold ${realtimeStatus === "live" ? "text-emerald-700" : "text-amber-700"}`}><span className={`h-2 w-2 rounded-full ${realtimeStatus === "live" ? "bg-emerald-500" : "animate-pulse bg-amber-500"}`} />{realtimeStatus === "live" ? "Đang cập nhật trực tiếp" : "Đang kết nối lại"}</p></div>
        <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-950" disabled={!unreadCount || markAll.isPending} onClick={() => markAll.mutate()}>{markAll.isPending ? "Đang xử lý..." : "Đánh dấu đã đọc"}</button>
      </header>
      <div className="flex gap-2 px-4 pb-3"><button type="button" className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!unreadOnly ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setUnreadOnly(false)}>Tất cả</button><button type="button" className={`rounded-full px-3 py-1.5 text-sm font-semibold ${unreadOnly ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setUnreadOnly(true)}>Chưa đọc</button></div>
      <div className="min-h-0 flex-1 overflow-y-auto border-y p-1 sm:max-h-[60vh]" aria-busy={isFetching}>
        {isLoading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Đang tải thông báo...</div> : data?.items?.length ? data.items.map((notification) => <NotificationItem key={notification.id} notification={notification} onClick={openNotification} compact />) : <div className="grid min-h-48 place-items-center px-6 text-center"><div><BellOff className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm font-semibold">{unreadOnly ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo"}</p></div></div>}
      </div>
      <Link href="/thong-bao" className="block px-4 py-3 text-center text-sm font-bold text-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>Xem tất cả thông báo</Link>
    </section>}
  </div>;
}
