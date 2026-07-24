"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import GuestOnly from "@/components/GuestOnly";
import BrandLogo from "@/components/BrandLogo";

export default function Login() {
  return <GuestOnly><LoginForm /></GuestOnly>;
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await login({ email: form.get("email"), password: form.get("password") });
      toast.success("Đăng nhập thành công");
      router.replace("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Chào mừng bạn trở lại" description="Đăng nhập để mượn sách và theo dõi hạn trả.">
    <form className="grid gap-4" onSubmit={submit}>
      <Field label="Địa chỉ thư điện tử" name="email" type="email" autoComplete="email" />
      <Field label="Mật khẩu" name="password" type="password" autoComplete="current-password" />
      <button className="btn-primary mt-2" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
      <p className="text-center text-sm text-slate-500">Chưa có tài khoản? <Link className="font-bold text-emerald-800" href="/dang-ky">Đăng ký</Link></p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, description, children }) {
  return <div className="shell grid min-h-[calc(100vh-4rem)] place-items-center py-12"><div className="w-full max-w-md"><div className="mb-7 text-center"><BrandLogo priority className="mx-auto h-20 w-20 rounded-[22px] shadow-card ring-1 ring-slate-200" /><h1 className="mt-5 font-serif text-3xl font-semibold">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div><div className="panel p-6 sm:p-8">{children}</div></div></div>;
}

export function Field({ label, ...props }) {
  return <label><span className="label">{label}</span><input className="input" required {...props} /></label>;
}
