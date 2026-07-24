export const ok = (res, data, message = "Thành công", status = 200) => res.status(status).json({ success: true, message, data });
export const page = (res, items, total, pageNumber, limit) => ok(res, { items, pagination: { page: pageNumber, limit, total, pages: Math.ceil(total / limit) } });
