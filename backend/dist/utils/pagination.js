"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
exports.paginationMeta = paginationMeta;
function paginate(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit > 100 ? 100 : limit;
    return { skip, take };
}
function paginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
    };
}
