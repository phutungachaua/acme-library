"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Protected from "@/components/Protected";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { roleLabel } from "@/lib/vi";

export default function Profile() {
  return <Protected><Content /></Protected>;
}

function Content() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const { data: borrows } = useQuery({ queryKey: ["my-borrows"], queryFn: () => api("/my-borrows") });

  const save = useMutation({
    mutationFn: (body) => api("/me", { method: "PATCH", body }),
    onSuccess: (data) => { setUser(data); toast.success("Đã lưu hồ sơ"); },
    onError: (error) => toast.error(error.message),
  });

  const changePassword = useMutation({
    mutationFn: (body) => api("/auth/change-password", { method: "POST", body }),
    onSuccess: async () => {
      toast.success("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
      await logout();
      router.replace("/dang-nhap");
    },
    onError: (error) => toast.error(error.message),
  });

  function submitProfile(event) {
    event.preventDefault();
    save.mutate(Object.fromEntries(new FormData(event.currentTarget)));
  }

  function submitPassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    if (values.newPassword.length < 10) return toast.error("Mật khẩu mới cần ít nhất 10 ký tự");
    if (values.newPassword !== values.confirmPassword) return toast.error("Mật khẩu xác nhận chưa khớp");
    changePassword.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword });
  }

  async function avatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    try {
      const data = await api("/me/avatar", { method: "POST", body: form });
      setUser(data);
      toast.success("Đã cập nhật ảnh");
    } catch (error) {
      toast.error(error.message);
    }
  }

  const active = borrows?.filter((item) => ["BORROWING", "OVERDUE"].includes(item.status)).length || 0;
  const unpaid = borrows?.reduce((sum, item) => sum + (item.fineStatus === "UNPAID" ? Number(item.fineAmount) : 0), 0) || 0;

  return <div className="shell py-10">
    <p className="eyebrow">Tài khoản cá nhân</p>
    <h1 className="mt-2 font-serif text-4xl font-semibold">Thông tin của bạn</h1>
    <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="panel h-fit p-6 text-center">
        <label className="group relative mx-auto block h-28 w-28 cursor-pointer overflow-hidden rounded-full bg-emerald-800 text-white">
          <span className="grid h-full place-items-center text-4xl font-bold">
            {user.avatarUrl ? <img className="h-full w-full object-cover" src={user.avatarUrl} alt="Ảnh đại diện" /> : user.firstName.charAt(0)}
          </span>
          <span className="absolute inset-x-0 bottom-0 flex justify-center bg-black/60 py-2 opacity-0 transition group-hover:opacity-100"><Camera size={18} /></span>
          <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={avatar} />
        </label>
        <h2 className="mt-4 font-serif text-xl font-semibold">{user.lastMiddleName} {user.firstName}</h2>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        <span className="status mt-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950"><ShieldCheck size={14} className="mr-1" />{roleLabel(user.role)}</span>
        <div className="mt-6 grid grid-cols-2 gap-2 border-t pt-5">
          <div><strong className="text-xl">{active}</strong><span className="block text-[11px] text-slate-500">Đang mượn</span></div>
          <div><strong className="text-xl">{unpaid.toLocaleString("vi-VN")}đ</strong><span className="block text-[11px] text-slate-500">Chưa thanh toán</span></div>
        </div>
      </aside>

      <div className="grid gap-6">
        <form className="panel grid gap-5 p-6 sm:grid-cols-2" onSubmit={submitProfile}>
          <label><span className="label">Họ + tên đệm</span><input className="input" name="lastMiddleName" defaultValue={user.lastMiddleName} /></label>
          <label><span className="label">Tên</span><input className="input" name="firstName" defaultValue={user.firstName} /></label>
          <label><span className="label">Địa chỉ thư điện tử</span><input className="input bg-slate-50 dark:bg-slate-800" value={user.email} disabled /></label>
          <label><span className="label">Số điện thoại</span><input className="input" name="phone" defaultValue={user.phone || ""} /></label>
          <label><span className="label">Số Zalo</span><input className="input" name="zaloPhone" defaultValue={user.zaloPhone || ""} /></label>
          <label><span className="label">Giao diện</span><select className="input" name="theme" defaultValue={user.theme}><option value="system">Theo hệ thống</option><option value="light">Sáng</option><option value="dark">Tối</option></select></label>
          <div className="sm:col-span-2"><button className="btn-primary" disabled={save.isPending}>{save.isPending ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
        </form>

        <form className="panel grid gap-5 p-6 sm:grid-cols-2" onSubmit={submitPassword}>
          <div className="sm:col-span-2">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold"><LockKeyhole size={22} />Đổi mật khẩu</h2>
            <p className="mt-1 text-sm text-slate-500">Bạn sẽ cần đăng nhập lại sau khi đổi mật khẩu.</p>
          </div>
          <label className="sm:col-span-2"><span className="label">Mật khẩu hiện tại</span><input className="input" type="password" name="currentPassword" autoComplete="current-password" required /></label>
          <label><span className="label">Mật khẩu mới</span><input className="input" type="password" name="newPassword" minLength={10} autoComplete="new-password" required /></label>
          <label><span className="label">Nhập lại mật khẩu mới</span><input className="input" type="password" name="confirmPassword" minLength={10} autoComplete="new-password" required /></label>
          <div className="sm:col-span-2"><button className="btn-secondary" disabled={changePassword.isPending}>{changePassword.isPending ? "Đang đổi..." : "Đổi mật khẩu"}</button></div>
        </form>
      </div>
    </div>
  </div>;
}
