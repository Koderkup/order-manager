interface PaginationProps {
  totalPages: number;
  page: number;
  setPage: (num: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  maxVisiblePages?: number;
}

const Pagination = ({
  totalPages,
  page,
  setPage,
  nextPage,
  prevPage,
  maxVisiblePages = 5,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const result: (number | string)[] = [];

    result.push(1);

    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);

    const needed = maxVisiblePages - 2; 
    while (end - start + 1 < needed && (start > 2 || end < totalPages - 1)) {
      if (start > 2) {
        start--;
      }
      if (end < totalPages - 1) {
        end++;
      }
    }


    if (start > 2) {
      result.push("...");
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    if (end < totalPages - 1) {
      result.push("...");
    }

    result.push(totalPages);

    return result;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={prevPage}
        disabled={page === 1}
        className={`px-3 py-1 border border-gray-300 rounded-lg transition-colors ${
          page === 1
            ? "text-gray-400 cursor-not-allowed bg-gray-100"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        Назад
      </button>

      <div className="flex items-center space-x-1">
        {visiblePages.map((pageNum, index) =>
          pageNum === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="flex items-center justify-center w-8 h-8 text-gray-500"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => setPage(Number(pageNum))}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                page === pageNum
                  ? "bg-[#5a6c7d] text-white"
                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {pageNum}
            </button>
          )
        )}
      </div>

      <button
        onClick={nextPage}
        disabled={page === totalPages}
        className={`px-3 py-1 border border-gray-300 rounded-lg transition-colors ${
          page === totalPages
            ? "text-gray-400 cursor-not-allowed bg-gray-100"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        Вперед
      </button>
    </div>
  );
};

export default Pagination;
