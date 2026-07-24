const labels = {
  USER: "Người dùng",
  ADMIN: "Quản trị viên",
  SUPER_ADMIN: "Quản trị viên cấp cao",
  ACTIVE: "Đang hoạt động",
  LOCKED: "Đã khóa",
  PENDING: "Chờ xử lý",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  BORROWING: "Đang mượn",
  OVERDUE: "Quá hạn",
  RETURNED: "Đã trả",
  CANCELLED: "Đã hủy",
  AVAILABLE: "Có sẵn",
  BORROWED: "Đang được mượn",
  RESERVED: "Đã được giữ chỗ",
  DAMAGED: "Hư hỏng",
  LOST: "Thất lạc",
  INACTIVE: "Ngừng sử dụng",
  VISIBLE: "Đang hiển thị",
  HIDDEN: "Đã ẩn",
  DISCONTINUED: "Ngừng phục vụ",
  PUBLISHED: "Đã đăng",
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESPONDED: "Đã phản hồi",
  CLOSED: "Đã đóng",
  NONE: "Không có",
  UNPAID: "Chưa thanh toán",
  REDUCED: "Đã giảm",
  PAID: "Đã thanh toán",
  WAIVED: "Đã miễn",
  NORMAL: "Bình thường",
  MINOR_TEAR: "Rách nhẹ",
  DUE_SOON: "Sắp đến hạn",
  DUE_TODAY: "Đến hạn hôm nay",
  FINE: "Phí phạt",
  BORROW: "Mượn sách",
  FEEDBACK_REPLY: "Phản hồi góp ý",
  SYSTEM: "Hệ thống",
};

export function viLabel(value, fallback = "Chưa xác định") {
  if (value === null || value === undefined || value === "") return fallback;
  return labels[value] || fallback;
}

export const roleLabel = (value) => viLabel(value, "Người dùng");
export const statusLabel = (value) => viLabel(value, "Chưa xác định");
