import Link from "next/link";
import { BookMarked, MapPin, Star } from "lucide-react";

export default function BookCard({ book }) {
  const author = book.authors?.map((item) => item.author.name).join(", ") || "Đang cập nhật";
  const location = book.copies?.[0]?.location;
  const href = `/sach/${book.slug || book.id}`;
  return <article className="group overflow-hidden rounded-[22px] border bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)] transition duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-card dark:bg-[#14211e] dark:hover:border-emerald-800">
    <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-[#ebe8de] dark:bg-slate-800">
      {book.coverUrl ? <img src={book.coverUrl} alt={`Bìa ${book.title}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-400"><span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 dark:bg-slate-700"><BookMarked size={30} /></span><span className="text-lg font-black">{book.title}</span></div>}
      <span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-black shadow-sm backdrop-blur ${book.availableCount > 0 ? "bg-white/90 text-emerald-800" : "bg-slate-900/80 text-white"}`}>{book.availableCount > 0 ? `Còn ${book.availableCount} bản` : "Đang hết"}</span>
    </Link>
    <div className="p-4">
      <div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-black uppercase tracking-[.1em] text-emerald-700 dark:text-emerald-400">{book.category?.name || "Sách"}</span><span className="flex shrink-0 items-center gap-1 text-xs font-black"><Star size={14} fill="#e8a13a" className="text-amber-500" />{book.ratingAverage || "—"}<span className="font-normal text-slate-400">({book.ratingCount || 0})</span></span></div>
      <h3 className="mt-2 line-clamp-2 min-h-12 text-lg font-black leading-6 tracking-[-.02em]"><Link href={href} className="transition group-hover:text-emerald-700">{book.title}</Link></h3>
      <p className="mt-1 truncate text-sm text-slate-500">{author}</p>
      {location && <div className="mt-4 flex items-center gap-1.5 border-t pt-3 text-xs font-medium text-slate-500"><MapPin size={14} className="text-emerald-600" />{location.area} · {location.cabinet}</div>}
    </div>
  </article>;
}
