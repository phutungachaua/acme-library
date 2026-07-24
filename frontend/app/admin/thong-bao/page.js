"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { AdminNotificationItem, adminNotificationHref } from "@/components/AdminNotificationBell";
import { Pagination } from "@/components/Pagination";
import { Empty, FetchingOverlay, Loading } from "@/components/States";
import { api } from "@/lib/api";

const PAGE_SIZE = 10;

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-notifications", "list", page, unreadOnly],
    queryFn: () => api(`/admin/notifications?page=${page}&limit=${PAGE_SIZE}${unreadOnly ? "&unread=true" : ""}`),
    placeholderData: (previous) => previous,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  const markRead = useMutation({ mutationFn: (id) => api(`/admin/notifications/${id}/read`, { method: "PATCH" }), onSuccess: refresh });
  const markAll = useMutation({ mutationFn: () => api("/admin/notifications/read-all", { method: "PATCH" }), onSuccess: refresh });

  const changeFilter = (nextUnreadOnly) => {
    setUnreadOnly(nextUnreadOnly);
    setPage(1);
  };
  const openNotification = async (notification) => {
    try { if (!notification.readAt) await markRead.mutateAsync(notification.id); } finally {
      router.push(adminNotificationHref(notification));
    }
  };

  const unreadCount = data?.unreadCount || 0;
  const pending = data?.pending || {};
  return <>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Trung tâm cập nhật</p><h1 className="mt-2 font-serif text-4xl font-semibold">Thông báo</h1><p className="mt-2 text-sm text-slate-500">Theo dõi đăng ký, mượn sách, đánh giá và góp ý mới.</p></div>
      <button type="button" className="btn-secondary self-start" disabled={!unreadCount || markAll.isPending} onClick={() => markAll.mutate()}><CheckCheck size={17} />{markAll.isPending ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}</button>
    </div>

    <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[['Mượn sách', pending.borrows || 0], ['Đánh giá', pending.reviews || 0], ['Góp ý', pending.feedback || 0], ['Chưa đọc', unreadCount]].map(([label, value]) => <div className="panel p-4" key={label}><strong className="text-2xl">{value}</strong><p className="mt-1 text-xs font-semibold text-slate-500">{label}</p></div>)}
    </section>

    <section className="panel relative mt-6 overflow-hidden" aria-busy={isFetching}>
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex gap-2"><button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${!unreadOnly ? "bg-blue-100 text-blue-800 dark:bg-blue-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => changeFilter(false)}>Tất cả</button><button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${unreadOnly ? "bg-blue-100 text-blue-800 dark:bg-blue-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => changeFilter(true)}>Chưa đọc {unreadCount > 0 ? `(${unreadCount})` : ""}</button></div>
        <span className="hidden text-xs text-slate-500 sm:block">Mới nhất trước</span>
      </header>
      <div className="relative min-h-72 p-1">
        <FetchingOverlay show={isFetching && !isLoading} label="Đang tải thông báo..." />
        {isLoading ? <Loading /> : data?.items?.length ? <div className="divide-y">{data.items.map((notification) => <AdminNotificationItem key={notification.id} notification={notification} onClick={openNotification} />)}</div> : <div className="grid min-h-72 place-items-center"><Empty title={unreadOnly ? "Không còn thông báo chưa đọc" : "Chưa có thông báo"} message={unreadOnly ? "Bạn đã xem hết các cập nhật mới." : "Thông báo nghiệp vụ mới sẽ xuất hiện tại đây."} /></div>}
      </div>
      <Pagination page={page} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || PAGE_SIZE} onPageChange={setPage} />
    </section>
  </>;
}
