import { AlertCircle, BookOpen, LoaderCircle } from "lucide-react";

export function Loading({ label = "Đang tải dữ liệu" }) {
  return <div className="grid min-h-64 place-items-center text-slate-500" role="status">
    <div className="flex items-center gap-2"><LoaderCircle className="animate-spin" />{label}</div>
  </div>;
}

export function FetchingOverlay({ show, label = "Đang áp dụng bộ lọc..." }) {
  if (!show) return null;
  return <div className="absolute inset-0 z-20 grid min-h-32 place-items-center rounded-2xl bg-white/75 backdrop-blur-[1px] dark:bg-[#0d1715]/75" role="status" aria-live="polite">
    <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg dark:bg-[#13201d] dark:text-slate-200">
      <LoaderCircle className="animate-spin text-emerald-700" size={18} />{label}
    </div>
  </div>;
}

export function Empty({ title = "Chưa có dữ liệu", message = "Nội dung sẽ xuất hiện tại đây khi có dữ liệu mới." }) {
  return <div className="panel grid min-h-64 place-items-center p-8 text-center"><div>
    <BookOpen className="mx-auto text-slate-400" size={36} />
    <h3 className="mt-3 font-serif text-xl font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{message}</p>
  </div></div>;
}

export function TableEmpty({ colSpan, message = "Không có bản ghi phù hợp." }) {
  return <tr><td colSpan={colSpan} className="p-10 text-center">
    <BookOpen className="mx-auto text-slate-300 dark:text-slate-600" size={30} />
    <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>
  </td></tr>;
}

export function ErrorState({ message = "Không thể tải dữ liệu", retry }) {
  return <div className="panel grid min-h-64 place-items-center p-8 text-center"><div>
    <AlertCircle className="mx-auto text-red-500" />
    <h3 className="mt-3 font-semibold">{message}</h3>
    {retry && <button className="btn-secondary mt-4" onClick={retry}>Thử lại</button>}
  </div></div>;
}
