"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, BookCopy, BookOpen, Clock3, Coins, MessageSquare, Star, TrendingUp, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Empty, Loading } from "@/components/States";

const cards = [["books", "Đầu sách", BookOpen], ["copies", "Bản sách", BookCopy], ["borrowing", "Đang mượn", TrendingUp], ["overdue", "Quá hạn", Clock3], ["unpaidFine", "Phí chưa thu", Coins], ["users", "Người dùng", Users], ["feedback", "Góp ý chờ xử lý", MessageSquare], ["pendingReviews", "Đánh giá chờ duyệt", Star]];
const activityIcons = { REGISTER: UserPlus, BORROW: BookCopy, REVIEW: Star, FEEDBACK: MessageSquare };
const activityColors = { REGISTER: "bg-blue-50 text-blue-700 dark:bg-blue-950", BORROW: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950", REVIEW: "bg-amber-50 text-amber-700 dark:bg-amber-950", FEEDBACK: "bg-violet-50 text-violet-700 dark:bg-violet-950" };

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => api("/admin/dashboard/stats") });
  const { data: activity, isLoading: activityLoading } = useQuery({ queryKey: ["admin-activity"], queryFn: () => api("/admin/dashboard/activity"), refetchInterval: 30000 });

  if (isLoading) return <Loading />;
  return <>
    <p className="eyebrow">Tổng quan vận hành</p>
    <h1 className="mt-2 font-serif text-4xl font-semibold">Bảng tổng quan</h1>
    <p className="mt-2 text-sm text-slate-500">Các chỉ số và yêu cầu mới cần quản trị viên xử lý.</p>

    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([key, label, Icon]) => <div className="panel p-5" key={key}><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950"><Icon size={19} /></span><span className="text-xs font-semibold text-slate-400">Hiện tại</span></div><strong className="mt-5 block text-3xl">{key === "unpaidFine" ? `${Number(data?.[key] || 0).toLocaleString("vi-VN")}đ` : data?.[key] || 0}</strong><span className="mt-1 block text-sm text-slate-500">{label}</span></div>)}</div>

    <section className="panel mt-6 overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center sm:p-6">
        <div><h2 className="flex items-center gap-2 font-serif text-2xl font-semibold"><Bell size={22} className="text-emerald-700" />Thông báo nghiệp vụ <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" title="Đang cập nhật trực tiếp" /></h2><p className="mt-1 text-sm text-slate-500">Đăng ký, mượn sách, đánh giá và góp ý mới nhất.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/admin/muon-tra" className="status bg-emerald-50 text-emerald-800">Mượn chờ duyệt: {activity?.pending?.borrows || 0}</Link><Link href="/admin/danh-gia" className="status bg-amber-50 text-amber-800">Đánh giá: {activity?.pending?.reviews || 0}</Link><Link href="/admin/gop-y" className="status bg-violet-50 text-violet-800">Góp ý: {activity?.pending?.feedback || 0}</Link></div>
      </div>
      {activityLoading ? <Loading label="Đang tải thông báo quản trị..." /> : activity?.items?.length ? <div className="divide-y">{activity.items.map((item) => {
        const Icon = activityIcons[item.kind] || Bell;
        return <Link href={item.href} key={item.id} className="flex gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:px-6"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${activityColors[item.kind] || "bg-slate-100 text-slate-700"}`}><Icon size={18} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{item.title}</strong><span className="mt-1 block truncate text-sm text-slate-500">{item.message}</span></span><time className="shrink-0 text-xs text-slate-400" dateTime={item.createdAt}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}</time></Link>;
      })}</div> : <div className="p-5"><Empty title="Chưa có thông báo nghiệp vụ" message="Các yêu cầu mới sẽ xuất hiện tại đây." /></div>}
    </section>

    <div className="mt-6 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <section className="panel p-6"><h2 className="font-serif text-2xl font-semibold">Sách được mượn nhiều</h2><div className="mt-5 grid gap-4">{data?.topBooks.map((book, index) => <div className="flex items-center gap-3" key={book.id}><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-xs font-bold dark:bg-slate-800">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{book.title}</span><span className="text-xs text-slate-500">{book.borrowCount} lượt</span></div>)}</div></section>
      <section className="panel overflow-hidden"><div className="border-b p-6"><h2 className="font-serif text-2xl font-semibold">Quá hạn cần xử lý</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr><th className="p-4">Người mượn</th><th className="p-4">Sách</th><th className="p-4">Hạn trả</th></tr></thead><tbody>{data?.overdueList.map((item) => <tr className="border-t" key={item.id}><td className="p-4"><strong>{item.user.lastMiddleName} {item.user.firstName}</strong><small className="block text-slate-500">{item.user.email}</small></td><td className="p-4">{item.book.title}<small className="block text-slate-500">{item.bookCopy?.copyCode}</small></td><td className="p-4 font-semibold text-red-700">{new Date(item.dueDate).toLocaleDateString("vi-VN")}</td></tr>)}</tbody></table></div></section>
    </div>
  </>;
}
