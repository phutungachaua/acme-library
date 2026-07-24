"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { FetchingOverlay, TableEmpty } from "@/components/States";
import { api } from "@/lib/api";
import { roleLabel, statusLabel } from "@/lib/vi";

export default function Users() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();
  const { data, isFetching } = useQuery({ queryKey: ["admin-users", page], queryFn: () => api(`/admin/users?page=${page}`), placeholderData: (previous) => previous });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  const create = useMutation({ mutationFn: (body) => api("/admin/users", { method: "POST", body }), onSuccess: () => { toast.success("Đã tạo người dùng"); setOpen(false); refresh(); }, onError: (error) => toast.error(error.message) });
  const status = useMutation({ mutationFn: ({ id, value }) => api(`/admin/users/${id}/status`, { method: "PATCH", body: { status: value } }), onSuccess: () => { toast.success("Đã cập nhật tài khoản"); refresh(); }, onError: (error) => toast.error(error.message) });
  const role = useMutation({ mutationFn: ({ id, value }) => api(`/admin/users/${id}/role`, { method: "PATCH", body: { role: value } }), onSuccess: () => { toast.success("Đã cập nhật vai trò"); refresh(); }, onError: (error) => toast.error(error.message) });
  const remove = useMutation({ mutationFn: (id) => api(`/admin/users/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("Đã xóa người dùng"); refresh(); }, onError: (error) => toast.error(error.message) });
  const submit = (event) => { event.preventDefault(); create.mutate(Object.fromEntries(new FormData(event.currentTarget))); };
  return <>
    <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Thành viên</p><h1 className="mt-2 font-serif text-4xl font-semibold">Người dùng</h1></div><button className="btn-primary" onClick={() => setOpen(true)}><Plus size={17} />Tạo tài khoản</button></div>
    <Modal open={open} onClose={() => setOpen(false)} title="Tạo tài khoản" description="Tạo người dùng hoặc quản trị viên mới." size="md"><form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
      <label><span className="label">Họ và tên đệm</span><input className="input" name="lastMiddleName" required /></label>
      <label><span className="label">Tên</span><input className="input" name="firstName" required /></label>
      <label><span className="label">Địa chỉ thư điện tử</span><input className="input" type="email" name="email" required /></label>
      <label><span className="label">Số điện thoại</span><input className="input" name="phone" /></label>
      <label><span className="label">Mật khẩu tạm</span><input className="input" type="password" name="password" minLength={10} required /><small className="text-slate-500">Ít nhất 10 ký tự, có chữ hoa, chữ thường và số.</small></label>
      <label><span className="label">Vai trò</span><select className="input" name="role" defaultValue="USER"><option value="USER">Người dùng</option><option value="ADMIN">Quản trị viên</option><option value="SUPER_ADMIN">Quản trị viên cấp cao</option></select></label>
      <div className="flex justify-end gap-2 border-t pt-4 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary" disabled={create.isPending}>{create.isPending ? "Đang tạo..." : "Tạo tài khoản"}</button></div>
    </form></Modal>
    <div className="panel relative mt-8 overflow-hidden" aria-busy={isFetching}><FetchingOverlay show={isFetching} label="Đang tải người dùng..." /><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="p-4">Họ tên</th><th className="p-4">Liên hệ</th><th className="p-4">Vai trò</th><th className="p-4">Lượt mượn</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Xóa</th></tr></thead><tbody>{data?.items.map((user) => <tr className="border-t" key={user.id}><td className="p-4 font-semibold">{user.lastMiddleName} {user.firstName}</td><td className="p-4">{user.email}<small className="block text-slate-500">{user.phone}</small></td><td className="p-4"><select className="input min-w-44" value={user.role} onChange={(event) => role.mutate({ id: user.id, value: event.target.value })}><option value="USER">{roleLabel("USER")}</option><option value="ADMIN">{roleLabel("ADMIN")}</option><option value="SUPER_ADMIN">{roleLabel("SUPER_ADMIN")}</option></select></td><td className="p-4">{user._count.borrows}</td><td className="p-4"><button title={user.status === "ACTIVE" ? "Nhấn để khóa tài khoản" : "Nhấn để mở khóa tài khoản"} className={`status ${user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`} onClick={() => status.mutate({ id: user.id, value: user.status === "ACTIVE" ? "LOCKED" : "ACTIVE" })}>{statusLabel(user.status)}</button></td><td className="p-4 text-right"><button className="btn-secondary h-9 w-9 p-0 text-red-700" aria-label="Xóa người dùng" onClick={() => setDeleteTarget(user)}><Trash2 size={15} /></button></td></tr>)}{!data?.items?.length && <TableEmpty colSpan={6} message="Không có người dùng phù hợp." />}</tbody></table></div><Pagination page={page} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || 30} onPageChange={setPage} /></div>
    <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={() => remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })} busy={remove.isPending} title="Xóa người dùng?" description={deleteTarget ? `Tài khoản ${deleteTarget.email} sẽ bị khóa và đăng xuất khỏi mọi phiên. Lịch sử mượn vẫn được giữ lại.` : ""} confirmText="Xóa tài khoản" />
  </>;
}
