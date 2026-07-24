"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/vi";

export default function Reports() {
  const { data: borrows } = useQuery({ queryKey: ["report-borrows"], queryFn: () => api("/admin/reports/borrows") });
  const { data: fines } = useQuery({ queryKey: ["report-fines"], queryFn: () => api("/admin/reports/fines") });
  return <><p className="eyebrow">Dữ liệu vận hành</p><h1 className="mt-2 font-serif text-4xl font-semibold">Báo cáo thống kê</h1><div className="mt-8 grid gap-6 md:grid-cols-2"><section className="panel p-6"><h2 className="font-serif text-2xl font-semibold">Phiếu mượn theo trạng thái</h2><div className="mt-5 grid gap-3">{borrows?.map((item) => <div className="flex justify-between border-b pb-3" key={item.status}><span>{statusLabel(item.status)}</span><strong>{item._count}</strong></div>)}</div></section><section className="panel p-6"><h2 className="font-serif text-2xl font-semibold">Phí phạt theo trạng thái</h2><div className="mt-5 grid gap-3">{fines?.map((item) => <div className="flex justify-between border-b pb-3" key={item.status}><span>{statusLabel(item.status)}</span><strong>{Number(item._sum.finalAmount || 0).toLocaleString("vi-VN")}đ</strong></div>)}</div></section></div></>;
}
