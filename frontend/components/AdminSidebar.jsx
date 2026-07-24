"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, BookCopy, BookOpen, ChevronLeft, Coins, LayoutDashboard, MessageSquare, Settings, Star, Tags, Users } from "lucide-react";
import BrandLogo from "./BrandLogo";

const groups = [
  ["Tổng quan", [["/admin", LayoutDashboard, "Bảng tổng quan"], ["/admin/thong-bao", Bell, "Thông báo"]]],
  ["Thư viện", [["/admin/sach", BookOpen, "Sách & bản sách"], ["/admin/danh-muc", Tags, "Danh mục"], ["/admin/muon-tra", BookCopy, "Mượn / trả"], ["/admin/phi-phat", Coins, "Phí quá hạn"]]],
  ["Cộng đồng", [["/admin/nguoi-dung", Users, "Người dùng"], ["/admin/danh-gia", Star, "Đánh giá"], ["/admin/gop-y", MessageSquare, "Góp ý"]]],
  ["Hệ thống", [["/admin/bao-cao", BarChart3, "Báo cáo"], ["/admin/cai-dat", Settings, "Cài đặt"]]],
];

export default function AdminSidebar() {
  const path = usePathname();
  return <aside className="hidden min-h-screen w-[272px] shrink-0 bg-[#102c27] text-slate-200 lg:block"><div className="sticky top-0 flex h-screen flex-col p-5">
    <Link href="/admin" className="mb-8 flex items-center gap-3 px-2 py-2 text-lg font-black tracking-[-.03em] text-white"><BrandLogo priority className="h-11 w-11 rounded-[14px] shadow-lg shadow-black/20" /><span>ACME <span className="text-emerald-300">Quản trị</span></span></Link>
    <div className="min-h-0 flex-1 overflow-y-auto pr-1">{groups.map(([label, items]) => <div className="mb-6" key={label}><p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.16em] text-emerald-100/35">{label}</p><nav className="grid gap-1">{items.map(([href, Icon, text]) => {
      const active = href === "/admin" ? path === href : path === href || path.startsWith(`${href}/`);
      return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? "bg-white text-[#123f37] shadow-md" : "text-emerald-50/70 hover:bg-white/10 hover:text-white"}`}><Icon size={18} strokeWidth={active ? 2.4 : 2} />{text}</Link>;
    })}</nav></div>)}</div>
    <Link href="/" className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-bold text-emerald-50/60 transition hover:bg-white/5 hover:text-white"><ChevronLeft size={16} />Về trang người đọc</Link>
  </div></aside>;
}
