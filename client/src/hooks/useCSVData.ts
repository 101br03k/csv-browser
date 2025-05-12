import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";

export interface CSVColumn {
  id: string;
  name: string;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface ColumnFilter {
  column: string;
  value: string;
}

export interface Statistics {
  totalRows: number;
  displayedRows: number;
  columns: number;
}

export function useCSVData() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<CSVColumn[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: "", direction: "asc" });
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setFile(file);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload file to server
      const response = await fetch("/api/csv/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file");
      }

      const fileData = await response.json();

      // Fetch file content
      const contentResponse = await fetch(`/api/csv/${fileData.filename}`);
      
      if (!contentResponse.ok) {
        const errorData = await contentResponse.json();
        throw new Error(errorData.message || "Failed to read file content");
      }
      
      const { content } = await contentResponse.json();

      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            setError(`Error parsing CSV: ${results.errors[0].message}`);
            setLoading(false);
            return;
          }

          // Extract data and headers
          const parsedData = results.data;
          const headers = results.meta.fields || [];
          
          // Create columns data
          const columnData = headers.map((header) => ({
            id: header,
            name: header,
          }));
          
          setCsvData(parsedData);
          setColumns(columnData);
          setVisibleColumns(headers);
          
          // Reset filters, sorting, and pagination
          setSearchTerm("");
          setSortConfig({ column: "", direction: "asc" });
          setColumnFilters({});
          setCurrentPage(1);
          
          setLoading(false);
          
          toast({
            title: "CSV file loaded successfully",
            description: `Loaded ${parsedData.length} rows and ${headers.length} columns`,
            duration: 10000, // Auto dismiss after 10 seconds
          });
        },
        error: (error) => {
          setError(`Error parsing CSV: ${error.message}`);
          setLoading(false);
        },
      });
    } catch (err) {
      setError((err as Error).message || "An error occurred while processing the file");
      setLoading(false);
    }
  };

  // Remove file and reset state
  const removeFile = () => {
    setFile(null);
    setCsvData([]);
    setColumns([]);
    setVisibleColumns([]);
    setSearchTerm("");
    setSortConfig({ column: "", direction: "asc" });
    setColumnFilters({});
    setCurrentPage(1);
  };

  // Toggle column visibility
  const toggleColumn = (column: string) => {
    setVisibleColumns((prevColumns) => {
      if (prevColumns.includes(column)) {
        return prevColumns.filter((col) => col !== column);
      } else {
        return [...prevColumns, column];
      }
    });
  };

  // Toggle all columns
  const toggleAllColumns = (checked: boolean) => {
    if (checked) {
      setVisibleColumns(columns.map((col) => col.id));
    } else {
      setVisibleColumns([]);
    }
  };

  // Handle sorting
  const handleSort = (column: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.column === column) {
        return {
          column,
          direction: prevConfig.direction === "asc" ? "desc" : "asc",
        };
      }
      return { column, direction: "asc" };
    });
  };

  // Set column filter
  const setColumnFilter = (column: string, value: string) => {
    setColumnFilters((prevFilters) => ({
      ...prevFilters,
      [column]: { column, value },
    }));
    
    // Reset to first page when filtering
    setCurrentPage(1);
  };

  // Remove filter
  const removeFilter = (column: string) => {
    setColumnFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      delete newFilters[column];
      return newFilters;
    });
    
    // Reset to first page
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Apply filters to data
  const filteredData = useMemo(() => {
    // Create a copy of the data
    let filtered = [...csvData];
    
    // Apply search across all columns if there's a search term
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) => {
        return Object.values(row).some((value) => 
          String(value).toLowerCase().includes(searchTermLower)
        );
      });
    }
    
    // Apply column filters
    Object.values(columnFilters).forEach((filter) => {
      if (filter.value.trim() !== '') {
        const filterValueLower = filter.value.toLowerCase();
        filtered = filtered.filter((row) => {
          const cellValue = String(row[filter.column] || '');
          return cellValue.toLowerCase().includes(filterValueLower);
        });
      }
    });
    
    // Apply sorting
    if (sortConfig.column) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.column];
        const bValue = b[sortConfig.column];
        
        // Handle numeric values
        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
          return sortConfig.direction === 'asc' 
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
        }
        
        // Handle string values
        const aValueStr = String(aValue || '').toLowerCase();
        const bValueStr = String(bValue || '').toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aValueStr.localeCompare(bValueStr);
        } else {
          return bValueStr.localeCompare(aValueStr);
        }
      });
    }
    
    return filtered;
  }, [csvData, searchTerm, columnFilters, sortConfig]);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  
  // Adjust current page if it exceeds total pages after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  
  // Calculate statistics
  const statistics: Statistics = {
    totalRows: csvData.length,
    displayedRows: filteredData.length,
    columns: columns.length,
  };
  
  // Download CSV function
  const downloadCSV = () => {
    if (filteredData.length === 0) return;
    
    // Convert data to CSV
    const csv = Papa.unparse({
      fields: visibleColumns,
      data: filteredData.map(row => {
        const newRow: Record<string, any> = {};
        visibleColumns.forEach(column => {
          newRow[column] = row[column];
        });
        return newRow;
      })
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${file?.name.split('.')[0] || 'data'}_filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    csvData,
    file,
    loading,
    error,
    handleFileUpload,
    removeFile,
    filteredData,
    columns,
    visibleColumns,
    toggleColumn,
    toggleAllColumns,
    sortConfig,
    handleSort,
    searchTerm,
    setSearchTerm,
    columnFilters,
    setColumnFilter,
    clearAllFilters,
    removeFilter,
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    statistics,
    downloadCSV,
    setColumns,
  };
}
