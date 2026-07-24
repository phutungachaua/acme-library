"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Protected from "@/components/Protected";
import { Modal } from "@/components/Modal";
import { Empty, Loading } from "@/components/States";
import { statusLabel } from "@/lib/vi";

const colors = {
  PENDING: "bg-amber-50 text-amber-800",
  BORROWING: "bg-blue-50 text-blue-800",
  OVERDUE: "bg-red-50 text-red-800",
  RETURNED: "bg-emerald-50 text-emerald-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};
const labels = { PENDING: "Chờ duyệt", BORROWING: "Đang mượn", OVERDUE: "Quá hạn", RETURNED: "Đã trả", CANCELLED: "Đã hủy", LOST: "Đã mất" };
const reviewLabels = { PENDING: "Đang chờ duyệt", PUBLISHED: "Đã đăng", HIDDEN: "Đã ẩn" };

export default function Borrows() {
  return <Protected><BorrowContent /></Protected>;
}

function BorrowContent() {
  const queryClient = useQueryClient();
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["my-borrows"], queryFn: () => api("/my-borrows") });
  const review = useMutation({
    mutationFn: () => api(`/books/${reviewTarget.book.id}/reviews`, { method: "POST", body: { rating, comment } }),
    onSuccess: (result) => {
      toast.success(result.status === "PUBLISHED" ? "Đánh giá đã được đăng" : "Đánh giá đã được gửi và đang chờ duyệt");
      setReviewTarget(null);
      queryClient.invalidateQueries({ queryKey: ["my-borrows"] });
      queryClient.invalidateQueries({ queryKey: ["book"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const openReview = (record) => {
    const existing = record.book.reviews?.[0];
    setReviewTarget(record);
    setRating(existing?.rating || 5);
    setComment(existing?.comment || "");
  };

  if (isLoading) return <Loading label="Đang tải lịch sử mượn..." />;
  return <div className="shell py-10">
    <p className="eyebrow">Tài khoản của tôi</p>
    <h1 className="mt-2 font-serif text-4xl font-semibold">Lịch sử mượn</h1>
    <p className="mt-2 text-sm text-slate-500">Bạn có thể đánh giá sách sau khi thư viện xác nhận đã trả.</p>
    <div className="mt-8 grid gap-4">{data?.length ? data.map((record) => {
      const existingReview = record.book.reviews?.[0];
      return <article className="panel grid gap-4 p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center" key={record.id}>
        <div className="h-20 overflow-hidden rounded-lg bg-slate-100">{record.book.coverUrl && <img className="h-full w-full object-cover" src={record.book.coverUrl} alt={`Bìa ${record.book.title}`} />}</div>
        <div>
          <Link className="font-serif text-xl font-semibold" href={`/sach/${record.book.slug}`}>{record.book.title}</Link>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span>Mượn: {record.borrowDate ? format(new Date(record.borrowDate), "dd/MM/yyyy", { locale: vi }) : "Chờ duyệt"}</span><span>Hạn: {record.dueDate ? format(new Date(record.dueDate), "dd/MM/yyyy") : "—"}</span><span>Bản: {record.bookCopy?.copyCode || "—"}</span></div>
          {Number(record.fineAmount) > 0 && <p className="mt-2 text-sm font-semibold text-red-700">Phí phạt: {Number(record.fineAmount).toLocaleString("vi-VN")}đ · {statusLabel(record.fineStatus)}</p>}
          {existingReview && <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><span className="text-amber-600">{"★".repeat(existingReview.rating)}</span>{reviewLabels[existingReview.status] || statusLabel(existingReview.status)}</p>}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className={`status ${colors[record.status] || colors.CANCELLED}`}>{labels[record.status] || statusLabel(record.status)}</span>
          {record.status === "RETURNED" && <button className="btn-secondary" onClick={() => openReview(record)}><MessageSquareText size={16} />{existingReview ? "Sửa đánh giá" : "Đánh giá sách"}</button>}
        </div>
      </article>;
    }) : <Empty title="Bạn chưa mượn sách" message="Khám phá thư viện và chọn cuốn sách đầu tiên." />}</div>

    <Modal open={Boolean(reviewTarget)} onClose={() => !review.isPending && setReviewTarget(null)} title={reviewTarget?.book.reviews?.length ? "Sửa đánh giá sách" : "Đánh giá sách"} description={reviewTarget?.book.title} size="sm" closeOnOverlay={!review.isPending}>
      <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); review.mutate(); }}>
        <fieldset><legend className="label">Mức độ hài lòng</legend><div className="flex gap-2" role="radiogroup" aria-label="Chọn số sao">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} sao`} className={`grid h-11 w-11 place-items-center rounded-xl border transition ${value <= rating ? "border-amber-300 bg-amber-50 text-amber-500 dark:bg-amber-950" : "bg-white text-slate-300 dark:bg-slate-900"}`} onClick={() => setRating(value)}><Star size={23} fill={value <= rating ? "currentColor" : "none"} /></button>)}</div><p className="mt-2 text-sm font-semibold text-amber-700">{rating}/5 sao</p></fieldset>
        <label><span className="label">Nhận xét</span><textarea className="input min-h-32 py-3" maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..." /><small className="mt-1 block text-right text-slate-400">{comment.length}/2000</small></label>
        <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-800">Đánh giá có thể cần quản trị viên duyệt trước khi xuất hiện công khai trên trang sách.</p>
        <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" disabled={review.isPending} onClick={() => setReviewTarget(null)}>Hủy</button><button className="btn-primary" disabled={review.isPending}>{review.isPending ? "Đang gửi..." : "Gửi đánh giá"}</button></div>
      </form>
    </Modal>
  </div>;
}
