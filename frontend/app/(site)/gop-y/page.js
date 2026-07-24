"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/vi";
import Protected from "@/components/Protected";

export default function Feedback() {
  return <Protected><Content /></Protected>;
}

function Content() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["feedback"], queryFn: () => api("/my-feedback") });
  const send = useMutation({
    mutationFn: (form) => api("/feedback", { method: "POST", body: form }),
    onSuccess: () => { toast.success("Góp ý đã được gửi"); queryClient.invalidateQueries({ queryKey: ["feedback"] }); },
    onError: (error) => toast.error(error.message),
  });
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate(form);
    event.currentTarget.reset();
  }
  return <div className="shell py-10"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
    <div><p className="eyebrow">Chúng tôi đang lắng nghe</p><h1 className="mt-2 font-serif text-4xl font-semibold">Hòm thư góp ý</h1><p className="mt-4 max-w-md leading-7 text-slate-500">Mọi đề xuất về sách, trải nghiệm hay quy trình thư viện đều giúp không gian đọc chung tốt hơn.</p><form className="panel mt-8 grid gap-4 p-6" onSubmit={submit}><label><span className="label">Chủ đề</span><input className="input" name="subject" required minLength={3} /></label><label><span className="label">Loại góp ý</span><select className="input" name="category"><option>Đề xuất sách</option><option>Trải nghiệm sử dụng</option><option>Báo lỗi</option><option>Khác</option></select></label><label><span className="label">Nội dung</span><textarea className="input min-h-32 py-3" name="message" required minLength={10} /></label><label className="btn-secondary cursor-pointer justify-start"><Paperclip size={17} />Đính kèm ảnh<input className="sr-only" type="file" name="image" accept="image/jpeg,image/png,image/webp" /></label><button className="btn-primary" disabled={send.isPending}>{send.isPending ? "Đang gửi..." : "Gửi góp ý"}</button></form></div>
    <div><h2 className="section-title">Góp ý đã gửi</h2><div className="mt-5 grid gap-3">{data?.map((item) => <article className="panel p-5" key={item.id}><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{item.category}</span><h3 className="mt-1 font-semibold">{item.subject}</h3></div><span className="status bg-slate-100 text-slate-700 dark:bg-slate-800">{statusLabel(item.status)}</span></div><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>{item.adminReply && <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30"><strong className="flex items-center gap-2"><MessageSquare size={16} />Phản hồi của thư viện</strong><p className="mt-2 leading-6">{item.adminReply}</p></div>}</article>)}{!data?.length && <p className="text-sm text-slate-500">Bạn chưa gửi góp ý nào.</p>}</div></div>
  </div></div>;
}
