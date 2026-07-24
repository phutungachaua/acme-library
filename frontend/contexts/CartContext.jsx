"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const storageKey = "acme-library-book-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setItems(saved.filter((item) => item?.id && item?.title).slice(0, 20));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo(() => ({
    items,
    count: items.length,
    has: (bookId) => items.some((item) => item.id === bookId),
    add: (book) => {
      if (items.some((item) => item.id === book.id) || items.length >= 20) return false;
      setItems([...items, { id: book.id, slug: book.slug, title: book.title, coverUrl: book.coverUrl, authors: book.authors?.map((entry) => entry.author?.name).filter(Boolean) || [], availableCount: book.availableCount }]);
      return true;
    },
    remove: (bookId) => setItems((current) => current.filter((item) => item.id !== bookId)),
    removeMany: (bookIds) => setItems((current) => current.filter((item) => !bookIds.includes(item.id))),
    clear: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
