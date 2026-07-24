# API

Base URL mặc định: `http://localhost:4000/api`. Phản hồi thành công có `{ success, message, data }`; phản hồi lỗi có `{ success: false, message, errors }`.

Các nhóm endpoint đã triển khai:

- `/auth`: đăng ký, đăng nhập, refresh, logout, hồ sơ, đổi mật khẩu.
- `/books`: tìm kiếm, lọc, phân trang, chi tiết, ghi lịch sử xem, mượn, đánh giá.
- Các route cá nhân: `/users/me`, `/my-borrows`, `/my-fines`, `/my-view-history`, `/feedback`, `/notifications`.
- `/admin/books`, `/admin/book-copies`, `/admin/borrow-requests`, `/admin/borrows`, `/admin/fines`, `/admin/reviews`, `/admin/feedback`, `/admin/users`, `/admin/settings`, `/admin/dashboard`, `/admin/reports`.

Route riêng tư nhận `Authorization: Bearer <access-token>`. Refresh token chỉ được gửi qua cookie httpOnly.
