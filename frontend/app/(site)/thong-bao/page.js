"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Protected from "@/components/Protected";
import { Empty, ErrorState, FetchingOverlay, Loading } from "@/components/States";
import { Pagination } from "@/components/Pagination";
import { NotificationItem, notificationHref } from "@/components/NotificationItem";

const types = [["", "Tất cả"], ["DUE_SOON", "Sắp đến hạn"], ["DUE_TODAY", "Đến hạn hôm nay"], ["OVERDUE", "Quá hạn"], ["FINE", "Phí phạt"], ["BORROW", "Mượn sách"], ["FEEDBACK_REPLY", "Phản hồi"], ["SYSTEM", "Hệ thống"]];

export default function Notifications() {
  return <Protected><NotificationsContent /></Protected>;
}

function NotificationsContent() {
  const [type, setType] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const router = useRouter();
  const query = new URLSearchParams({ page: String(page), limit: "12" });
  if (type) query.set("type", type);
  if (unreadOnly) query.set("unread", "true");
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["notifications", "page", type, unreadOnly, page],
    queryFn: () => api(`/notifications?${query.toString()}`),
    placeholderData: (previous) => previous,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const readAll = useMutation({ mutationFn: () => api("/notifications/read-all", { method: "PATCH" }), onSuccess: () => { toast.success("Đã đánh dấu tất cả là đã đọc"); refresh(); } });
  const markRead = useMutation({ mutationFn: (id) => api(`/notifications/${id}/read`, { method: "PATCH" }), onSuccess: refresh });
  const changeType = (value) => { setType(value); setPage(1); };
  const openNotification = async (notification) => {
    try { if (!notification.readAt) await markRead.mutateAsync(notification.id); } finally { router.push(notificationHref(notification)); }
  };

  return <div className="shell max-w-4xl py-10">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Luôn đúng hạn</p><h1 className="mt-2 font-serif text-4xl font-semibold">Thông báo</h1><p className="mt-2 text-sm text-slate-500">{data?.unreadCount || 0} thông báo chưa đọc</p></div>
      <button className="btn-secondary" disabled={!data?.unreadCount || readAll.isPending} onClick={() => readAll.mutate()}><CheckCheck size={17} />{readAll.isPending ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}</button>
    </div>

    <div className="mt-7 flex flex-wrap items-center gap-2">
      <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${!unreadOnly ? "bg-ink text-white" : "border bg-white dark:bg-slate-900"}`} onClick={() => { setUnreadOnly(false); setPage(1); }}>Tất cả</button>
      <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${unreadOnly ? "bg-ink text-white" : "border bg-white dark:bg-slate-900"}`} onClick={() => { setUnreadOnly(true); setPage(1); }}>Chưa đọc</button>
    </div>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">{types.map(([value, label]) => <button type="button" onClick={() => changeType(value)} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${type === value ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950" : "border bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"}`} key={value}>{label}</button>)}</div>

    <div className="relative mt-5 min-h-64" aria-busy={isFetching}>
      <FetchingOverlay show={isFetching && !isLoading} label="Đang lọc thông báo..." />
      {isLoading ? <Loading label="Đang tải thông báo..." /> : isError ? <ErrorState message="Không thể tải thông báo" retry={refetch} /> : data?.items?.length ? <div className="panel divide-y overflow-hidden p-1">{data.items.map((notification) => <NotificationItem key={notification.id} notification={notification} onClick={openNotification} />)}</div> : <Empty title={unreadOnly ? "Bạn đã đọc hết thông báo" : "Không có thông báo"} message="Thông báo về mượn sách, hạn trả và phản hồi sẽ xuất hiện tại đây." />}
    </div>
    <Pagination page={page} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || 12} onPageChange={setPage} className="mt-5 rounded-2xl border bg-white dark:bg-[#13201d]" />
  </div>;
}
