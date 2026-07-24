# Acme Library

Ứng dụng quản lý thư viện sách nội bộ, gồm giao diện người đọc và trang quản trị. Hệ thống quản lý đến từng bản sách vật lý, luồng duyệt mượn/trả, phí quá hạn, review chính thức, đánh giá độc giả, góp ý và thông báo nội bộ.

## Công nghệ

- **Next.js 16 + React 19 + JavaScript/JSX**: App Router, render tối ưu, routing rõ ràng; không dùng TypeScript theo yêu cầu.
- **Tailwind CSS**: hệ thống UI responsive, light/dark mode, ít phụ thuộc CSS runtime.
- **TanStack Query**: cache, trạng thái loading/error và đồng bộ dữ liệu máy chủ.
- **Express 5 + Prisma + PostgreSQL**: REST API tách biệt, transaction nghiệp vụ và schema có kiểu rõ ràng.
- **Zod**: validation request tại biên API.
- **Argon2id + JWT**: hash mật khẩu hiện đại; access token ngắn hạn chỉ giữ trong bộ nhớ, refresh token trong cookie httpOnly và được băm trong database.
- **Cloudinary + Multer memory storage**: upload trực tiếp, không ghi ảnh xuống disk/database.
- **Helmet, CORS whitelist, rate limit, Pino**: hardening HTTP, giới hạn auth và log có redact dữ liệu nhạy cảm.
- **node-cron**: chạy kiểm tra hạn trả và tạo thông báo hàng ngày.

Chi tiết quyết định kiến trúc nằm tại [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), danh mục API tại [docs/API.md](docs/API.md).

## Cấu trúc

```text
library-app/
├── frontend/               # Next.js JSX, user UI + admin UI
├── backend/
│   ├── prisma/             # schema + seed
│   ├── src/
│   │   ├── config/         # env, Prisma, Cloudinary
│   │   ├── jobs/           # kiểm tra quá hạn hằng ngày
│   │   ├── middlewares/    # auth, role, validation, upload, lỗi
│   │   ├── routes/         # REST endpoints
│   │   ├── services/       # auth, borrow/return, upload, notification
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   └── test/
└── docs/
```

## Yêu cầu môi trường

- Node.js 20.9 trở lên (khuyến nghị Node 22 LTS)
- PostgreSQL 15 trở lên hoặc Supabase Free
- Tài khoản Cloudinary Free nếu cần upload

## Chạy local

1. Cài dependency từ thư mục gốc:

```bash
npm install
```

2. Tạo file môi trường:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Trên PowerShell dùng `Copy-Item` thay cho `cp`. Thay toàn bộ secret mẫu trước khi chạy. Có thể tạo secret bằng `openssl rand -base64 48` hoặc trình tạo mật mã an toàn tương đương.

3. Tạo schema và dữ liệu mẫu:

```bash
npm run prisma:generate -w backend
npm run prisma:migrate -w backend -- --name init
npm run prisma:seed -w backend
```

4. Chạy cả frontend và backend:

```bash
npm run dev
```

- Website: `http://localhost:3000`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

## Supabase PostgreSQL

1. Tạo project tại Supabase, chọn region gần người dùng.
2. Vào **Project Settings → Database → Connection string**.
3. Khi chạy migration, ưu tiên **Direct connection**. Nếu môi trường deploy chỉ hỗ trợ IPv4, dùng Supavisor session pooler và thêm `?pgbouncer=true` khi phù hợp.
4. Đặt chuỗi kết nối vào `backend/.env` dưới tên `DATABASE_URL`.
5. Chạy `npm run prisma:migrate -w backend -- --name init`, sau đó seed.
6. Production dùng `npm run prisma:deploy -w backend`, không dùng `migrate dev`.

Không bật Supabase Data API cho các bảng này nếu không dùng đến. Backend là cổng truy cập dữ liệu duy nhất; không đưa database password vào frontend.

## Cloudinary

Tạo Cloudinary Free account, lấy Cloud name, API key và API secret trong dashboard rồi điền ba biến `CLOUDINARY_*` ở backend. Ứng dụng chỉ chấp nhận JPG/PNG/WebP tối đa 5 MB, upload từ memory và lưu `secure_url` + `public_id`. Khi đổi avatar/bìa, ảnh cũ được yêu cầu xóa khỏi Cloudinary.

## Biến môi trường

Backend:

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Supabase transaction-pooler URL cho Prisma runtime |
| `DIRECT_URL` | Supabase session-pooler URL cho migration |
| `JWT_ACCESS_SECRET` | Secret access token, tối thiểu 32 ký tự |
| `JWT_REFRESH_SECRET` | Secret refresh token riêng biệt |
| `ACCESS_TOKEN_EXPIRES_IN` | Mặc định `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Mặc định `7d` |
| `CLIENT_URL` | Origin frontend duy nhất được CORS cho phép |
| `CLOUDINARY_*` | Thông tin Cloudinary, chỉ ở backend |
| `NODE_ENV`, `PORT` | Môi trường và cổng API |
| `CRON_ENABLED` | Tắt cron trên instance không chuyên chạy job nếu cần |
| `SEED_ADMIN_EMAIL/PASSWORD` | Chỉ dùng lúc seed |

Frontend chỉ cần `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_APP_NAME`. Mọi biến `NEXT_PUBLIC_*` đều được public trong bundle, tuyệt đối không đặt secret ở đó.

## Tài khoản seed

- Email mặc định: `admin@acme.local`
- Mật khẩu mặc định: `ChangeMe123!`

Đổi bằng `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD` trước khi seed. Sau lần đăng nhập đầu tiên phải đổi mật khẩu; không sử dụng thông tin mặc định ở production.

Seed tạo 4 đầu sách, 3 bản vật lý mỗi đầu sách, tác giả, thể loại, vị trí và tài khoản Super Admin. Đây là **dữ liệu mẫu có chủ đích** để kiểm tra hệ thống, không tham gia logic production.

## Deploy backend lên Render

1. Tạo Web Service từ repository, Root Directory để trống vì đây là npm workspace.
2. Build command: `npm ci && npm run prisma:generate -w backend`.
3. Start command: `npm run start -w backend`.
4. Khai báo toàn bộ biến backend; `CLIENT_URL` là URL Vercel chính xác, không có dấu `/` cuối.
5. Chạy migration từ CI/job tin cậy: `npm run prisma:deploy -w backend`.
6. Free instance có thể sleep; cron trong web process sẽ không chạy khi instance ngủ. Với vận hành thật, dùng Render Cron Job/GitHub Actions gọi một endpoint job được bảo vệ, hoặc host backend trên dịch vụ luôn hoạt động.

## Deploy frontend lên Vercel

1. Import repository, đặt Root Directory là `frontend`.
2. Framework Preset: Next.js.
3. Đặt `NEXT_PUBLIC_API_URL=https://<backend>/api`.
4. Deploy, sau đó cập nhật `CLIENT_URL` backend bằng domain Vercel production và redeploy backend.

Cookie production dùng `Secure`, `httpOnly`, `SameSite=None` để hỗ trợ frontend/backend khác domain. Chỉ cho phép HTTPS.

## Bảo mật production

- Dùng secret khác nhau, tối thiểu 256 bit; xoay secret theo quy trình có kiểm soát.
- Giới hạn database role theo least privilege, bật backup/PITR phù hợp và theo dõi quota Supabase.
- Không log password, cookie hay token; cấu hình log drain và retention.
- Đặt Cloudinary upload preset ở chế độ signed, giới hạn quota và theo dõi asset bất thường.
- Chạy `npm audit`, cập nhật dependency và review lockfile định kỳ. Next hiện ghim một PostCSS nội bộ khiến npm advisory báo mức vừa dù app không stringify CSS từ input người dùng; theo dõi bản vá upstream và nâng ngay khi phát hành.
- Chỉ chạy một cron worker, nếu không thông báo được chống trùng bằng `dedupeKey` nhưng vẫn tạo tải thừa.
- Bật MFA cho Supabase, Cloudinary, Vercel, Render và tài khoản quản trị.
- Thêm CSRF token nếu sau này cho phép cookie xác thực ngoài refresh endpoint. Hiện mọi API nghiệp vụ dùng Bearer token, refresh cookie bị giới hạn path `/api/auth`.

## Kiểm tra

```bash
npm run build
npm run test
```

Build frontend và Prisma client đã được kiểm tra. Test đơn vị hiện bao phủ công thức số ngày quá hạn; nên bổ sung integration test với PostgreSQL tạm thời cho toàn bộ transaction trước khi đưa vào vận hành quy mô lớn.

## Phạm vi đã hoàn thành

MVP chạy thật đã có auth/role, profile + avatar, library/search/filter/pagination, book detail, quản lý sách và bản vật lý, mượn/trả, phí quá hạn, review độc giả có duyệt, editorial review riêng, view history, feedback + phản hồi, thông báo, daily job, dashboard và các màn quản trị chính, dark/light mode, seed và tài liệu.

Các phần nên phát triển tiếp: gia hạn sách, workflow trả sách chi tiết hơn cho bồi thường hư hỏng/mất, export CSV/PDF, biểu đồ theo chuỗi thời gian, email/Zalo provider, phân quyền admin dạng permission chi tiết, object-level audit viewer, integration/E2E test và giải pháp cron độc lập khỏi free web instance.
# acme-library
