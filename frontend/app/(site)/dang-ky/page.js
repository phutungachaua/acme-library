"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import GuestOnly from "@/components/GuestOnly";
import { AuthShell, Field } from "../dang-nhap/page";

export default function Register() {
  return <GuestOnly><RegisterForm /></GuestOnly>;
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await register(values);
      toast.success("Tài khoản đã được tạo");
      router.replace("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Gia nhập thư viện" description="Tạo tài khoản bằng email công việc của bạn.">
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3"><Field label="Họ + tên đệm" name="lastMiddleName" /><Field label="Tên" name="firstName" /></div>
      <Field label="Địa chỉ thư điện tử" name="email" type="email" />
      <Field label="Số điện thoại" name="phone" type="tel" />
      <Field label="Mật khẩu" name="password" type="password" minLength="10" />
      <p className="text-xs leading-5 text-slate-500">Tối thiểu 10 ký tự, gồm chữ hoa, chữ thường và số.</p>
      <button className="btn-primary" disabled={loading}>{loading ? "Đang tạo..." : "Tạo tài khoản"}</button>
      <p className="text-center text-sm text-slate-500">Đã có tài khoản? <Link className="font-bold text-emerald-800" href="/dang-nhap">Đăng nhập</Link></p>
    </form>
  </AuthShell>;
}
