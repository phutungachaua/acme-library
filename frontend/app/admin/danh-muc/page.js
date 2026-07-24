"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { FetchingOverlay } from "@/components/States";
import { api } from "@/lib/api";

const definitions = [
  { key: "categories", title: "Thể loại", fields: [{ name: "name", label: "Tên", required: true }, { name: "description", label: "Mô tả" }], label: (x) => x.name },
  { key: "authors", title: "Tác giả", fields: [{ name: "name", label: "Tên", required: true }, { name: "bio", label: "Tiểu sử" }], label: (x) => x.name },
  { key: "publishers", title: "Nhà xuất bản", fields: [{ name: "name", label: "Tên", required: true }], label: (x) => x.name },
  { key: "locations", title: "Vị trí", fields: [{ name: "area", label: "Khu", required: true }, { name: "cabinet", label: "Tủ", required: true }, { name: "shelf", label: "Kệ", required: true }, { name: "slot", label: "Ô" }, { name: "note", label: "Ghi chú" }], label: (x) => [x.area, x.cabinet, x.shelf, x.slot].filter(Boolean).join(" · ") },
];

export default function CatalogAdmin() {
  const queryClient = useQueryClient();
  const mutate = useMutation({
    mutationFn: ({ key, id, method, body }) => api(`/admin/${key}${id ? `/${id}` : ""}`, { method, body }),
    onSuccess: () => { toast.success("Đã lưu thay đổi"); queryClient.invalidateQueries({ queryKey: ["admin-meta"] }); queryClient.invalidateQueries({ queryKey: ["admin-catalog"] }); },
    onError: (error) => toast.error(error.message),
  });
  return <>
    <p className="eyebrow">Dữ liệu nền</p>
    <h1 className="mt-2 font-serif text-4xl font-semibold">Danh mục thư viện</h1>
    <p className="mt-3 max-w-2xl text-sm text-slate-500">Quản lý thể loại, tác giả, nhà xuất bản và vị trí lưu trữ. Danh mục đang được sử dụng sẽ được bảo vệ khỏi thao tác xóa.</p>
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      {definitions.map((definition) => <CatalogSection key={definition.key} definition={definition} mutate={mutate} />)}
    </div>
  </>;
}

function CatalogSection({ definition, mutate }) {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const { data, isLoading, isFetching } = useQuery({ queryKey: ["admin-catalog", definition.key, page], queryFn: () => api(`/admin/${definition.key}?page=${page}&limit=6`), placeholderData: (previous) => previous });
  const items = data?.items || [];
  const close = () => { setEditing(null); setOpen(false); };
  const startEdit = (item) => { setEditing(item); setOpen(true); };
  const submit = (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    mutate.mutate({ key: definition.key, id: editing?.id, method: editing ? "PATCH" : "POST", body }, { onSuccess: close });
  };
  const remove = () => mutate.mutate({ key: definition.key, id: confirmItem.id, method: "DELETE" }, { onSuccess: () => setConfirmItem(null) });
  return <section className="panel relative overflow-hidden" aria-busy={isFetching}>
    <FetchingOverlay show={isFetching && !isLoading} label={`Đang tải ${definition.title.toLowerCase()}...`} />
    <div className="flex items-center justify-between border-b p-5">
      <div><h2 className="font-serif text-2xl font-semibold">{definition.title}</h2><p className="text-xs text-slate-500">{data?.pagination?.total || 0} mục</p></div>
      <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={17} />Thêm</button>
    </div>
    <div className="max-h-96 divide-y overflow-y-auto">
      {items.map((item) => <div className="flex items-center justify-between gap-3 p-4" key={item.id}>
        <div className="min-w-0"><strong className="block truncate text-sm">{definition.label(item)}</strong>{(item.description || item.bio || item.note) && <small className="block truncate text-slate-500">{item.description || item.bio || item.note}</small>}</div>
        <div className="flex shrink-0 gap-1"><button className="btn-secondary h-9 w-9 p-0" aria-label="Sửa" onClick={() => startEdit(item)}><Pencil size={15} /></button><button className="btn-secondary h-9 w-9 p-0 text-red-700" aria-label="Xóa" onClick={() => setConfirmItem(item)}><Trash2 size={15} /></button></div>
      </div>)}
      {isLoading && <p className="p-6 text-center text-sm text-slate-500">Đang tải dữ liệu...</p>}
      {!isLoading && !items.length && <p className="p-6 text-center text-sm text-slate-500">Chưa có dữ liệu.</p>}
    </div>
    <Pagination page={page} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || 6} onPageChange={setPage} />
    <Modal open={open} onClose={close} title={editing ? `Sửa ${definition.title.toLowerCase()}` : `Thêm ${definition.title.toLowerCase()}`} description="Nhập thông tin và lưu để cập nhật danh mục." size="sm">
      <form className="grid gap-4" onSubmit={submit} key={editing?.id || "new"}>
        {definition.fields.map((field) => <label key={field.name}><span className="label">{field.label}</span><input className="input" name={field.name} defaultValue={editing?.[field.name] || ""} required={field.required} /></label>)}
        <div className="mt-2 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={close}>Hủy</button><button className="btn-primary" disabled={mutate.isPending}>{mutate.isPending ? "Đang lưu..." : editing ? "Lưu cập nhật" : "Tạo mới"}</button></div>
      </form>
    </Modal>
    <ConfirmDialog open={Boolean(confirmItem)} onClose={() => setConfirmItem(null)} onConfirm={remove} busy={mutate.isPending} title={`Xóa ${definition.title.toLowerCase()}?`} description={confirmItem ? `“${definition.label(confirmItem)}” sẽ bị xóa. Hệ thống sẽ từ chối nếu mục này đang được sử dụng.` : ""} confirmText="Xóa" />
  </section>;
}
