"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import BookCard from "@/components/BookCard";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({ queryKey: ["home-books"], queryFn: () => api("/books?limit=8&sort=popular") });
  const books = data?.items || [];
  const spotlight = books.slice(0, 3);

  return <>
    <section className="relative overflow-hidden bg-[#123f37] text-white">
      <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="shell relative grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-black uppercase tracking-[.12em] text-emerald-100 backdrop-blur"><Sparkles size={14} />Thư viện dành cho người thích học hỏi</div>
          <h1 className="mt-7 text-5xl font-black leading-[1.04] tracking-[-.055em] sm:text-6xl lg:text-[68px]">Tìm một cuốn sách.<br /><span className="text-[#f2b36f]">Mở ra góc nhìn mới.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-emerald-50/75 sm:text-lg">Khám phá kho sách được tuyển chọn, mượn nhiều cuốn trong một lần và theo dõi hạn trả dễ dàng.</p>
          <div className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl bg-white p-2 shadow-[0_24px_60px_rgba(0,0,0,.22)] sm:flex-row">
            <Link href="/thu-vien" className="flex min-h-12 flex-1 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-500 hover:bg-slate-50"><Search size={19} />Tìm tên sách hoặc tác giả...</Link>
            <Link href="/thu-vien" className="btn-primary shrink-0">Khám phá ngay <ArrowRight size={17} /></Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-emerald-50/75">{["Mượn sách trực tuyến", "Chọn ngày trả linh hoạt", "Nhắc hạn tự động"].map((item) => <span className="flex items-center gap-1.5" key={item}><CheckCircle2 size={16} className="text-[#f2b36f]" />{item}</span>)}</div>
        </div>

        <HeroBookStack books={spotlight} loading={isLoading} error={isError} />
      </div>
    </section>

    {user && <section className="shell pt-8"><div className="panel flex flex-col items-start justify-between gap-4 border-emerald-200 bg-white p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Clock3 size={20} /></span><div><p className="text-sm font-black">Chào {user.firstName}, hôm nay bạn muốn đọc gì?</p><p className="mt-0.5 text-sm text-slate-500">Kiểm tra sách đang mượn và các hạn trả sắp tới.</p></div></div><Link className="btn-secondary" href="/lich-su-muon">Xem sách đang mượn</Link></div></section>}

    <section className="shell py-16 sm:py-20">
      <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Được cộng đồng lựa chọn</p><h2 className="section-title mt-2">Sách đang được yêu thích</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Những tựa sách được mượn và đánh giá cao trong thư viện.</p></div><Link href="/thu-vien" className="hidden items-center gap-1.5 text-sm font-black text-emerald-700 hover:text-emerald-900 sm:flex">Xem toàn bộ <ArrowRight size={16} /></Link></div>
      {isLoading ? <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4" aria-label="Đang tải danh sách sách">{[1, 2, 3, 4].map((item) => <div className="skeleton aspect-[3/4]" key={item} />)}</div> : books.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{books.map((book) => <BookCard key={book.id} book={book} />)}</div> : <div className="panel mt-8 grid min-h-52 place-items-center p-8 text-center"><div><BookOpen className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-bold">{isError ? "Chưa thể tải danh sách sách" : "Thư viện chưa có sách nổi bật"}</p><p className="mt-1 text-sm text-slate-500">{isError ? "Vui lòng tải lại trang sau ít phút." : "Các tựa sách được yêu thích sẽ xuất hiện tại đây."}</p></div></div>}
      <Link href="/thu-vien" className="btn-secondary mt-8 w-full sm:hidden">Xem toàn bộ thư viện <ArrowRight size={16} /></Link>
    </section>

    <section className="shell pb-4"><div className="overflow-hidden rounded-[28px] bg-[#e9ded0] px-6 py-10 text-[#2d2823] sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#9b5527]">Một thói quen nhỏ</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Đọc 20 phút mỗi ngày.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#62584e]">Lưu sách vào giỏ, chọn ngày trả và bắt đầu hành trình đọc của riêng bạn.</p></div><Link href="/thu-vien" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2d2823] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-black lg:mt-0">Chọn sách ngay <ArrowRight size={17} /></Link></div></section>
  </>;
}

function HeroBookStack({ books, loading, error }) {
  const [coversReady, setCoversReady] = useState(false);
  const coverKey = books.map((book) => `${book.id}:${book.coverUrl || "none"}`).join("|");

  useEffect(() => {
    let active = true;
    setCoversReady(false);
    if (loading) return () => { active = false; };
    const urls = books.map((book) => book.coverUrl).filter(Boolean);
    if (!urls.length) {
      setCoversReady(true);
      return () => { active = false; };
    }
    Promise.all(urls.map((url) => new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = url;
      if (image.complete) resolve();
    }))).then(() => { if (active) setCoversReady(true); });
    return () => { active = false; };
  }, [coverKey, loading]);

  const ready = !loading && coversReady;
  return <div className="relative mx-auto hidden h-[460px] w-full max-w-[520px] lg:block" aria-busy={!ready}>
    <div className="absolute inset-x-8 bottom-0 h-72 rounded-[40px] bg-white/10 backdrop-blur-sm" />
    {!ready ? <HeroBooksSkeleton /> : books.length ? books.map((book, index) => <Link href={`/sach/${book.slug || book.id}`} key={book.id} style={{ animation: "fadeOnly .35s ease-out both" }} className={`absolute bottom-12 w-[210px] overflow-hidden rounded-[18px] border-[6px] border-white bg-slate-200 shadow-[0_25px_55px_rgba(0,0,0,.28)] transition hover:-translate-y-3 ${index === 0 ? "left-1/2 z-20 -translate-x-1/2 rotate-0" : index === 1 ? "left-5 z-10 -rotate-[9deg]" : "right-5 z-10 rotate-[9deg]"}`}><div className="aspect-[3/4]">{book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-[#e8e3d5] p-5 text-center text-lg font-black text-slate-700">{book.title}</div>}</div></Link>) : <div className="absolute inset-8 grid place-items-center rounded-[32px] border border-white/15 bg-white/10 text-center"><div><BookOpen size={60} className="mx-auto text-white/35" /><p className="mt-3 text-sm font-bold text-white/65">{error ? "Chưa thể tải gợi ý sách" : "Đang cập nhật sách nổi bật"}</p></div></div>}
    <div className="absolute right-0 top-8 z-30 rounded-2xl bg-[#f2b36f] p-4 text-[#312216] shadow-xl"><strong className="block text-2xl font-black">1.200+</strong><span className="text-xs font-bold">đầu sách đang chờ bạn</span></div>
  </div>;
}

function HeroBooksSkeleton() {
  return <div role="status" aria-label="Đang chuẩn bị gợi ý sách">
    {[0, 1, 2].map((index) => <div key={index} className={`absolute bottom-12 h-[292px] w-[210px] overflow-hidden rounded-[18px] border-[6px] border-white/70 bg-white/15 shadow-[0_25px_55px_rgba(0,0,0,.16)] ${index === 0 ? "left-1/2 z-20 -translate-x-1/2" : index === 1 ? "left-5 z-10 -rotate-[9deg]" : "right-5 z-10 rotate-[9deg]"}`}><div className="h-full animate-pulse bg-gradient-to-br from-white/25 via-white/10 to-white/5" /></div>)}
    <span className="sr-only">Đang tải ảnh bìa sách</span>
  </div>;
}
