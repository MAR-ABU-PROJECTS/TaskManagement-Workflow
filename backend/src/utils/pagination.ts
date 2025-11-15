export function paginate(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  const take = limit > 100 ? 100 : limit; // Max 100 items per page

  return { skip, take };
}

export function paginationMeta(total: number, page: number, limit: number) {
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
