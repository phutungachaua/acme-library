"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Protected from "@/components/Protected";
import BookCard from "@/components/BookCard";
import { Empty, ErrorState, FetchingOverlay, Loading } from "@/components/States";

export default function History() {
  return <Protected><HistoryContent /></Protected>;
}

function HistoryContent() {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["view-history"],
    queryFn: () => api("/my-view-history"),
    placeholderData: (previous) => previous,
  });

  return <div className="shell py-10">
    <p className="eyebrow">Đã ghé qua</p>
    <h1 className="mt-2 font-serif text-4xl font-semibold">Lịch sử xem</h1>
    <div className="relative mt-8 min-h-64" aria-busy={isFetching}>
      <FetchingOverlay show={isFetching && !isLoading} label="Đang làm mới lịch sử xem..." />
      {isLoading ? <Loading label="Đang tải lịch sử xem..." /> : isError ? <ErrorState message="Không thể tải lịch sử xem" retry={refetch} /> : data?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((item) => <BookCard key={item.id} book={toBookCard(item.book)} />)}
      </div> : <Empty title="Chưa có lịch sử xem" message="Những cuốn sách bạn đã mở xem sẽ xuất hiện tại đây." />}
    </div>
  </div>;
}

function toBookCard(book) {
  const ratingAverage = book.reviews.length ? Math.round((book.reviews.reduce((sum, review) => sum + review.rating, 0) / book.reviews.length) * 10) / 10 : 0;
  return {
    ...book,
    availableCount: book.copies.filter((copy) => copy.status === "AVAILABLE").length,
    totalCopies: book.copies.length,
    ratingAverage,
    ratingCount: book.reviews.length,
  };
}
