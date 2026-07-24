# Kiến trúc

Ứng dụng là monorepo gồm Next.js App Router ở `frontend` và REST API Express ở `backend`. PostgreSQL là nguồn dữ liệu duy nhất; Prisma quản lý schema và transaction. Ảnh đi thẳng từ bộ nhớ tiến trình lên Cloudinary, database chỉ lưu `secure_url` và `public_id`.

## Ranh giới nghiệp vụ

- `Book` là đầu sách; `BookCopy` là từng bản vật lý có mã và vị trí riêng.
- Khi duyệt mượn, transaction cấp một `BookCopy` còn `AVAILABLE` bằng cập nhật có điều kiện. Nếu bản đó vừa bị tiến trình khác lấy, yêu cầu bị từ chối an toàn để thử lại.
- Phiếu trả tính số ngày quá hạn theo ngày lịch, cập nhật bản sách và tạo `Fine` trong cùng transaction.
- `Review` của người đọc tách hoàn toàn khỏi `editorialReview` chính thức của thư viện.
- Refresh token được băm trong database và xoay vòng ở mỗi lần refresh; access token chỉ tồn tại trong bộ nhớ frontend.
- `WebNotificationProvider` là adapter hiện tại, có thể bổ sung `ZaloNotificationProvider` mà không đổi nghiệp vụ tạo thông báo.

## Phân quyền

`USER` chỉ thao tác tài nguyên của chính mình. `ADMIN` quản trị vận hành. `SUPER_ADMIN` có thêm quyền đổi vai trò. Các thao tác nhạy cảm được ghi `AdminAuditLog`.

## Trạng thái và xóa dữ liệu

Sách, bản sách và người dùng có `deletedAt` để giữ lịch sử. Luồng vận hành ưu tiên chuyển trạng thái thay vì xóa vật lý.
