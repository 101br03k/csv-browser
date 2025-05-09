<template>
  <div class="csv-viewer">
    <!-- File Upload Section -->
    <div class="card mb-4">
      <div class="card-body">
        <h2 class="text-lg font-medium mb-4">Upload CSV File</h2>
        
        <!-- File Drop Zone -->
        <div 
          class="file-drop-zone"
          :class="{ 'file-drop-active': isDragging }"
          @dragover.prevent
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileDrop"
          @click="triggerFileInput"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="upload-text">
            Drag and drop your CSV file here, or <span class="upload-browse">browse</span>
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              class="hidden-input"
              @change="handleFileSelect"
            />
          </p>
          <p class="upload-hint">Supports CSV files up to 10MB</p>
        </div>
        
        <!-- File Info -->
        <div v-if="file" class="file-info">
          <svg xmlns="http://www.w3.org/2000/svg" class="file-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">({{ formatFileSize(file.size) }})</span>
          <button class="file-remove" @click.stop="removeFile">
            <svg xmlns="http://www.w3.org/2000/svg" class="remove-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Loading State -->
        <div v-if="loading" class="loading">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing file...</span>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" class="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="error-title">Error processing file</h3>
            <p class="error-text">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Data State -->
    <div v-if="!csvData.length && !loading" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="empty-title">No data to display</h3>
      <p class="empty-text">Upload a CSV file to get started</p>
    </div>
    
    <!-- Data Display Section -->
    <div v-if="csvData.length > 0" class="data-section">
      <!-- Data Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <h3 class="stat-label">Total Rows</h3>
          <p class="stat-value">{{ statistics.totalRows.toLocaleString() }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-label">Displayed Rows</h3>
          <p class="stat-value">{{ statistics.displayedRows.toLocaleString() }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-label">Columns</h3>
          <p class="stat-value">{{ statistics.columns }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-label">File Size</h3>
          <p class="stat-value">{{ formatFileSize(file ? file.size : 0) }}</p>
        </div>
      </div>
      
      <!-- Data Controls -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="controls-grid">
            <!-- Search Input -->
            <div class="search-container">
              <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search in all columns..."
                v-model="searchTerm"
                class="search-input"
              />
            </div>
            
            <!-- Column Visibility -->
            <div class="column-selector">
              <button 
                class="btn btn-secondary"
                @click="toggleColumnSelector"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Columns
              </button>
              
              <!-- Column Selector Dropdown -->
              <div v-if="isColumnSelectorOpen" class="column-dropdown" ref="columnDropdown">
                <div class="column-dropdown-header">
                  <label class="column-checkbox">
                    <input
                      type="checkbox"
                      :checked="allColumnsSelected"
                      @change="toggleAllColumns"
                    />
                    <span>Toggle all columns</span>
                  </label>
                </div>
                
                <div class="column-dropdown-items">
                  <label 
                    v-for="column in columns" 
                    :key="column.id" 
                    class="column-checkbox"
                  >
                    <input
                      type="checkbox"
                      :checked="visibleColumns.includes(column.id)"
                      @change="toggleColumn(column.id)"
                    />
                    <span>{{ column.name }}</span>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Row Count Selector -->
            <div class="rows-selector">
              <label for="rows-per-page">Rows per page:</label>
              <select 
                id="rows-per-page" 
                v-model="rowsPerPage" 
                class="select-input"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            
            <!-- Download Button -->
            <div class="download-container">
              <button 
                class="btn btn-primary" 
                @click="downloadCSV" 
                :disabled="!csvData.length"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
          
          <!-- Active Filters -->
          <div v-if="activeFilters.length > 0" class="active-filters">
            <span 
              v-for="filter in activeFilters" 
              :key="filter.column" 
              class="filter-tag"
            >
              {{ filter.columnName }}: {{ filter.value }}
              <button 
                class="filter-remove" 
                @click="removeFilter(filter.column)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="tag-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
            
            <button
              class="clear-filters"
              @click="clearAllFilters"
            >
              Clear all filters
            </button>
          </div>
        </div>
      </div>
      
      <!-- Data Table -->
      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="column in visibleColumnsList" :key="column.id">
                  <div class="th-content" @click="handleSort(column.id)">
                    <span>{{ column.name }}</span>
                    <!-- Sort icons -->
                    <svg v-if="sortConfig.column === column.id && sortConfig.direction === 'asc'" xmlns="http://www.w3.org/2000/svg" class="sort-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                    <svg v-else-if="sortConfig.column === column.id && sortConfig.direction === 'desc'" xmlns="http://www.w3.org/2000/svg" class="sort-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="sort-icon sort-icon-default" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <div class="filter-container">
                    <input
                      type="text"
                      :placeholder="`Filter ${column.name}...`"
                      :value="columnFilters[column.id]?.value || ''"
                      @input="updateColumnFilter(column.id, $event)"
                      class="filter-input"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td :colspan="visibleColumnsList.length" class="empty-table">
                  <svg xmlns="http://www.w3.org/2000/svg" class="empty-table-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="empty-table-title">No matching records found</p>
                  <p class="empty-table-text">Try adjusting your search or filter to find what you're looking for.</p>
                </td>
              </tr>
              <tr v-for="(row, rowIndex) in paginatedData" :key="rowIndex" class="data-row">
                <td v-for="column in visibleColumnsList" :key="column.id" class="data-cell">
                  {{ row[column.id] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="pagination-container">
          <div class="pagination-info">
            <p>
              Showing 
              <span class="font-medium">{{ startIndex + 1 }}</span>
              to
              <span class="font-medium">{{ endIndex }}</span>
              of
              <span class="font-medium">{{ statistics.displayedRows }}</span>
              results
            </p>
          </div>
          <div class="pagination-controls">
            <button 
              class="pagination-btn" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="pagination-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              v-for="page in displayedPages" 
              :key="page" 
              class="page-btn"
              :class="{ 'page-btn-active': currentPage === page, 'page-btn-ellipsis': page === '...' }"
              :disabled="page === '...'"
              @click="page !== '...' && (currentPage = page)"
            >
              {{ page }}
            </button>
            
            <button 
              class="pagination-btn" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="pagination-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Papa from 'papaparse';

export default {
  name: 'CSVViewer',
  data() {
    return {
      // File state
      file: null,
      loading: false,
      error: null,
      isDragging: false,
      
      // CSV data
      csvData: [],
      columns: [],
      visibleColumns: [],
      
      // Filters and sorting
      searchTerm: '',
      sortConfig: { column: '', direction: 'asc' },
      columnFilters: {},
      
      // Pagination
      currentPage: 1,
      rowsPerPage: 10,
      
      // UI state
      isColumnSelectorOpen: false,
    };
  },
  computed: {
    // List of columns that are currently visible
    visibleColumnsList() {
      return this.columns.filter(col => this.visibleColumns.includes(col.id));
    },
    
    // Check if all columns are selected
    allColumnsSelected() {
      return this.columns.length > 0 && this.visibleColumns.length === this.columns.length;
    },
    
    // Get filtered and sorted data
    filteredData() {
      // Create a copy of the data
      let filtered = [...this.csvData];
      
      // Apply search across all columns if there's a search term
      if (this.searchTerm.trim() !== '') {
        const searchTermLower = this.searchTerm.toLowerCase();
        filtered = filtered.filter(row => {
          return Object.values(row).some(value => 
            String(value).toLowerCase().includes(searchTermLower)
          );
        });
      }
      
      // Apply column filters
      Object.values(this.columnFilters).forEach(filter => {
        if (filter.value.trim() !== '') {
          const filterValueLower = filter.value.toLowerCase();
          filtered = filtered.filter(row => {
            const cellValue = String(row[filter.column] || '');
            return cellValue.toLowerCase().includes(filterValueLower);
          });
        }
      });
      
      // Apply sorting
      if (this.sortConfig.column) {
        filtered.sort((a, b) => {
          const aValue = a[this.sortConfig.column];
          const bValue = b[this.sortConfig.column];
          
          // Handle numeric values
          if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
            return this.sortConfig.direction === 'asc' 
              ? Number(aValue) - Number(bValue)
              : Number(bValue) - Number(aValue);
          }
          
          // Handle string values
          const aValueStr = String(aValue || '').toLowerCase();
          const bValueStr = String(bValue || '').toLowerCase();
          
          if (this.sortConfig.direction === 'asc') {
            return aValueStr.localeCompare(bValueStr);
          } else {
            return bValueStr.localeCompare(aValueStr);
          }
        });
      }
      
      return filtered;
    },
    
    // Total number of pages
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredData.length / this.rowsPerPage));
    },
    
    // Pagination start index
    startIndex() {
      return (this.currentPage - 1) * this.rowsPerPage;
    },
    
    // Pagination end index
    endIndex() {
      return Math.min(this.startIndex + this.rowsPerPage, this.filteredData.length);
    },
    
    // Data for current page
    paginatedData() {
      return this.filteredData.slice(this.startIndex, this.endIndex);
    },
    
    // Statistics
    statistics() {
      return {
        totalRows: this.csvData.length,
        displayedRows: this.filteredData.length,
        columns: this.columns.length
      };
    },
    
    // Active filters
    activeFilters() {
      return Object.entries(this.columnFilters)
        .filter(([_, filter]) => filter.value.trim() !== '')
        .map(([column, filter]) => ({
          column,
          value: filter.value,
          columnName: this.columns.find(col => col.id === column)?.name || column
        }));
    },
    
    // Calculated displayed pages for pagination
    displayedPages() {
      const maxVisiblePages = 5;
      const pages = [];
      
      if (this.totalPages <= maxVisiblePages) {
        // Show all pages if there are 5 or fewer
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);
        
        // Calculate range around current page
        const leftBound = Math.max(2, this.currentPage - 1);
        const rightBound = Math.min(this.totalPages - 1, this.currentPage + 1);
        
        // Add ellipsis after first page if needed
        if (leftBound > 2) {
          pages.push('...');
        }
        
        // Add pages around current page
        for (let i = leftBound; i <= rightBound; i++) {
          pages.push(i);
        }
        
        // Add ellipsis before last page if needed
        if (rightBound < this.totalPages - 1) {
          pages.push('...');
        }
        
        // Always show last page
        if (this.totalPages > 1) {
          pages.push(this.totalPages);
        }
      }
      
      return pages;
    }
  },
  watch: {
    // Reset to first page when total pages changes
    totalPages(newVal) {
      if (this.currentPage > newVal) {
        this.currentPage = newVal;
      }
    }
  },
  mounted() {
    // Add click outside listener for column selector
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    // Format file size for display
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Handle file drop
    handleFileDrop(e) {
      this.isDragging = false;
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          this.processFile(file);
        } else {
          this.error = "Only CSV files are allowed";
        }
      }
    },
    
    // Trigger file input when drop zone is clicked
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    // Handle file selection from input
    handleFileSelect(e) {
      if (e.target.files && e.target.files.length > 0) {
        this.processFile(e.target.files[0]);
      }
    },
    
    // Process the CSV file
    async processFile(file) {
      this.loading = true;
      this.error = null;
      this.file = file;
      
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
              this.error = `Error parsing CSV: ${results.errors[0].message}`;
              this.loading = false;
              return;
            }

            // Extract data and headers
            const parsedData = results.data;
            const headers = results.meta.fields || [];
            
            // Create columns data
            const columnData = headers.map(header => ({
              id: header,
              name: header,
            }));
            
            this.csvData = parsedData;
            this.columns = columnData;
            this.visibleColumns = headers;
            
            // Reset filters, sorting, and pagination
            this.searchTerm = '';
            this.sortConfig = { column: '', direction: 'asc' };
            this.columnFilters = {};
            this.currentPage = 1;
            
            this.loading = false;
          },
          error: (error) => {
            this.error = `Error parsing CSV: ${error.message}`;
            this.loading = false;
          },
        });
      } catch (err) {
        this.error = err.message || "An error occurred while processing the file";
        this.loading = false;
      }
    },
    
    // Remove file and reset state
    removeFile() {
      this.file = null;
      this.csvData = [];
      this.columns = [];
      this.visibleColumns = [];
      this.searchTerm = '';
      this.sortConfig = { column: '', direction: 'asc' };
      this.columnFilters = {};
      this.currentPage = 1;
      this.error = null;
    },
    
    // Toggle column visibility dropdown
    toggleColumnSelector() {
      this.isColumnSelectorOpen = !this.isColumnSelectorOpen;
    },
    
    // Close column selector when clicking outside
    handleClickOutside(event) {
      const dropdown = this.$refs.columnDropdown;
      
      if (dropdown && !dropdown.contains(event.target) && 
          !event.target.closest('.btn-secondary')) {
        this.isColumnSelectorOpen = false;
      }
    },
    
    // Toggle column visibility
    toggleColumn(columnId) {
      if (this.visibleColumns.includes(columnId)) {
        this.visibleColumns = this.visibleColumns.filter(col => col !== columnId);
      } else {
        this.visibleColumns.push(columnId);
      }
    },
    
    // Toggle all columns
    toggleAllColumns(event) {
      const checked = event.target ? event.target.checked : event;
      
      if (checked) {
        this.visibleColumns = this.columns.map(col => col.id);
      } else {
        this.visibleColumns = [];
      }
    },
    
    // Handle sorting
    handleSort(column) {
      if (this.sortConfig.column === column) {
        this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortConfig.column = column;
        this.sortConfig.direction = 'asc';
      }
    },
    
    // Update column filter
    updateColumnFilter(column, event) {
      const value = event.target.value;
      
      this.columnFilters = {
        ...this.columnFilters,
        [column]: { column, value }
      };
      
      // Reset to first page when filtering
      this.currentPage = 1;
    },
    
    // Remove filter
    removeFilter(column) {
      const newFilters = { ...this.columnFilters };
      delete newFilters[column];
      this.columnFilters = newFilters;
      
      // Reset to first page
      this.currentPage = 1;
    },
    
    // Clear all filters
    clearAllFilters() {
      this.columnFilters = {};
      this.searchTerm = '';
      this.currentPage = 1;
    },
    
    // Download CSV
    downloadCSV() {
      if (this.filteredData.length === 0) return;
      
      // Convert data to CSV
      const csv = Papa.unparse({
        fields: this.visibleColumns,
        data: this.filteredData.map(row => {
          const newRow = {};
          this.visibleColumns.forEach(column => {
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
      link.setAttribute('download', `${this.file?.name.split('.')[0] || 'data'}_filtered.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>

<style scoped>
.csv-viewer {
  width: 100%;
}

/* File Upload Section */
.file-drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-drop-zone:hover {
  border-color: var(--primary-color);
}

.file-drop-active {
  border-color: var(--primary-color);
  background-color: rgba(59, 130, 246, 0.05);
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  color: #9ca3af;
  margin: 0 auto;
}

.upload-text {
  margin-top: 0.5rem;
  color: var(--text-color);
}

.upload-browse {
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
}

.upload-hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-light);
}

.hidden-input {
  display: none;
}

.file-info {
  display: flex;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.file-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary-color);
  margin-right: 0.5rem;
}

.file-name {
  font-weight: 500;
  color: var(--text-color);
  margin-right: 0.5rem;
}

.file-size {
  color: var(--text-light);
  margin-right: 0.5rem;
}

.file-remove {
  color: var(--text-light);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-remove:hover {
  color: var(--danger);
}

.remove-icon {
  width: 1rem;
  height: 1rem;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
  color: var(--text-color);
  font-size: 0.875rem;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner-circle {
  opacity: 0.25;
}

.spinner-path {
  opacity: 0.75;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fef2f2;
  border-radius: 0.375rem;
  display: flex;
  align-items: flex-start;
}

.error-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--danger);
  margin-right: 0.75rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-title {
  font-weight: 500;
  color: #991b1b;
  font-size: 0.875rem;
}

.error-text {
  margin-top: 0.25rem;
  color: #b91c1c;
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  background-color: var(--white);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 3rem;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin: 0 auto;
}

.empty-title {
  margin-top: 1rem;
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-color);
}

.empty-text {
  margin-top: 0.25rem;
  color: var(--text-light);
}

/* Data Statistics */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background-color: var(--white);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 1rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  margin-top: 0.25rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

/* Data Controls */
.controls-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .controls-grid {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    align-items: center;
  }
}

.search-container {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--text-light);
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.column-selector {
  position: relative;
}

.column-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  width: 14rem;
  background-color: var(--white);
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 20;
  overflow: hidden;
}

.column-dropdown-header {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.column-dropdown-items {
  max-height: 15rem;
  overflow-y: auto;
}

.column-checkbox {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.column-checkbox:hover {
  background-color: #f9fafb;
}

.column-checkbox input {
  margin-right: 0.5rem;
}

.rows-selector {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.rows-selector label {
  margin-right: 0.5rem;
  color: var(--text-color);
}

.select-input {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--white);
  font-size: 0.875rem;
}

.select-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.download-container {
  display: flex;
  justify-content: flex-end;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background-color: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

.filter-remove {
  margin-left: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  background: none;
  border: none;
  color: #0ea5e9;
  cursor: pointer;
}

.filter-remove:hover {
  color: #0284c7;
}

.tag-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.clear-filters {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background-color: #f3f4f6;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
}

.clear-filters:hover {
  background-color: #e5e7eb;
}

/* Data Table */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  background-color: #f9fafb;
  font-weight: 500;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.th-content:hover .sort-icon-default {
  opacity: 1;
}

.sort-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

.sort-icon-default {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.filter-container {
  padding-top: 0.5rem;
}

.filter-input {
  width: 100%;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.filter-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.data-table td {
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  white-space: nowrap;
}

.data-row:hover {
  background-color: #f9fafb;
}

.empty-table {
  text-align: center;
  padding: 4rem 2rem !important;
}

.empty-table-icon {
  width: 3rem;
  height: 3rem;
  color: #d1d5db;
  margin: 0 auto;
}

.empty-table-title {
  margin-top: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.empty-table-text {
  margin-top: 0.25rem;
  color: var(--text-light);
  font-size: 0.875rem;
}

/* Pagination */
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

@media (min-width: 640px) {
  .pagination-container {
    flex-direction: row;
    justify-content: space-between;
  }
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-color);
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .pagination-info {
    margin-bottom: 0;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-color);
  background-color: var(--white);
  color: var(--text-color);
  cursor: pointer;
}

.pagination-btn:first-child {
  border-top-left-radius: 0.375rem;
  border-bottom-left-radius: 0.375rem;
}

.pagination-btn:last-child {
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-icon {
  width: 1rem;
  height: 1rem;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-color);
  background-color: var(--white);
  color: var(--text-color);
  margin-left: -1px;
  font-size: 0.875rem;
  cursor: pointer;
}

.page-btn-active {
  background-color: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
  position: relative;
  z-index: 1;
}

.page-btn-ellipsis {
  cursor: default;
}
</style>