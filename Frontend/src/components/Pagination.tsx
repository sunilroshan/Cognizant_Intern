import React from "react";

type Props = {
  total: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (p: number) => void;
};

const Pagination: React.FC<Props> = ({ total, pageSize, currentPage, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }
  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase = "px-3 py-1 rounded-md text-sm font-medium transition-colors";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900">
      <div className="text-sm text-slate-400">Page {currentPage} of {totalPages}</div>
      <div className="inline-flex items-center space-x-2">
        <button
          aria-label="Previous page"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-[#16a34a] hover:bg-[#13a34a] text-white'}`}
        >Prev</button>
        {pages.map((p) => (
          <button
            key={p}
            aria-current={p === currentPage ? 'page' : undefined}
            aria-label={`Go to page ${p}`}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${p === currentPage ? 'bg-gradient-to-r from-[#16a34a] to-[#34d399] text-white' : 'bg-transparent border border-slate-700 text-slate-200 hover:bg-slate-800'}`}
          >{p}</button>
        ))}
        <button
          aria-label="Next page"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`${btnBase} ${currentPage === totalPages ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-[#16a34a] hover:bg-[#13a34a] text-white'}`}
        >Next</button>
      </div>
    </div>
  );
};

export default Pagination;
