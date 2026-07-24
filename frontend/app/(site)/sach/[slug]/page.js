"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Check, MapPin, ShoppingBag, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ErrorState, Loading } from "@/components/States";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Modal } from "@/components/Modal";
import { defaultReturnDate, maximumReturnDate, minimumReturnDate } from "@/lib/borrowDate";

export default function BookDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { add, has } = useCart();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const { data: book, isLoading, isError } = useQuery({ queryKey: ["book", slug], queryFn: () => api(`/books/${slug}`) });
  const inCart = book ? has(book.id) : false;
  const borrow = useMutation({
    mutationFn: (selectedReturnDate) => api(`/books/${book.id}/borrow`, { method: "POST", body: { returnDate: selectedReturnDate } }),
    onSuccess: () => {
      setBorrowOpen(false);
      toast.success("Đã gửi yêu cầu mượn sách");
      queryClient.invalidateQueries({ queryKey: ["my-borrows"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const view = () => user && api(`/books/${book.id}/view`, { method: "POST" }).catch(() => {});

  if (isLoading) return <Loading />;
  if (isError || !book) return <div className="shell py-12"><ErrorState /></div>;
  const location = book.copies?.[0]?.location;
  const available = book.availableCount > 0;

  const addToCart = () => {
    if (inCart) return router.push("/gio-sach");
    const added = add(book);
    if (added) toast.success("Đã thêm vào giỏ sách", { action: { label: "Xem giỏ", onClick: () => router.push("/gio-sach") } });
    else toast.error("Giỏ sách đã đạt tối đa 20 cuốn");
  };

  return <><div className="shell py-10" onMouseEnter={view}>
    <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
      <div><div className="sticky top-24 aspect-[4/5] overflow-hidden rounded-2xl bg-[#e9e4d8] shadow-soft">{book.coverUrl ? <img src={book.coverUrl} alt={`Bìa ${book.title}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><BookMarked size={60} className="text-slate-400" /></div>}</div></div>
      <article>
        <p className="eyebrow">{book.category.name}</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">{book.title}</h1>
        <p className="mt-3 text-lg text-slate-500">{book.authors.map((entry) => entry.author.name).join(", ")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="status bg-amber-50 text-amber-800 dark:bg-amber-950"><Star size={15} fill="currentColor" className="mr-1" />{book.ratingAverage || "Chưa có"} · {book.ratingCount} đánh giá</span>
          <span className="status bg-emerald-50 text-emerald-800 dark:bg-emerald-950"><BookMarked size={15} className="mr-1" />{book.availableCount}/{book.totalCopies} bản sẵn sàng</span>
          {location && <span className="status bg-slate-100 text-slate-700 dark:bg-slate-800"><MapPin size={15} className="mr-1" />{location.area} / {location.cabinet} / {location.shelf}</span>}
        </div>
        <p className="mt-8 text-base leading-8 text-slate-600 dark:text-slate-300">{book.shortDescription}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={!available || borrow.isPending} onClick={() => user ? setBorrowOpen(true) : router.push("/dang-nhap")}><BookMarked size={17} />{available ? "Mượn sách ngay" : "Hiện đang hết sách"}</button>
          <button className="btn-secondary" disabled={!available} onClick={addToCart}>{inCart ? <Check size={17} /> : <ShoppingBag size={17} />}{inCart ? "Đã có trong giỏ" : "Thêm vào giỏ sách"}</button>
          <span className="grid place-items-center text-sm text-slate-500">Phí quá hạn: {Number(book.finePerDay || 0).toLocaleString("vi-VN")}đ/ngày</span>
        </div>
        <div className="mt-12 grid gap-8 border-t pt-10">
          <section><h2 className="section-title">Giới thiệu từ thư viện</h2><div className="prose prose-slate mt-4 max-w-none leading-8 dark:prose-invert" dangerouslySetInnerHTML={{ __html: book.showEditorialReview && book.editorialReview || "Nội dung giới thiệu đang được biên tập." }} /></section>
          {book.highlights && <section className="panel bg-amber-50/50 p-6 dark:bg-amber-950/20"><h2 className="font-serif text-2xl font-semibold">Điểm nổi bật</h2><div className="mt-3 whitespace-pre-line leading-7">{book.highlights}</div></section>}
          {book.recommendedFor && <section><h2 className="flex items-center gap-2 font-serif text-2xl font-semibold"><Users size={23} />Cuốn sách này dành cho ai?</h2><p className="mt-3 whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">{book.recommendedFor}</p></section>}
          <section><h2 className="section-title">Đánh giá từ người đọc</h2><div className="mt-5 grid gap-3">{book.reviews.length ? book.reviews.map((review) => <div className="panel p-5" key={review.id}><div className="flex justify-between"><strong>{review.user.lastMiddleName} {review.user.firstName}</strong><span className="text-amber-600">{"★".repeat(review.rating)}</span></div><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p></div>) : <p className="text-sm text-slate-500">Chưa có đánh giá đã duyệt.</p>}</div></section>
        </div>
      </article>
    </div>
  </div><Modal open={borrowOpen} onClose={() => !borrow.isPending && setBorrowOpen(false)} title="Chọn ngày trả sách" description={book.title} size="sm" closeOnOverlay={!borrow.isPending}>
    <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); borrow.mutate(returnDate); }}>
      <label><span className="label">Ngày trả dự kiến</span><input className="input" type="date" required min={minimumReturnDate()} max={maximumReturnDate()} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /><small className="mt-2 block text-slate-500">Mặc định là 3 ngày kể từ hôm nay. Bạn có thể chọn từ ngày mai đến tối đa 90 ngày.</small></label>
      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Hạn trả dự kiến: <strong>{returnDate ? new Date(`${returnDate}T12:00:00`).toLocaleDateString("vi-VN") : "—"}</strong></div>
      <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" disabled={borrow.isPending} onClick={() => setBorrowOpen(false)}>Hủy</button><button className="btn-primary" disabled={!returnDate || borrow.isPending}>{borrow.isPending ? "Đang gửi..." : "Xác nhận mượn sách"}</button></div>
    </form>
  </Modal></>;
}
