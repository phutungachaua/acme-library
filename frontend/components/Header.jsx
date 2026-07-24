"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, ShieldCheck, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ThemeToggle } from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import BrandLogo from "./BrandLogo";

const nav = [["/", "Trang chủ"], ["/thu-vien", "Thư viện"], ["/lich-su-xem", "Đã xem"], ["/lich-su-muon", "Mượn sách"], ["/gop-y", "Góp ý"]];

export default function Header() {
  const path = usePathname();
  const { user, logout, isAdmin, authBusy } = useAuth();
  const { count } = useCart();
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const close = (event) => { if (!accountRef.current?.contains(event.target)) setAccount(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f8f8f5]/95 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0e1715]/95">
    <div className="shell flex h-[72px] items-center gap-2 sm:gap-5">
      <button className="btn-secondary h-10 w-10 shrink-0 p-0 lg:hidden" aria-label={menu ? "Đóng menu" : "Mở menu"} aria-expanded={menu} onClick={() => setMenu((current) => !current)}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
      <Link href="/" className="flex shrink-0 items-center gap-2.5 text-lg font-black tracking-[-.03em]"><BrandLogo priority className="h-11 w-11 rounded-[14px] shadow-[0_8px_20px_rgba(35,42,120,.16)] ring-1 ring-slate-200" /><span className="hidden sm:inline">ACME<span className="text-emerald-700 dark:text-emerald-400"> Library</span></span></Link>
      <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">{nav.map(([href, label]) => {
        const active = href === "/" ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${active ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-emerald-300 dark:ring-slate-700" : "text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{label}</Link>;
      })}</nav>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Link href="/gio-sach" aria-label={`Giỏ sách có ${count} cuốn`} className="relative grid h-10 w-10 place-items-center rounded-xl border bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:bg-[#14211e] dark:text-slate-200"><ShoppingBag size={19} />{count > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#d84b3e] px-1 text-[10px] font-black text-white ring-2 ring-[#f8f8f5] dark:ring-[#0e1715]">{count > 99 ? "99+" : count}</span>}</Link>
        {isAdmin && <Link className="btn-primary hidden xl:inline-flex" href="/admin"><ShieldCheck size={17} />Quản trị</Link>}
        {!user ? <div className="hidden items-center gap-2 sm:flex"><Link className="btn-secondary" href="/dang-nhap">Đăng nhập</Link><Link className="btn-primary" href="/dang-ky">Đăng ký</Link></div> : <>
          <NotificationBell />
          <div className="relative" ref={accountRef}>
            <button aria-label="Mở tài khoản" className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-[#163c35] font-black text-white shadow-sm ring-2 ring-white transition hover:-translate-y-0.5 dark:ring-slate-800" onClick={() => setAccount((current) => !current)}>{user.avatarUrl ? <img src={user.avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" /> : user.firstName?.charAt(0).toUpperCase()}</button>
            {account && <div className="absolute right-0 mt-2 w-64 rounded-2xl border bg-white p-2 shadow-card dark:bg-[#14211e]"><div className="border-b px-3 py-2.5"><strong className="block truncate text-sm">{user.lastMiddleName} {user.firstName}</strong><span className="mt-0.5 block truncate text-xs text-slate-500">{user.email}</span></div><Link href="/tai-khoan" onClick={() => setAccount(false)} className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"><UserRound size={17} />Thông tin cá nhân</Link>{isAdmin && <Link href="/admin" onClick={() => setAccount(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"><ShieldCheck size={17} />Trang quản trị</Link>}<button onClick={logout} disabled={authBusy} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-red-950"><LogOut size={17} />{authBusy ? "Đang đăng xuất..." : "Đăng xuất"}</button></div>}
          </div>
        </>}
      </div>
    </div>
    {menu && <nav className="shell grid gap-1 border-t py-3 lg:hidden">{nav.map(([href, label]) => <Link key={href} href={href} onClick={() => setMenu(false)} className={`rounded-xl px-3 py-2.5 text-sm font-bold ${path === href ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950" : "hover:bg-white dark:hover:bg-slate-800"}`}>{label}</Link>)}{user && <Link href="/thong-bao" onClick={() => setMenu(false)} className="rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-white dark:hover:bg-slate-800">Tất cả thông báo</Link>}{isAdmin && <Link href="/admin" onClick={() => setMenu(false)} className="rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white">Quản trị</Link>}{!user && <div className="mt-2 flex gap-2"><Link className="btn-secondary flex-1" href="/dang-nhap">Đăng nhập</Link><Link className="btn-primary flex-1" href="/dang-ky">Đăng ký</Link></div>}</nav>}
  </header>;
}
