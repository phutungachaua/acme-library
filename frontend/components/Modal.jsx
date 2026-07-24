"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };
let openModalCount = 0;
let originalBodyOverflow = "";

function lockBodyScroll() {
  if (openModalCount === 0) originalBodyOverflow = document.body.style.overflow;
  openModalCount += 1;
  document.body.style.overflow = "hidden";
  return () => {
    openModalCount = Math.max(0, openModalCount - 1);
    if (openModalCount === 0) document.body.style.overflow = originalBodyOverflow;
  };
}

export function Modal({ open, onClose, title, description, children, footer, size = "md", closeOnOverlay = true }) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeButton = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return undefined;
    const unlockBodyScroll = lockBodyScroll();
    const onKeyDown = (event) => { if (event.key === "Escape") onCloseRef.current?.(); };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeButton.current?.focus());
    return () => { unlockBodyScroll(); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (closeOnOverlay && event.target === event.currentTarget) onClose?.(); }}>
      <section className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-[#13201d] ${widths[size] || widths.md}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div><h2 id={titleId} className="font-serif text-2xl font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>
          <button ref={closeButton} type="button" className="btn-secondary h-9 w-9 shrink-0 p-0" aria-label="Đóng hộp thoại" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
        {footer && <footer className="flex shrink-0 justify-end gap-2 border-t bg-slate-50 px-5 py-4 dark:bg-slate-900 sm:px-6">{footer}</footer>}
      </section>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = "Xác nhận thao tác", description, confirmText = "Xác nhận", busy = false, danger = true }) {
  return <Modal open={open} onClose={busy ? undefined : onClose} title={title} size="sm" closeOnOverlay={!busy}>
    <div className="flex gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${danger ? "bg-red-50 text-red-700 dark:bg-red-950" : "bg-amber-50 text-amber-700 dark:bg-amber-950"}`}><AlertTriangle size={21} /></span><p className="pt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p></div>
    <div className="mt-6 flex justify-end gap-2"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Hủy</button><button type="button" className={danger ? "rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60" : "btn-primary"} disabled={busy} onClick={onConfirm}>{busy ? "Đang xử lý..." : confirmText}</button></div>
  </Modal>;
}
