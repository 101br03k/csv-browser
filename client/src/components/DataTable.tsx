import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortConfig, ColumnFilter, CSVColumn, Statistics } from "@/hooks/useCSVData";

interface DataTableProps {
  data: any[];
  columns: CSVColumn[];
  visibleColumns: string[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  columnFilters: Record<string, ColumnFilter>;
  onColumnFilterChange: (column: string, value: string) => void;
  currentPage: number;
  rowsPerPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  statistics: Statistics;
}

export default function DataTable({
  data,
  columns,
  visibleColumns,
  sortConfig,
  onSort,
  columnFilters,
  onColumnFilterChange,
  currentPage,
  rowsPerPage,
  totalPages,
  onPageChange,
  statistics,
}: DataTableProps) {
  // Calculate pagination values
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const currentPageData = data.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const leftBound = Math.max(2, currentPage - 1);
      const rightBound = Math.min(totalPages - 1, currentPage + 1);
      if (leftBound > 2) pages.push(-1);
      for (let i = leftBound; i <= rightBound; i++) pages.push(i);
      if (rightBound < totalPages - 1) pages.push(-2);
      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const renderSortIcon = (column: string) => {
    if (sortConfig.column === column) {
      return sortConfig.direction === "asc" ? (
        <ArrowUp className="h-4 w-4 text-gray-500" />
      ) : (
        <ArrowDown className="h-4 w-4 text-gray-500" />
      );
    }
    return <ArrowUpDown className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              {columns
                .filter((column) => visibleColumns.includes(column.id))
                .map((column) => (
                  <TableHead key={column.id} className="px-6 py-3">
                    <div
                      className="flex items-center space-x-1 cursor-pointer group"
                      onClick={() => onSort(column.id)}
                    >
                      <span>{column.name}</span>
                      {renderSortIcon(column.id)}
                    </div>
                    <div className="mt-1">
                      <Input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters[column.id]?.value || ""}
                        onChange={(e) =>
                          onColumnFilterChange(column.id, e.target.value)
                        }
                        className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="px-6 py-16 text-center text-sm text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-12 w-12 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 font-medium">No matching records found</p>
                  <p className="mt-1">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              currentPageData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-gray-50">
                  {columns
                    .filter((column) => visibleColumns.includes(column.id))
                    .map((column) => (
                      <TableCell
                        key={column.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {row[column.id]}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing
              <span className="font-medium mx-1">
                {data.length > 0 ? startIndex + 1 : 0}
              </span>
              to
              <span className="font-medium mx-1">{endIndex}</span>
              of
              <span className="font-medium mx-1">{statistics.displayedRows}</span>
              results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <Button
                variant="outline"
                size="sm"
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              {pageNumbers.map((page, index) => {
                if (page < 0) {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant="outline"
                    size="sm"
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                      currentPage === page ? "bg-gray-100" : ""
                    }`}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
