"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 1) return [1, 2, 3];
  if (current >= total) return [total - 2, total - 1, total];

  return [current - 1, current, current + 1];
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const pages = getPageNumbers(currentPage, totalPages);

  const btnBase =
    "h-9 px-3 text-sm rounded-md border border-gray-300 bg-white flex items-center gap-1.5 cursor-pointer transition-colors hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300";

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} sur {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={btnBase}
        >
          <PiCaretLeft className="size-3.5" />
          Précédent
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={
              page === currentPage
                ? "h-9 w-9 rounded-md bg-black text-green text-sm font-medium flex items-center justify-center cursor-default"
                : "h-9 w-9 rounded-md border border-gray-300 bg-white text-sm flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            }
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={btnBase}
        >
          Suivant
          <PiCaretRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
