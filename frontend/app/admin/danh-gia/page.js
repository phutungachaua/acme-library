"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { Empty, FetchingOverlay, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/vi";

export default function Reviews() {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({ queryKey: ["admin-reviews", page], queryFn: () => api(`/admin/reviews?page=${page}&limit=8`), placeholderData: (previous) => previous });
  const act = useMutation({
    mutationFn: ({ id, action, method = "PATCH" }) => api(`/admin/reviews/${id}${action ? `/${action}` : ""}`, { method }),
    onSuccess: () => { toast.success("Đã xử lý đánh giá"); setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); },
    onError: (error) => toast.error(error.message),
  });
  return <>
    <p className="eyebrow">Kiểm duyệt nội dung</p><h1 className="mt-2 font-serif text-4xl font-semibold">Đánh giá sách</h1>
    <div className="relative mt-8 min-h-64" aria-busy={isFetching}><FetchingOverlay show={isFetching && !isLoading} label="Đang tải đánh giá..." />{isLoading ? <Loading /> : data?.items?.length ? <div className="grid gap-4">{data.items.map((review) => <article className="panel p-5" key={review.id}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row"><div><span className="text-amber-600">{"★".repeat(review.rating)}</span><h2 className="mt-1 font-semibold">{review.book.title}</h2><p className="text-xs text-slate-500">{review.user.lastMiddleName} {review.user.firstName} · {review.user.email}</p></div><span className="status h-fit bg-slate-100 text-slate-700 dark:bg-slate-800">{statusLabel(review.status)}</span></div>
      <p className="mt-4 text-sm leading-6">{review.comment || "Không có nhận xét."}</p>
      <div className="mt-4 flex gap-2 border-t pt-4"><button className="btn-primary" onClick={() => act.mutate({ id: review.id, action: "approve" })}><Check size={16} />Duyệt</button><button className="btn-secondary" onClick={() => act.mutate({ id: review.id, action: "hide" })}><EyeOff size={16} />Ẩn</button><button className="btn-secondary text-red-700" onClick={() => setDeleteTarget(review)}><Trash2 size={16} />Xóa</button></div>
    </article>)}</div> : <Empty title="Chưa có đánh giá" message="Không có đánh giá nào phù hợp với bộ lọc hiện tại." />}</div>
    <Pagination page={page} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || 8} onPageChange={setPage} className="mt-5 rounded-2xl border bg-white dark:bg-[#13201d]" />
    <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={() => act.mutate({ id: deleteTarget.id, method: "DELETE" })} busy={act.isPending} title="Xóa đánh giá?" description={deleteTarget ? `Đánh giá của ${deleteTarget.user.email} cho “${deleteTarget.book.title}” sẽ bị xóa vĩnh viễn.` : ""} confirmText="Xóa đánh giá" />
  </>;
}
