'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(0, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        이전
      </button>
      
      {startPage > 0 && (
        <>
          <button
            onClick={() => onPageChange(0)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            1
          </button>
          {startPage > 1 && <span className="px-2">...</span>}
        </>
      )}
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 border rounded ${
            currentPage === page
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {page + 1}
        </button>
      ))}
      
      {endPage < totalPages - 1 && (
        <>
          {endPage < totalPages - 2 && <span className="px-2">...</span>}
          <button
            onClick={() => onPageChange(totalPages - 1)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        다음
      </button>
    </div>
  );
}

