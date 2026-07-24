"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import BookCard from "@/components/BookCard";
import { Empty, ErrorState, FetchingOverlay, Loading } from "@/components/States";

export default function Library() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => api("/categories") });
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["books", search, category, sort, page],
    queryFn: () => api(`/books?page=${page}&limit=12&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&sort=${sort}`),
    placeholderData: (previous) => previous,
  });
  const changeFilter = (setter) => (event) => { setter(event.target.value); setPage(1); };

  return <div className="shell py-10 sm:py-14">
    <div className="max-w-2xl">
      <p className="eyebrow">Tủ sách chung</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-.045em] sm:text-5xl">Tìm cuốn sách tiếp theo</h1>
      <p className="mt-3 leading-7 text-slate-500">Tìm theo tên, tác giả hoặc duyệt theo chủ đề bạn đang quan tâm.</p>
    </div>

    <div className="panel mt-8 grid gap-3 p-3 shadow-card lg:grid-cols-[1fr_220px_220px]">
      <label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={19} /><input className="input pl-10" value={search} onChange={changeFilter(setSearch)} placeholder="Tên sách hoặc tác giả..." /><span className="sr-only">Tìm kiếm</span></label>
      <select className="input" value={category} onChange={changeFilter(setCategory)}><option value="">Tất cả thể loại</option>{categories?.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select>
      <select className="input" value={sort} onChange={changeFilter(setSort)}><option value="newest">Mới nhất</option><option value="popular">Mượn nhiều nhất</option><option value="title">Tên từ A đến Z</option></select>
    </div>

    <div className="mt-7 flex items-center gap-2 text-sm font-bold text-slate-500"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950"><SlidersHorizontal size={15} /></span>{data?.pagination.total || 0} đầu sách phù hợp</div>
    {isLoading ? <Loading label="Đang tải thư viện..." /> : isError ? <ErrorState retry={refetch} /> : <div className="relative min-h-64" aria-busy={isFetching}>
      <FetchingOverlay show={isFetching} />
      {data.items.length ? <>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.items.map((book) => <BookCard book={book} key={book.id} />)}</div>
        <div className="mt-10 flex justify-center gap-2"><button className="btn-secondary" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => current - 1)}>Trang trước</button><span className="grid min-w-12 place-items-center text-sm font-bold">{page}/{Math.max(1, data.pagination.pages)}</span><button className="btn-secondary" disabled={page >= data.pagination.pages || isFetching} onClick={() => setPage((current) => current + 1)}>Trang sau</button></div>
      </> : <Empty title="Không tìm thấy sách" message="Thử đổi từ khóa hoặc bộ lọc." />}
    </div>}
  </div>;
}
