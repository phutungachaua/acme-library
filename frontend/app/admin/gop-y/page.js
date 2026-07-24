"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareReply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { Empty, FetchingOverlay, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/vi";

export default function FeedbackAdmin() {
  const [page, setPage] = useState(1);
  const [replyTarget, setReplyTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
  const { data, isLoading, isFetching } = useQuery({ queryKey: ["admin-feedback", page], queryFn: () => api(`/admin/feedback?page=${page}&limit=8`), placeholderData: (previous) => previous });
  const reply = useMutation({ mutationFn: ({ id, reply: message }) => api(`/admin/feedback/${id}/reply`, { method: "PATCH", body: { reply: message } }), onSuccess: () => { toast.success("Đã phản hồi người dùng"); setReplyTarget(null); refresh(); }, onError: (error) => toast.error(error.message) });
  const status = useMutation({ mutationFn: ({ id, value }) => api(`/admin/feedback/${id}/status`, { method: "PATCH", body: { status: value } }), onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const remove = useMutation({ mutationFn: (id) => api(`/admin/feedback/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("Đã xóa góp ý"); setDeleteTarget(null); refresh(); }, onError: (error) => toast.error(error.message) });
  return <>
    <p className="eyebrow">Hộp thư</p><h1 className="mt-2 font-serif text-4xl font-semibold">Góp ý người dùng</h1>
    <div className="relative mt-8 min-h-64" aria-busy={isFetching}><FetchingOverlay show={isFetching && !isLoading} label="Đang tải góp ý..." />{isLoading ? <Loading /> : data?.items?.length ? <div className="grid gap-4">{data.items.map((item) => <article className="panel p-5" key={item.id}>
      <div className="flex justify-between gap-3"><div><span className="text-xs font-bold uppercase text-emerald-700">{item.category}</span><h2 className="mt-1 font-semibold">{item.subject}</h2><p className="text-xs text-slate-500">{item.user.lastMiddleName} {item.user.firstName} · {item.user.email}</p></div><select className="input h-fit max-w-40" value={item.status} onChange={(event) => status.mutate({ id: item.id, value: event.target.value })}><option value="NEW">{statusLabel("NEW")}</option><option value="IN_PROGRESS">{statusLabel("IN_PROGRESS")}</option><option value="RESPONDED">{statusLabel("RESPONDED")}</option><option value="CLOSED">{statusLabel("CLOSED")}</option></select></div>
      <p className="mt-4 text-sm leading-6">{item.message}</p>{item.adminReply && <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm dark:bg-emerald-950">{item.adminReply}</div>}
      <div className="mt-4 flex justify-end gap-2 border-t pt-4"><button className="btn-secondary" onClick={() => setReplyTarget(item)}><MessageSquareReply size={16} />{item.adminReply ? "Sửa phản hồi" : "Phản hồi"}</button><button className="btn-secondary text-red-700" onClick={() => setDeleteTarget(item)}><Trash2 size={16} />Xóa</button></div>
    </article>)}</div> : <Empty title="Chưa có góp ý" message="Không có góp ý nào phù hợp với bộ lọc hiện tại." />}</div>
    <Pagination page={page} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || 8} onPageChange={setPage} className="mt-5 rounded-2xl border bg-white dark:bg-[#13201d]" />
    <Modal open={Boolean(replyTarget)} onClose={() => setReplyTarget(null)} title="Phản hồi góp ý" description={replyTarget?.subject} size="md">
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); reply.mutate({ id: replyTarget.id, reply: new FormData(event.currentTarget).get("reply") }); }} key={replyTarget?.id}>
        <label><span className="label">Nội dung phản hồi</span><textarea className="input min-h-36 py-3" name="reply" defaultValue={replyTarget?.adminReply || ""} required /></label>
        <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setReplyTarget(null)}>Hủy</button><button className="btn-primary" disabled={reply.isPending}>{reply.isPending ? "Đang gửi..." : "Gửi phản hồi"}</button></div>
      </form>
    </Modal>
    <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={() => remove.mutate(deleteTarget.id)} busy={remove.isPending} title="Xóa góp ý?" description={deleteTarget ? `Góp ý “${deleteTarget.subject}” và phản hồi liên quan sẽ bị xóa.` : ""} confirmText="Xóa góp ý" />
  </>;
}
