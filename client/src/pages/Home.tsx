import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";
import DataControls from "@/components/DataControls";
import DataStatistics from "@/components/DataStatistics";
import { useCSVData, CSVColumn } from "@/hooks/useCSVData";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function Home() {
  const {
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
  } = useCSVData();

  const [firstUploadDone, setFirstUploadDone] = useState(false);

  const handleFirstFileUpload = (file: File) => {
    handleFileUpload(file);
    setFirstUploadDone(true);
  };

  const onReorderColumns = (newColumns: CSVColumn[]) => {
    setColumns(newColumns);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV Browser
          </h1>
          <div className="flex items-center space-x-4">
            <Button
              onClick={downloadCSV}
              disabled={!csvData.length}
              className="inline-flex items-center text-white"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download
            </Button>
            {firstUploadDone && (
              <Button
                onClick={() => document.getElementById('file-upload-input')?.click()}
                className="inline-flex items-center text-white bg-gray-700 px-4 py-2 rounded hover:bg-gray-800"
              >
                Upload Another CSV
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* File Upload Section */}
        {!firstUploadDone && (
          <div className="mb-8">
            <FileUpload
              onFileUpload={handleFirstFileUpload}
              currentFile={file}
              onRemoveFile={removeFile}
              loading={loading}
              error={error}
            />
          </div>
        )}

        {/* No Data State */}
        {!csvData.length && !loading && (
          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No data to display</h3>
            <p className="mt-1 text-sm text-gray-500">Upload a CSV file to get started</p>
          </div>
        )}

        {/* Data View */}
        {csvData.length > 0 && (
          <div className="space-y-6">
            {/* Data Statistics */}
            <DataStatistics statistics={statistics} fileSize={file ? file.size : 0} />

            {/* Data Controls */}
            <DataControls
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onToggleAllColumns={toggleAllColumns}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
              columnFilters={columnFilters}
              onSetColumnFilter={setColumnFilter}
              onRemoveFilter={removeFilter}
              onClearAllFilters={clearAllFilters}
              onReorderColumns={onReorderColumns}
            />

            {/* Data Table */}
            <DataTable
              data={filteredData}
              columns={columns}
              visibleColumns={visibleColumns}
              sortConfig={sortConfig}
              onSort={handleSort}
              columnFilters={columnFilters}
              onColumnFilterChange={setColumnFilter}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              statistics={statistics}
            />
          </div>
        )}
        <input
          id="file-upload-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFirstFileUpload(e.target.files[0]);
            }
          }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            CSV Browser | Made with React
          </p>
        </div>
      </footer>
    </div>
  );
}
