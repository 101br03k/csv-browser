import { useState, useRef, useEffect } from "react";
import { Search, Layers, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CSVColumn, ColumnFilter } from "@/hooks/useCSVData";

interface DataControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  columns: CSVColumn[];
  visibleColumns: string[];
  onToggleColumn: (column: string) => void;
  onToggleAllColumns: (checked: boolean) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (value: number) => void;
  columnFilters: Record<string, ColumnFilter>;
  onSetColumnFilter: (column: string, value: string) => void;
  onRemoveFilter: (column: string) => void;
  onClearAllFilters: () => void;
}

export default function DataControls({
  searchTerm,
  onSearchChange,
  columns,
  visibleColumns,
  onToggleColumn,
  onToggleAllColumns,
  rowsPerPage,
  onRowsPerPageChange,
  columnFilters,
  onSetColumnFilter,
  onRemoveFilter,
  onClearAllFilters,
}: DataControlsProps) {
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if all columns are selected
  const allColumnsSelected = columns.every(col => visibleColumns.includes(col.id));
  
  // Get active filters
  const activeFilters = Object.entries(columnFilters)
    .filter(([_, filter]) => filter.value.trim() !== '')
    .map(([column, filter]) => ({
      column,
      value: filter.value,
      columnName: columns.find(col => col.id === column)?.name || column
    }));

  // Close column selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsColumnSelectorOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search in all columns..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-3 py-2"
            />
          </div>
          
          {/* Column Visibility */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
            >
              <div className="flex items-center">
                <Layers className="h-5 w-5 mr-2 text-gray-400" />
                Columns
              </div>
              <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
            </Button>
            
            {/* Column Selector Dropdown */}
            {isColumnSelectorOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1 max-h-60 overflow-y-auto" role="menu">
                  <div className="px-4 py-2 border-b">
                    <div className="flex items-center">
                      <Checkbox
                        id="toggle-all-columns"
                        checked={allColumnsSelected}
                        onCheckedChange={onToggleAllColumns}
                      />
                      <Label htmlFor="toggle-all-columns" className="ml-2 text-sm text-gray-900 font-medium">
                        Toggle all columns
                      </Label>
                    </div>
                  </div>
                  
                  {columns.map((column) => (
                    <div key={column.id} className="px-4 py-2 hover:bg-gray-100">
                      <div className="flex items-center">
                        <Checkbox
                          id={`column-${column.id}`}
                          checked={visibleColumns.includes(column.id)}
                          onCheckedChange={() => onToggleColumn(column.id)}
                        />
                        <Label htmlFor={`column-${column.id}`} className="ml-2 text-sm text-gray-900">
                          {column.name}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Row Count Selector */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="rows-per-page" className="text-sm font-medium text-gray-700">
              Rows per page:
            </Label>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => onRowsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
              <span 
                key={filter.column} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {filter.columnName}: {filter.value}
                <button
                  onClick={() => onRemoveFilter(filter.column)}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            <button
              onClick={onClearAllFilters}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
            >
              Clear all filters
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
