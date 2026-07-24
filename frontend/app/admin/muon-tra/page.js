"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { FetchingOverlay, Loading, TableEmpty } from "@/components/States";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/vi";

export default function BorrowAdmin() {
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({ queryKey: ["admin-borrows", page], queryFn: () => api(`/admin/borrow-requests?page=${page}&limit=10`), placeholderData: (previous) => previous });
  const { data: approvalCopiesData, isLoading: copiesLoading } = useQuery({ queryKey: ["approval-copies", approveTarget?.bookId], queryFn: () => api(`/admin/book-copies?bookId=${approveTarget.bookId}&status=AVAILABLE&limit=100`), enabled: Boolean(approveTarget) });
  const approvalCopies = approvalCopiesData?.items || [];
  const action = useMutation({
    mutationFn: ({ path, body }) => api(path, { method: "PATCH", body }),
    onSuccess: () => { toast.success("Đã cập nhật phiếu mượn"); setApproveTarget(null); setRejectTarget(null); setReturnTarget(null); queryClient.invalidateQueries({ queryKey: ["admin-borrows"] }); queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (error) => toast.error(error.message),
  });
  if (isLoading) return <Loading />;
  return <>
    <p className="eyebrow">Vận hành</p><h1 className="mt-2 font-serif text-4xl font-semibold">Mượn / trả sách</h1>
    <div className="panel relative mt-8 overflow-hidden" aria-busy={isFetching}><FetchingOverlay show={isFetching && !isLoading} label="Đang tải phiếu mượn..." /><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr><th className="p-4">Người mượn</th><th className="p-4">Sách</th><th className="p-4">Thời gian</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{data?.items?.map((record) => <tr className="border-t" key={record.id}>
      <td className="p-4"><strong>{record.user.lastMiddleName} {record.user.firstName}</strong><small className="block text-slate-500">{record.user.email}</small></td>
      <td className="p-4"><strong>{record.book.title}</strong><small className="block font-mono text-slate-500">{record.bookCopy?.copyCode || "Chưa cấp bản"}</small></td>
      <td className="p-4 text-xs">Tạo: {new Date(record.createdAt).toLocaleDateString("vi-VN")}<br />Hạn: {record.dueDate ? new Date(record.dueDate).toLocaleDateString("vi-VN") : "—"}</td>
      <td className="p-4"><span className="status bg-slate-100 text-slate-700 dark:bg-slate-800">{statusLabel(record.status)}</span></td>
      <td className="p-4"><div className="flex justify-end gap-2">{record.status === "PENDING" && <><button title="Duyệt" className="btn-primary h-9 px-3" onClick={() => setApproveTarget(record)}><Check size={16} />Duyệt</button><button title="Từ chối" className="btn-secondary h-9 px-3 text-red-700" onClick={() => setRejectTarget(record)}><X size={16} />Từ chối</button></>}{["BORROWING", "OVERDUE"].includes(record.status) && <button className="btn-secondary" onClick={() => setReturnTarget(record)}><RotateCcw size={16} />Xác nhận trả</button>}</div></td>
    </tr>)}{!data?.items?.length && <TableEmpty colSpan={5} message="Không có phiếu mượn/trả phù hợp." />}</tbody></table></div><Pagination page={page} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || 10} onPageChange={setPage} /></div>
    <Modal open={Boolean(approveTarget)} onClose={() => setApproveTarget(null)} title="Duyệt yêu cầu mượn" description={approveTarget ? `Chọn bản vật lý cụ thể của “${approveTarget.book.title}”.` : ""} size="sm"><form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); action.mutate({ path: `/admin/borrow-requests/${approveTarget.id}/approve`, body: { copyId: new FormData(event.currentTarget).get("copyId") } }); }}>
      <label><span className="label">Bản sách cấp cho người mượn</span><select className="input" name="copyId" required defaultValue=""><option value="" disabled>{copiesLoading ? "Đang tải bản sách..." : "Chọn mã bản sách"}</option>{approvalCopies.map((copy) => <option key={copy.id} value={copy.id}>{copy.copyCode} · {[copy.location.area, copy.location.cabinet, copy.location.shelf, copy.location.slot].filter(Boolean).join(" · ")}</option>)}</select></label>
      {!copiesLoading && !approvalCopies.length && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950">Không còn bản sách khả dụng để cấp. Hãy kiểm tra lại kho bản sách.</p>}
      <div className="flex justify-end gap-2 border-t pt-4"><button type="button" className="btn-secondary" onClick={() => setApproveTarget(null)}>Hủy</button><button className="btn-primary" disabled={action.isPending || copiesLoading || !approvalCopies.length}>{action.isPending ? "Đang duyệt..." : "Duyệt và cấp bản"}</button></div>
    </form></Modal>
    <Modal open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} title="Từ chối yêu cầu mượn" description={rejectTarget?.book.title} size="sm"><form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); action.mutate({ path: `/admin/borrow-requests/${rejectTarget.id}/reject`, body: { note: new FormData(event.currentTarget).get("note") } }); }}><label><span className="label">Lý do từ chối</span><textarea className="input min-h-28 py-3" name="note" required /></label><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setRejectTarget(null)}>Hủy</button><button className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white" disabled={action.isPending}>{action.isPending ? "Đang xử lý..." : "Từ chối yêu cầu"}</button></div></form></Modal>
    <Modal open={Boolean(returnTarget)} onClose={() => setReturnTarget(null)} title="Xác nhận trả sách" description={returnTarget ? `${returnTarget.book.title} · ${returnTarget.bookCopy?.copyCode}` : ""} size="md"><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = Object.fromEntries(new FormData(event.currentTarget)); action.mutate({ path: `/admin/borrows/${returnTarget.id}/return`, body: form }); }}>
      <label><span className="label">Ngày trả thực tế</span><input className="input" type="date" name="returnDate" defaultValue={format(new Date(), "yyyy-MM-dd")} required /></label>
      <label><span className="label">Tình trạng khi trả</span><select className="input" name="condition" defaultValue="NORMAL"><option value="NORMAL">Bình thường</option><option value="MINOR_TEAR">Rách nhẹ</option><option value="DAMAGED">Hư hỏng</option><option value="LOST">Thất lạc</option></select></label>
      <label className="md:col-span-2"><span className="label">Ghi chú tình trạng bản sách</span><textarea className="input min-h-24 py-3" name="conditionNote" /></label>
      <label className="md:col-span-2"><span className="label">Ghi chú xử lý của quản trị viên</span><textarea className="input min-h-24 py-3" name="adminNote" /></label>
      <div className="flex justify-end gap-2 border-t pt-4 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setReturnTarget(null)}>Hủy</button><button className="btn-primary" disabled={action.isPending}>{action.isPending ? "Đang xác nhận..." : "Xác nhận trả sách"}</button></div>
    </form></Modal>
  </>;
}
