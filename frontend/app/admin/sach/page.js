"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookPlus, Check, ChevronDown, CopyPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { FetchingOverlay, Loading, TableEmpty } from "@/components/States";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/vi";

const copyStatuses = ["AVAILABLE", "BORROWED", "RESERVED", "DAMAGED", "LOST", "INACTIVE"];

export default function BooksAdmin() {
  const queryClient = useQueryClient();
  const [bookPage, setBookPage] = useState(1);
  const [copyPage, setCopyPage] = useState(1);
  const [editingBook, setEditingBook] = useState(null);
  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [relationValues, setRelationValues] = useState({ authorIds: [], categoryId: "", publisherId: "" });
  const [quickEntity, setQuickEntity] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [editingCopy, setEditingCopy] = useState(null);
  const [copyFormOpen, setCopyFormOpen] = useState(false);
  const [copyToDelete, setCopyToDelete] = useState(null);
  const [copyLocationId, setCopyLocationId] = useState("");

  const { data, isLoading, isFetching: booksFetching } = useQuery({ queryKey: ["admin-books", bookPage], queryFn: () => api(`/admin/books?page=${bookPage}`), placeholderData: (previous) => previous });
  const { data: bookOptionsData } = useQuery({ queryKey: ["admin-books", "options"], queryFn: () => api("/admin/books?limit=100") });
  const { data: meta } = useQuery({ queryKey: ["admin-meta"], queryFn: () => api("/admin/metadata") });
  const { data: copiesData, isFetching: copiesFetching } = useQuery({ queryKey: ["admin-copies", selectedBookId, copyPage], queryFn: () => api(`/admin/book-copies?page=${copyPage}&limit=10${selectedBookId ? `&bookId=${selectedBookId}` : ""}`), placeholderData: (previous) => previous });
  const copies = copiesData?.items || [];

  const refreshBooks = () => queryClient.invalidateQueries({ queryKey: ["admin-books"] });
  const refreshCopies = () => queryClient.invalidateQueries({ queryKey: ["admin-copies"] });
  const saveBook = useMutation({
    mutationFn: ({ id, body }) => api(`/admin/books${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body }),
    onSuccess: () => { toast.success(editingBook ? "Đã cập nhật sách" : "Đã thêm sách"); setBookFormOpen(false); setEditingBook(null); refreshBooks(); },
    onError: (error) => toast.error(error.message),
  });
  const deleteBook = useMutation({ mutationFn: (id) => api(`/admin/books/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("Đã xóa sách"); refreshBooks(); refreshCopies(); }, onError: (error) => toast.error(error.message) });
  const saveCopy = useMutation({
    mutationFn: ({ id, body }) => api(`/admin/book-copies${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body }),
    onSuccess: () => { toast.success("Đã lưu bản sách"); setEditingCopy(null); refreshBooks(); refreshCopies(); },
    onError: (error) => toast.error(error.message),
  });
  const copyStatus = useMutation({ mutationFn: ({ id, status }) => api(`/admin/book-copies/${id}/status`, { method: "PATCH", body: { status } }), onSuccess: refreshCopies, onError: (error) => toast.error(error.message) });
  const deleteCopy = useMutation({ mutationFn: (id) => api(`/admin/book-copies/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("Đã xóa bản sách"); refreshBooks(); refreshCopies(); }, onError: (error) => toast.error(error.message) });

  const openCreate = () => { setEditingBook(null); setRelationValues({ authorIds: [], categoryId: "", publisherId: "" }); setBookFormOpen(true); };
  const openEdit = (book) => { setEditingBook(book); setRelationValues({ authorIds: book.authors.map((x) => x.authorId), categoryId: book.categoryId, publisherId: book.publisherId || "" }); setBookFormOpen(true); };
  const submitBook = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const authorIds = form.getAll("authorIds");
    if (!authorIds.length) { toast.error("Vui lòng chọn ít nhất một tác giả"); return; }
    const value = (name) => form.get(name) || null;
    const body = {
      title: form.get("title"), bookCode: form.get("bookCode"), categoryId: form.get("categoryId"), authorIds,
      publisherId: value("publisherId"), isbn: value("isbn"), language: form.get("language") || "vi",
      publishedYear: value("publishedYear") ? Number(value("publishedYear")) : null, shortDescription: form.get("shortDescription"),
      editorialReview: value("editorialReview"), finePerDay: value("finePerDay") ? Number(value("finePerDay")) : null,
      borrowDays: value("borrowDays") ? Number(value("borrowDays")) : null, status: form.get("status"),
      featured: form.get("featured") === "on", showEditorialReview: true,
    };
    saveBook.mutate({ id: editingBook?.id, body });
  };
  const submitCopy = (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    saveCopy.mutate({ id: editingCopy?.id, body: { ...form, locationId: copyLocationId, bookId: selectedBookId } }, { onSuccess: () => setCopyFormOpen(false) });
  };
  if (isLoading) return <Loading />;
  const books = data?.items || [];
  const bookOptions = bookOptionsData?.items || books;
  return <>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Quản lý kho</p><h1 className="mt-2 font-serif text-4xl font-semibold">Sách & bản vật lý</h1></div>
      <button className="btn-primary" onClick={openCreate}><BookPlus size={18} />Thêm sách</button>
    </div>

    <Modal open={bookFormOpen} onClose={() => { setBookFormOpen(false); setEditingBook(null); }} title={editingBook ? "Sửa thông tin sách" : "Thêm đầu sách"} description="Thông tin đầu sách, phân loại và chính sách mượn." size="xl">
    <form className="grid gap-4 md:grid-cols-2" onSubmit={submitBook} key={editingBook?.id || "new-book"}>
      <label><span className="label">Tên sách</span><input className="input" name="title" defaultValue={editingBook?.title || ""} required /></label>
      <label><span className="label">Mã sách nội bộ</span><input className="input" name="bookCode" defaultValue={editingBook?.bookCode || ""} required /></label>
      <div><span className="label">Tác giả</span><AuthorSelect authors={meta?.authors || []} value={relationValues.authorIds} onChange={(authorIds) => setRelationValues((current) => ({ ...current, authorIds }))} /><span className="mt-2 flex flex-wrap items-center justify-between gap-2"><small className="text-slate-500">Có thể chọn nhiều tác giả.</small><span className="flex gap-3"><button type="button" className="text-sm font-semibold text-emerald-700 hover:underline" onClick={() => setQuickEntity("authors")}><Plus className="inline" size={14} /> Thêm tác giả</button><Link className="text-sm font-semibold text-slate-600 hover:underline dark:text-slate-300" href="/admin/danh-muc">Sửa / xóa</Link></span></span></div>
      <div className="grid gap-4">
        <label><span className="label">Thể loại</span><select className="input" name="categoryId" required value={relationValues.categoryId} onChange={(event) => setRelationValues((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Chọn thể loại</option>{meta?.categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><span className="mt-2 flex justify-between gap-3"><button type="button" className="text-sm font-semibold text-emerald-700 hover:underline" onClick={() => setQuickEntity("categories")}><Plus className="inline" size={14} /> Thêm thể loại</button><Link className="text-sm font-semibold text-slate-600 hover:underline dark:text-slate-300" href="/admin/danh-muc">Sửa / xóa</Link></span></label>
        <label><span className="label">Nhà xuất bản</span><select className="input" name="publisherId" value={relationValues.publisherId} onChange={(event) => setRelationValues((current) => ({ ...current, publisherId: event.target.value }))}><option value="">Không chọn</option>{meta?.publishers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><span className="mt-2 flex justify-between gap-3"><button type="button" className="text-sm font-semibold text-emerald-700 hover:underline" onClick={() => setQuickEntity("publishers")}><Plus className="inline" size={14} /> Thêm nhà xuất bản</button><Link className="text-sm font-semibold text-slate-600 hover:underline dark:text-slate-300" href="/admin/danh-muc">Sửa / xóa</Link></span></label>
      </div>
      <label><span className="label">ISBN</span><input className="input" name="isbn" defaultValue={editingBook?.isbn || ""} /></label>
      <label><span className="label">Năm xuất bản</span><input className="input" name="publishedYear" type="number" defaultValue={editingBook?.publishedYear || ""} /></label>
      <label className="md:col-span-2"><span className="label">Mô tả ngắn</span><textarea className="input min-h-24 py-3" name="shortDescription" defaultValue={editingBook?.shortDescription || ""} required minLength={10} /></label>
      <label className="md:col-span-2"><span className="label">Review chính thức</span><textarea className="input min-h-28 py-3" name="editorialReview" defaultValue={editingBook?.editorialReview || ""} /></label>
      <label><span className="label">Phí quá hạn/ngày</span><input className="input" name="finePerDay" type="number" min="0" defaultValue={editingBook?.finePerDay || ""} /></label>
      <label><span className="label">Số ngày mượn</span><input className="input" name="borrowDays" type="number" min="1" max="90" defaultValue={editingBook?.borrowDays || ""} /></label>
      <label><span className="label">Ngôn ngữ</span><input className="input" name="language" defaultValue={editingBook?.language || "vi"} /></label>
      <label><span className="label">Trạng thái</span><select className="input" name="status" defaultValue={editingBook?.status || "VISIBLE"}><option value="VISIBLE">Hiển thị</option><option value="HIDDEN">Ẩn</option><option value="DISCONTINUED">Ngừng phục vụ</option></select></label>
      <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={editingBook?.featured} /> Sách nổi bật</label>
      <div className="flex justify-end gap-2 border-t pt-4 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => { setBookFormOpen(false); setEditingBook(null); }}>Hủy</button><button className="btn-primary" disabled={saveBook.isPending}>{saveBook.isPending ? "Đang lưu..." : editingBook ? "Lưu cập nhật" : "Tạo đầu sách"}</button></div>
    </form>
    </Modal>

    <div className="panel relative mt-6 overflow-hidden" aria-busy={booksFetching}><FetchingOverlay show={booksFetching && !isLoading} label="Đang tải trang sách..." /><div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr><th className="p-4">Sách</th><th className="p-4">Thể loại</th><th className="p-4">Mã</th><th className="p-4">Bản sách</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead>
      <tbody>{books.map((book) => <tr className="border-t" key={book.id}><td className="p-4"><strong>{book.title}</strong><small className="block text-slate-500">{book.authors.map((x) => x.author.name).join(", ")}</small></td><td className="p-4">{book.category.name}</td><td className="p-4 font-mono text-xs">{book.bookCode}</td><td className="p-4">{book.copies.filter((x) => x.status === "AVAILABLE").length}/{book.copies.length}</td><td className="p-4"><span className="status bg-emerald-50 text-emerald-800 dark:bg-emerald-950">{statusLabel(book.status)}</span></td><td className="p-4"><div className="flex justify-end gap-1"><button className="btn-secondary h-9 w-9 p-0" aria-label="Sửa sách" onClick={() => openEdit(book)}><Pencil size={15} /></button><button className="btn-secondary h-9 w-9 p-0 text-red-700" aria-label="Xóa sách" onClick={() => setBookToDelete(book)}><Trash2 size={15} /></button></div></td></tr>)}{!books.length && <TableEmpty colSpan={6} message="Không có đầu sách nào trong trang này." />}</tbody>
    </table></div><Pagination page={bookPage} total={data?.pagination?.total || 0} pageSize={data?.pagination?.limit || 20} onPageChange={setBookPage} /></div>

    <section className="mt-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Kho vật lý</p><h2 className="mt-2 font-serif text-3xl font-semibold">Quản lý bản sách</h2></div><div className="flex flex-col gap-2 sm:flex-row"><select className="input min-w-72" value={selectedBookId} onChange={(event) => { setSelectedBookId(event.target.value); setEditingCopy(null); setCopyPage(1); }}><option value="">Tất cả đầu sách</option>{bookOptions.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select><button className="btn-primary" disabled={!selectedBookId} onClick={() => { setEditingCopy(null); setCopyLocationId(""); setCopyFormOpen(true); }}><CopyPlus size={17} />Thêm bản sách</button></div></div>
      <Modal open={copyFormOpen} onClose={() => { setCopyFormOpen(false); setEditingCopy(null); }} title={editingCopy ? "Sửa bản sách" : "Thêm bản sách"} description="Mỗi bản vật lý có mã, vị trí và tình trạng riêng." size="md">
      <form className="grid gap-4" onSubmit={submitCopy} key={editingCopy?.id || `copy-${selectedBookId}`}>
        <label><span className="label">Mã bản sách</span><input className="input" name="copyCode" defaultValue={editingCopy?.copyCode || ""} required disabled={Boolean(editingCopy)} /></label>
        <label><span className="label">Vị trí</span><select className="input" name="locationId" value={copyLocationId} onChange={(event) => setCopyLocationId(event.target.value)} required><option value="">Chọn vị trí</option>{meta?.locations.map((x) => <option key={x.id} value={x.id}>{[x.area, x.cabinet, x.shelf, x.slot].filter(Boolean).join(" · ")}</option>)}</select><span className="mt-2 flex justify-between gap-3"><button type="button" className="text-sm font-semibold text-emerald-700 hover:underline" onClick={() => setQuickEntity("locations")}><Plus className="inline" size={14} /> Thêm vị trí</button><Link className="text-sm font-semibold text-slate-600 hover:underline dark:text-slate-300" href="/admin/danh-muc">Sửa / xóa</Link></span></label>
        <label><span className="label">Ghi chú tình trạng</span><input className="input" name="conditionNote" defaultValue={editingCopy?.conditionNote || ""} /></label>
        <div className="flex justify-end gap-2 border-t pt-4"><button type="button" className="btn-secondary" onClick={() => { setCopyFormOpen(false); setEditingCopy(null); }}>Hủy</button><button className="btn-primary" disabled={saveCopy.isPending}><CopyPlus size={17} />{saveCopy.isPending ? "Đang lưu..." : editingCopy ? "Lưu thay đổi" : "Thêm bản"}</button></div>
      </form>
      </Modal>
      <div className="panel relative mt-5 overflow-hidden" aria-busy={copiesFetching}><FetchingOverlay show={copiesFetching} label="Đang lọc bản sách..." /><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="p-4">Mã bản</th><th className="p-4">Đầu sách</th><th className="p-4">Vị trí</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{copies.map((copy) => <tr className="border-t" key={copy.id}><td className="p-4 font-mono text-xs">{copy.copyCode}</td><td className="p-4">{copy.book.title}</td><td className="p-4">{[copy.location.area, copy.location.cabinet, copy.location.shelf, copy.location.slot].filter(Boolean).join(" · ")}</td><td className="p-4"><select className="input min-w-44" value={copy.status} onChange={(event) => copyStatus.mutate({ id: copy.id, status: event.target.value })}>{copyStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></td><td className="p-4"><div className="flex justify-end gap-1"><button className="btn-secondary h-9 w-9 p-0" onClick={() => { setSelectedBookId(copy.bookId); setEditingCopy(copy); setCopyLocationId(copy.locationId); setCopyFormOpen(true); }} aria-label="Sửa bản sách"><Pencil size={15} /></button><button className="btn-secondary h-9 w-9 p-0 text-red-700" onClick={() => setCopyToDelete(copy)} aria-label="Xóa bản sách"><Trash2 size={15} /></button></div></td></tr>)}{!copies.length && <TableEmpty colSpan={5} message={selectedBookId ? "Đầu sách này chưa có bản vật lý." : "Chưa có bản sách vật lý nào."} />}</tbody></table></div><Pagination page={copyPage} total={copiesData?.pagination?.total || 0} pageSize={copiesData?.pagination?.limit || 10} onPageChange={setCopyPage} /></div>
    </section>
    <QuickCreateModal type={quickEntity} onClose={() => setQuickEntity(null)} onCreated={(item) => {
      if (quickEntity === "authors") setRelationValues((current) => ({ ...current, authorIds: [...new Set([...current.authorIds, item.id])] }));
      if (quickEntity === "categories") setRelationValues((current) => ({ ...current, categoryId: item.id }));
      if (quickEntity === "publishers") setRelationValues((current) => ({ ...current, publisherId: item.id }));
      if (quickEntity === "locations") setCopyLocationId(item.id);
      setQuickEntity(null);
    }} />
    <ConfirmDialog open={Boolean(bookToDelete)} onClose={() => setBookToDelete(null)} onConfirm={() => deleteBook.mutate(bookToDelete.id, { onSuccess: () => setBookToDelete(null) })} busy={deleteBook.isPending} title="Xóa đầu sách?" description={bookToDelete ? `“${bookToDelete.title}” sẽ được ngừng phục vụ và ẩn khỏi thư viện. Lịch sử mượn vẫn được giữ nguyên.` : ""} confirmText="Xóa sách" />
    <ConfirmDialog open={Boolean(copyToDelete)} onClose={() => setCopyToDelete(null)} onConfirm={() => deleteCopy.mutate(copyToDelete.id, { onSuccess: () => setCopyToDelete(null) })} busy={deleteCopy.isPending} title="Xóa bản sách?" description={copyToDelete ? `Bản “${copyToDelete.copyCode}” sẽ chuyển sang không hoạt động. Không thể xóa nếu bản đang được mượn.` : ""} confirmText="Xóa bản" />
  </>;
}

function AuthorSelect({ authors, value, onChange }) {
  const selected = authors.filter((author) => value.includes(author.id));
  const toggle = (id) => onChange(value.includes(id) ? value.filter((authorId) => authorId !== id) : [...value, id]);
  return <div className="relative">
    {value.map((id) => <input key={id} type="hidden" name="authorIds" value={id} />)}
    <details className="group relative">
      <summary className="input flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className={selected.length ? "truncate" : "text-slate-400"}>{selected.length ? selected.map((author) => author.name).join(", ") : "Chọn tác giả"}</span>
        <ChevronDown className="shrink-0 transition-transform group-open:rotate-180" size={17} />
      </summary>
      <div className="absolute z-30 mt-2 max-h-64 w-full touch-pan-y overflow-y-auto overscroll-contain rounded-xl border bg-white p-2 shadow-xl dark:bg-[#13201d]">
        {authors.length ? authors.map((author) => {
          const checked = value.includes(author.id);
          return <button key={author.id} type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => toggle(author.id)}>
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${checked ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300"}`}>{checked && <Check size={13} />}</span>
            <span>{author.name}</span>
          </button>;
        }) : <p className="px-3 py-4 text-center text-sm text-slate-500">Chưa có tác giả. Hãy thêm tác giả mới bên dưới.</p>}
      </div>
    </details>
  </div>;
}

const quickDefinitions = {
  authors: { title: "Thêm tác giả", fields: [{ name: "name", label: "Tên tác giả", required: true }, { name: "bio", label: "Tiểu sử" }] },
  categories: { title: "Thêm thể loại", fields: [{ name: "name", label: "Tên thể loại", required: true }, { name: "description", label: "Mô tả" }] },
  publishers: { title: "Thêm nhà xuất bản", fields: [{ name: "name", label: "Tên nhà xuất bản", required: true }] },
  locations: { title: "Thêm vị trí", fields: [{ name: "area", label: "Khu", required: true }, { name: "cabinet", label: "Tủ", required: true }, { name: "shelf", label: "Kệ", required: true }, { name: "slot", label: "Ô" }, { name: "note", label: "Ghi chú" }] },
};

function QuickCreateModal({ type, onClose, onCreated }) {
  const queryClient = useQueryClient();
  const definition = quickDefinitions[type];
  const create = useMutation({
    mutationFn: (body) => api(`/admin/${type}`, { method: "POST", body }),
    onSuccess: (item) => { queryClient.invalidateQueries({ queryKey: ["admin-meta"] }); toast.success("Đã thêm và chọn dữ liệu mới"); onCreated(item); },
    onError: (error) => toast.error(error.message),
  });
  if (!definition) return null;
  return <Modal open title={definition.title} description="Mục mới sẽ được chọn ngay trong biểu mẫu hiện tại." onClose={onClose} size="sm">
    <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); create.mutate(Object.fromEntries(new FormData(event.currentTarget))); }}>
      {definition.fields.map((field) => <label key={field.name}><span className="label">{field.label}</span><input className="input" name={field.name} required={field.required} /></label>)}
      <div className="mt-2 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={onClose}>Hủy</button><button className="btn-primary" disabled={create.isPending}>{create.isPending ? "Đang thêm..." : "Thêm và chọn"}</button></div>
    </form>
  </Modal>;
}
