"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, total, pageSize = 10, onPageChange, className = "" }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { if (page > pages) onPageChange(pages); }, [onPageChange, page, pages]);
  if (total <= pageSize) return total ? <p className={`text-xs text-slate-500 ${className}`}>{total} mục</p> : null;
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, index) => {
    const first = Math.min(Math.max(1, current - 2), Math.max(1, pages - 4));
    return first + index;
  });
  return <nav className={`flex flex-col items-center justify-between gap-3 border-t px-4 py-4 sm:flex-row ${className}`} aria-label="Phân trang">
    <p className="text-xs text-slate-500">Hiển thị {start}–{end} trong {total} mục</p>
    <div className="flex items-center gap-1">
      <button type="button" className="btn-secondary h-9 w-9 p-0" aria-label="Trang trước" disabled={current === 1} onClick={() => onPageChange(current - 1)}><ChevronLeft size={16} /></button>
      {numbers.map((number) => <button type="button" key={number} className={number === current ? "grid h-9 min-w-9 place-items-center rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white" : "btn-secondary h-9 min-w-9 px-3"} aria-current={number === current ? "page" : undefined} onClick={() => onPageChange(number)}>{number}</button>)}
      <button type="button" className="btn-secondary h-9 w-9 p-0" aria-label="Trang sau" disabled={current === pages} onClick={() => onPageChange(current + 1)}><ChevronRight size={16} /></button>
    </div>
  </nav>;
}
