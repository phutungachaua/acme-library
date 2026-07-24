import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return <footer className="mt-24 border-t bg-[#102c27] text-white dark:bg-[#09110f]">
    <div className="shell grid gap-10 py-12 md:grid-cols-[1.3fr_.7fr_.8fr]">
      <div><div className="flex items-center gap-3 text-xl font-black tracking-tight"><BrandLogo className="h-12 w-12 rounded-[14px] ring-1 ring-white/20" />ACME Library</div><p className="mt-4 max-w-md text-sm leading-6 text-emerald-50/70">Không gian đọc chung cho đội ngũ — sách được chọn lọc, quy trình mượn rõ ràng và tri thức luôn trong tầm tay.</p></div>
      <div><p className="text-xs font-black uppercase tracking-[.15em] text-emerald-300">Khám phá</p><div className="mt-4 grid gap-3 text-sm text-white/75"><Link className="hover:text-white" href="/thu-vien">Thư viện sách</Link><Link className="hover:text-white" href="/lich-su-muon">Lịch sử mượn</Link><Link className="hover:text-white" href="/gop-y">Gửi góp ý</Link></div></div>
      <div><p className="text-xs font-black uppercase tracking-[.15em] text-emerald-300">Liên hệ</p><div className="mt-4 grid gap-3 text-sm text-white/75"><span className="flex items-center gap-2"><MapPin size={16} />Thư viện nội bộ Acme</span><span className="flex items-center gap-2"><Mail size={16} />library@acme.local</span></div></div>
    </div>
    <div className="border-t border-white/10"><div className="shell flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 ACME Library</span><span>Đọc tốt hơn · Làm việc thông minh hơn</span></div></div>
  </footer>;
}
