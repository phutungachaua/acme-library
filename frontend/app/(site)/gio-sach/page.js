"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Check, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { defaultReturnDate, maximumReturnDate, minimumReturnDate } from "@/lib/borrowDate";

export default function BookCartPage() {
  const routerQuery = useQueryClient();
  const { user } = useAuth();
  const { items, remove, removeMany, clear } = useCart();
  const [selected, setSelected] = useState([]);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);

  useEffect(() => {
    setSelected((current) => {
      const existing = current.filter((id) => items.some((item) => item.id === id));
      const additions = items.map((item) => item.id).filter((id) => !current.includes(id));
      return [...existing, ...additions];
    });
  }, [items]);

  const selectedItems = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected]);
  const borrow = useMutation({
    mutationFn: () => api("/borrow-requests/bulk", { method: "POST", body: { bookIds: selected, returnDate } }),
    onSuccess: (records) => {
      removeMany(selected);
      setSelected([]);
      routerQuery.invalidateQueries({ queryKey: ["my-borrows"] });
      toast.success(`Đã gửi yêu cầu mượn ${records.length} cuốn sách`);
    },
    onError: (error) => toast.error(error.message),
  });

  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const allSelected = items.length > 0 && selected.length === items.length;

  return <div className="shell py-10">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Mượn nhiều sách</p><h1 className="mt-2 font-serif text-4xl font-semibold">Giỏ sách của bạn</h1><p className="mt-2 text-sm text-slate-500">Chọn các cuốn muốn mượn và gửi yêu cầu cùng một lần.</p></div>
      {items.length > 0 && <button className="btn-secondary text-red-700" onClick={() => { clear(); setSelected([]); }}><Trash2 size={16} />Xóa toàn bộ</button>}
    </div>

    {!items.length ? <div className="panel mt-8 grid place-items-center px-6 py-16 text-center"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950"><ShoppingBag size={30} /></div><h2 className="mt-5 font-serif text-2xl font-semibold">Giỏ sách đang trống</h2><p className="mt-2 max-w-md text-sm text-slate-500">Hãy chọn những cuốn bạn quan tâm trong thư viện rồi quay lại đây để mượn cùng lúc.</p><Link href="/thu-vien" className="btn-primary mt-6">Khám phá thư viện</Link></div> : <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4"><label className="flex cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-emerald-700" checked={allSelected} onChange={() => setSelected(allSelected ? [] : items.map((item) => item.id))} />Chọn tất cả ({items.length})</label></div>
        <div className="divide-y">{items.map((book) => <article key={book.id} className="flex gap-4 p-4 sm:p-5">
          <input type="checkbox" aria-label={`Chọn ${book.title}`} className="mt-10 h-4 w-4 shrink-0 accent-emerald-700" checked={selected.includes(book.id)} onChange={() => toggle(book.id)} />
          <Link href={`/sach/${book.slug || book.id}`} className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-[#e9e4d8]">{book.coverUrl ? <img src={book.coverUrl} alt={`Bìa ${book.title}`} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-slate-400"><BookMarked size={28} /></span>}</Link>
          <div className="min-w-0 flex-1"><Link href={`/sach/${book.slug || book.id}`} className="font-serif text-lg font-semibold hover:text-emerald-800">{book.title}</Link><p className="mt-1 truncate text-sm text-slate-500">{book.authors.join(", ") || "Đang cập nhật tác giả"}</p><span className={`status mt-3 ${book.availableCount > 0 ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950" : "bg-red-50 text-red-700 dark:bg-red-950"}`}>{book.availableCount > 0 ? `Còn ${book.availableCount} bản` : "Đã hết bản"}</span></div>
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700" aria-label={`Xóa ${book.title} khỏi giỏ`} onClick={() => remove(book.id)}><Trash2 size={17} /></button>
        </article>)}</div>
      </section>

      <aside className="panel h-fit p-5 xl:sticky xl:top-24"><h2 className="font-serif text-2xl font-semibold">Yêu cầu mượn</h2><div className="mt-5 flex items-center justify-between border-b pb-4 text-sm"><span>Đã chọn</span><strong>{selectedItems.length} cuốn</strong></div><label className="mt-5 block"><span className="label">Ngày trả dự kiến</span><input className="input" type="date" required min={minimumReturnDate()} max={maximumReturnDate()} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /><small className="mt-2 block text-slate-500">Mặc định sau 3 ngày, áp dụng cho tất cả sách đã chọn.</small></label><p className="mt-4 text-xs leading-5 text-slate-500">Thư viện sẽ kiểm tra lại số bản sẵn sàng và giới hạn mượn trước khi gửi. Nếu một cuốn không hợp lệ, toàn bộ yêu cầu sẽ chưa được tạo để bạn dễ điều chỉnh.</p>{!user && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">Bạn cần đăng nhập trước khi gửi yêu cầu.</p>}
        {user ? <button className="btn-primary mt-5 w-full" disabled={!selected.length || !returnDate || borrow.isPending} onClick={() => borrow.mutate()}>{borrow.isPending ? "Đang gửi yêu cầu..." : <><Check size={17} />Mượn {selected.length} cuốn đã chọn</>}</button> : <Link href="/dang-nhap" className="btn-primary mt-5 w-full">Đăng nhập để mượn sách</Link>}
      </aside>
    </div>}
  </div>;
}
