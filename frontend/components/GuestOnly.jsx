"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "./States";

export default function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  if (loading) return <Loading label="Đang kiểm tra phiên đăng nhập..." />;
  if (user) return <Loading label="Bạn đã đăng nhập, đang chuyển về trang chủ..." />;
  return children;
}
