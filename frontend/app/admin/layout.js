import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import Protected from "@/components/Protected";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNotificationBell from "@/components/AdminNotificationBell";

export default function AdminLayout({ children }) {
  return <Protected admin><div className="flex min-h-screen bg-[#f2f4f2] dark:bg-[#0e1715]">
    <AdminSidebar />
    <main className="min-w-0 flex-1 px-4 pb-12 pt-4 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="relative z-40 mb-8 flex items-center justify-between rounded-2xl border bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:bg-[#14211e]/90">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck size={19} /></span><div><strong className="block text-sm font-black">Khu vực quản trị</strong><Link href="/" className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700"><ChevronLeft size={13} />Về trang người đọc</Link></div></div>
          <AdminNotificationBell />
        </div>
        {children}
      </div>
    </main>
  </div></Protected>;
}
