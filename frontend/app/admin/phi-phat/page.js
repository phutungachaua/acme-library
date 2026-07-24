"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeDollarSign, CircleDollarSign, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { FetchingOverlay, Loading, TableEmpty } from "@/components/States";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/vi";

const actions = {
  pay: {
    title: "Xác nhận đã thu phí",
    description: "Ghi nhận khoản phí đã được thanh toán tại quầy.",
    endpoint: "mark-paid",
    submitText: "Xác nhận đã thu",
  },
  reduce: {
    title: "Giảm phí phạt",
    description: "Nhập số tiền cuối cùng người dùng cần thanh toán và lý do điều chỉnh.",
    endpoint: "reduce",
    submitText: "Áp dụng mức phí mới",
  },
  waive: {
    title: "Miễn phí phạt",
    description: "Khoản phí sẽ được miễn hoàn toàn. Vui lòng lưu lại lý do để đối soát.",
    endpoint: "waive",
    submitText: "Xác nhận miễn phí",
  },
};

export default function Fines() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const { data, isLoading, isFetching } = useQuery({ queryKey: ["fines", page], queryFn: () => api(`/admin/fines?page=${page}&limit=10`), placeholderData: (previous) => previous });
  const action = useMutation({
    mutationFn: ({ fineId, endpoint, body }) => api(`/admin/fines/${fineId}/${endpoint}`, { method: "PATCH", body }),
    onSuccess: () => {
      toast.success("Đã cập nhật phí phạt");
      setDialog(null);
      queryClient.invalidateQueries({ queryKey: ["fines"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) return <Loading />;

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const config = actions[dialog.type];
    const body = { note: String(form.get("note") || "").trim() };
    if (dialog.type === "reduce") body.amount = Number(form.get("amount"));
    action.mutate({ fineId: dialog.fine.id, endpoint: config.endpoint, body });
  };

  return <>
    <p className="eyebrow">Tài chính</p>
    <h1 className="mt-2 font-serif text-4xl font-semibold">Phí quá hạn</h1>
    <div className="panel relative mt-8 overflow-hidden" aria-busy={isFetching}>
      <FetchingOverlay show={isFetching && !isLoading} label="Đang tải phí phạt..." />
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr className="bg-slate-50 dark:bg-slate-800"><th className="p-4">Người dùng</th><th className="p-4">Sách</th><th className="p-4">Số tiền</th><th className="p-4">Trạng thái</th><th className="p-4">Xử lý</th></tr></thead>
        <tbody>{data?.items?.map((fine) => <tr className="border-t" key={fine.id}>
          <td className="p-4">{fine.borrowRecord.user.lastMiddleName} {fine.borrowRecord.user.firstName}</td>
          <td className="p-4">{fine.borrowRecord.book.title}</td>
          <td className="p-4 font-bold">{Number(fine.finalAmount).toLocaleString("vi-VN")}đ</td>
          <td className="p-4"><span className="status bg-amber-50 text-amber-800 dark:bg-amber-950">{statusLabel(fine.status)}</span></td>
          <td className="p-4"><div className="flex flex-wrap gap-2">
            <button disabled={!['UNPAID', 'REDUCED'].includes(fine.status)} className="btn-primary" onClick={() => setDialog({ type: "pay", fine })}><BadgeDollarSign size={16} />Đã thu</button>
            <button disabled={!['UNPAID', 'REDUCED'].includes(fine.status)} className="btn-secondary" onClick={() => setDialog({ type: "reduce", fine })}><CircleDollarSign size={16} />Giảm phí</button>
            <button disabled={!['UNPAID', 'REDUCED'].includes(fine.status)} className="btn-secondary" onClick={() => setDialog({ type: "waive", fine })}><HandCoins size={16} />Miễn phí</button>
          </div></td>
        </tr>)}{!data?.items?.length && <TableEmpty colSpan={5} message="Không có khoản phí phạt phù hợp." />}</tbody>
      </table></div>
      <Pagination page={page} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || 10} onPageChange={setPage} />
    </div>

    <FineActionModal dialog={dialog} onClose={() => setDialog(null)} onSubmit={submit} busy={action.isPending} />
  </>;
}

function FineActionModal({ dialog, onClose, onSubmit, busy }) {
  const config = dialog ? actions[dialog.type] : null;
  return <Modal open={Boolean(dialog)} onClose={onClose} title={config?.title} description={config?.description} size="sm">
    {dialog && <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
        <span className="block text-slate-500">Phí hiện tại</span>
        <strong className="text-lg">{Number(dialog.fine.finalAmount).toLocaleString("vi-VN")}đ</strong>
      </div>
      {dialog.type === "reduce" && <label>
        <span className="label">Số tiền sau khi giảm</span>
        <input className="input" name="amount" type="number" min="0" max={Math.max(0, Number(dialog.fine.finalAmount) - 1)} placeholder="Nhập mức phí thấp hơn hiện tại" required />
      </label>}
      <label>
        <span className="label">Ghi chú xử lý</span>
        <textarea className="input min-h-24 py-3" name="note" required placeholder="Nhập lý do hoặc thông tin đối soát..." />
      </label>
      <div className="flex justify-end gap-2 border-t pt-4">
        <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
        <button className="btn-primary" disabled={busy}>{busy ? "Đang xử lý..." : config.submitText}</button>
      </div>
    </form>}
  </Modal>;
}
