import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertCsvFileSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with original extension
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload CSV file
  app.post('/api/csv/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const fileData = {
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        size: req.file.size,
        createdAt: new Date().toISOString(),
      };
      
      const validatedData = insertCsvFileSchema.parse(fileData);
      const savedFile = await storage.saveCsvFile(validatedData);
      
      return res.status(201).json(savedFile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'An unexpected error occurred' });
    }
  });
  
  // Get CSV file content
  app.get('/api/csv/:filename', async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return res.status(400).json({ message: 'Filename is required' });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return res.status(200).json({ content: fileContent });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'An unexpected error occurred' });
    }
  });
  
  // Setup a basic route to serve our Vue app from the Vue directory
  app.get('/vue', (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
          <title>Vue CSV Viewer - Easy CSV Data Exploration</title>
          <meta name="description" content="A powerful Vue.js CSV viewer that allows you to upload, view, sort, filter, and analyze your CSV data in a user-friendly interface.">
          <!-- Favicon -->
          <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233B82F6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /%3E%3C/svg%3E">
          <style>
            :root {
              --primary-color: #3b82f6;
              --primary-hover: #2563eb;
              --secondary-color: #e5e7eb;
              --text-color: #1f2937;
              --text-light: #6b7280;
              --white: #ffffff;
              --danger: #ef4444;
              --success: #10b981;
              --border-color: #e5e7eb;
              --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: var(--text-color);
              line-height: 1.5;
              background-color: #f9fafb;
            }
            
            .container {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            header {
              background-color: var(--white);
              box-shadow: var(--shadow);
              padding: 1rem;
            }
            
            .header-content {
              display: flex;
              align-items: center;
              max-width: 1200px;
              margin: 0 auto;
              width: 100%;
              padding: 0 1rem;
            }
            
            .logo-icon {
              width: 1.75rem;
              height: 1.75rem;
              color: var(--primary-color);
              margin-right: 0.75rem;
            }
            
            h1 {
              font-size: 1.5rem;
              font-weight: 600;
            }
            
            main {
              flex: 1;
              max-width: 1200px;
              width: 100%;
              margin: 0 auto;
              padding: 1.5rem 1rem;
            }
            
            .card {
              background-color: var(--white);
              border-radius: 0.5rem;
              box-shadow: var(--shadow);
              padding: 2rem;
              margin-bottom: 1.5rem;
            }
            
            .file-upload {
              border: 2px dashed var(--border-color);
              border-radius: 0.5rem;
              padding: 2rem;
              text-align: center;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            
            .file-upload:hover {
              border-color: var(--primary-color);
            }
            
            .upload-icon {
              width: 3rem;
              height: 3rem;
              color: #9ca3af;
              margin: 0 auto;
            }
            
            .hidden-input {
              display: none;
            }
            
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 0.375rem;
              padding: 0.5rem 1rem;
              font-weight: 500;
              font-size: 0.875rem;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            
            .btn-primary {
              background-color: var(--primary-color);
              color: var(--white);
              border: 1px solid var(--primary-color);
            }
            
            .btn-primary:hover {
              background-color: var(--primary-hover);
            }
            
            footer {
              background-color: var(--white);
              border-top: 1px solid var(--border-color);
              padding: 1rem;
              text-align: center;
              color: var(--text-light);
              font-size: 0.875rem;
            }
            
            .data-grid {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1rem;
            }
            
            .data-grid th {
              background-color: #f9fafb;
              font-weight: 500;
              text-align: left;
              padding: 0.75rem 1rem;
              border-bottom: 1px solid var(--border-color);
            }
            
            .data-grid td {
              padding: 0.75rem 1rem;
              border-bottom: 1px solid var(--border-color);
            }
            
            .data-grid tr:hover {
              background-color: #f9fafb;
            }
            
            .controls {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              margin-bottom: 1rem;
            }
            
            .control-buttons {
              display: flex;
              gap: 0.5rem;
              align-items: center;
            }
            
            .search-input {
              flex: 1;
              padding: 0.5rem 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 0.375rem;
              font-size: 0.875rem;
            }
            
            .select-input {
              padding: 0.5rem;
              border: 1px solid var(--border-color);
              border-radius: 0.375rem;
              background-color: var(--white);
              font-size: 0.875rem;
            }
            
            /* Modal styles */
            .modal {
              display: none;
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.5);
              z-index: 100;
              justify-content: center;
              align-items: center;
            }
            
            .modal-content {
              background-color: var(--white);
              border-radius: 0.5rem;
              width: 90%;
              max-width: 500px;
              max-height: 80vh;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .modal-header {
              padding: 1rem;
              border-bottom: 1px solid var(--border-color);
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .modal-body {
              padding: 1rem;
              overflow-y: auto;
              flex-grow: 1;
            }
            
            .modal-footer {
              padding: 1rem;
              border-top: 1px solid var(--border-color);
              display: flex;
              justify-content: flex-end;
            }
            
            .close-btn {
              background: none;
              border: none;
              font-size: 1.5rem;
              line-height: 1;
              cursor: pointer;
              color: var(--text-light);
            }
            
            .column-list {
              list-style: none;
              padding: 0;
              margin: 1rem 0;
            }
            
            .column-item {
              display: flex;
              align-items: center;
              padding: 0.5rem;
              border: 1px solid var(--border-color);
              margin-bottom: 0.5rem;
              background-color: var(--white);
              border-radius: 0.25rem;
              cursor: move;
            }
            
            .column-item:hover {
              background-color: #f9fafb;
            }
            
            .column-item .drag-handle {
              margin-right: 0.5rem;
              color: var(--text-light);
              cursor: grab;
            }
            
            .column-item label {
              display: flex;
              align-items: center;
              margin-left: 0.5rem;
              flex-grow: 1;
            }
            
            .column-item input[type="checkbox"] {
              margin-right: 0.5rem;
            }
            
            .btn-secondary {
              background-color: var(--white);
              color: var(--text-color);
              border: 1px solid var(--border-color);
            }
            
            .btn-secondary:hover {
              background-color: var(--secondary-color);
            }
            
            .pagination {
              display: flex;
              justify-content: center;
              margin-top: 1rem;
            }
            
            .pagination button {
              padding: 0.5rem 0.75rem;
              border: 1px solid var(--border-color);
              background: var(--white);
              cursor: pointer;
            }
            
            .pagination button.active {
              background-color: var(--primary-color);
              color: var(--white);
              border-color: var(--primary-color);
            }
            
            @media (max-width: 640px) {
              h1 {
                font-size: 1.25rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <header>
              <div class="header-content">
                <svg xmlns="http://www.w3.org/2000/svg" class="logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h1>Vue CSV Viewer</h1>
              </div>
            </header>
            <main>
              <div class="card">
                <h2>Upload CSV File</h2>
                <p style="margin-bottom: 1rem;">Upload a CSV file to visualize, sort, and filter your data.</p>
                
                <div class="file-upload" id="file-drop-zone">
                  <svg xmlns="http://www.w3.org/2000/svg" class="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p style="margin-top: 0.5rem;">
                    Drag and drop your CSV file here, or <span style="color: var(--primary-color); font-weight: 500; cursor: pointer;">browse</span>
                    <input id="file-input" type="file" accept=".csv" class="hidden-input">
                  </p>
                  <p style="margin-top: 0.25rem; font-size: 0.75rem; color: var(--text-light);">Supports CSV files up to 10MB</p>
                </div>
                
                <div id="file-info" style="display: none; margin-top: 1rem;"></div>
                <div id="loading-indicator" style="display: none; margin-top: 1rem; text-align: center;">
                  <div style="display: inline-block; width: 1.5rem; height: 1.5rem; border: 2px solid var(--primary-color); border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
                  <p>Processing file...</p>
                </div>
                <div id="error-message" style="display: none; margin-top: 1rem; padding: 1rem; background-color: #fef2f2; border-radius: 0.375rem; color: #b91c1c;"></div>
              </div>
              
              <div id="data-view" style="display: none;">
                <div class="card">
                  <div class="controls">
                    <input type="text" id="search-input" class="search-input" placeholder="Search in all columns...">
                    <div class="control-buttons">
                      <button id="column-settings-btn" class="btn btn-secondary">Column Settings</button>
                      <select id="rows-per-page" class="select-input">
                        <option value="10">10 rows</option>
                        <option value="25">25 rows</option>
                        <option value="50">50 rows</option>
                        <option value="100">100 rows</option>
                      </select>
                    </div>
                    <button id="download-btn" class="btn btn-primary">Download CSV</button>
                  </div>
                  
                  <!-- Column Settings Modal -->
                  <div id="column-settings-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h3>Column Settings</h3>
                        <button id="close-modal-btn" class="close-btn">&times;</button>
                      </div>
                      <div class="modal-body">
                        <p>Drag and drop to reorder columns. Toggle visibility with checkboxes.</p>
                        <ul id="column-list" class="column-list">
                          <!-- Column items will be added here dynamically -->
                        </ul>
                      </div>
                      <div class="modal-footer">
                        <button id="apply-columns-btn" class="btn btn-primary">Apply Changes</button>
                      </div>
                    </div>
                  </div>
                  
                  <div id="table-container" style="overflow-x: auto;">
                    <!-- Table will be inserted here -->
                  </div>
                  
                  <div id="pagination" class="pagination">
                    <!-- Pagination will be inserted here -->
                  </div>
                </div>
              </div>
            </main>
            <footer>
              <p>Vue CSV Viewer | Browser-based CSV Analysis Tool</p>
            </footer>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              // State variables
              let csvData = [];
              let currentFile = null;
              let columns = [];
              let visibleColumns = []; // Track visible columns
              let columnOrder = []; // Track column order
              let currentPage = 1;
              let rowsPerPage = 10;
              let searchTerm = '';
              
              // DOM Elements
              const fileDropZone = document.getElementById('file-drop-zone');
              const fileInput = document.getElementById('file-input');
              const fileInfo = document.getElementById('file-info');
              const loadingIndicator = document.getElementById('loading-indicator');
              const errorMessage = document.getElementById('error-message');
              const dataView = document.getElementById('data-view');
              const tableContainer = document.getElementById('table-container');
              const paginationElement = document.getElementById('pagination');
              const searchInput = document.getElementById('search-input');
              const downloadBtn = document.getElementById('download-btn');
              const rowsPerPageSelect = document.getElementById('rows-per-page');
              const columnSettingsBtn = document.getElementById('column-settings-btn');
              const columnSettingsModal = document.getElementById('column-settings-modal');
              const closeModalBtn = document.getElementById('close-modal-btn');
              const columnList = document.getElementById('column-list');
              const applyColumnsBtn = document.getElementById('apply-columns-btn');
              
              // Event Listeners
              fileDropZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
              });
              
              fileDropZone.addEventListener('dragenter', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.style.borderColor = 'var(--primary-color)';
                this.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
              });
              
              fileDropZone.addEventListener('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.style.borderColor = 'var(--border-color)';
                this.style.backgroundColor = 'transparent';
              });
              
              fileDropZone.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.style.borderColor = 'var(--border-color)';
                this.style.backgroundColor = 'transparent';
                
                if (e.dataTransfer.files.length > 0) {
                  handleFile(e.dataTransfer.files[0]);
                }
              });
              
              fileDropZone.addEventListener('click', function() {
                fileInput.click();
              });
              
              fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                  handleFile(this.files[0]);
                }
              });
              
              searchInput.addEventListener('input', function() {
                searchTerm = this.value.toLowerCase();
                currentPage = 1;
                renderTable();
              });
              
              downloadBtn.addEventListener('click', function() {
                downloadCSV();
              });
              
              // Rows per page select event
              rowsPerPageSelect.addEventListener('change', function() {
                rowsPerPage = parseInt(this.value);
                currentPage = 1;
                renderTable();
              });
              
              // Column settings button event
              columnSettingsBtn.addEventListener('click', function() {
                openColumnSettingsModal();
              });
              
              // Close modal button event
              closeModalBtn.addEventListener('click', function() {
                columnSettingsModal.style.display = 'none';
              });
              
              // Click outside modal to close
              window.addEventListener('click', function(event) {
                if (event.target === columnSettingsModal) {
                  columnSettingsModal.style.display = 'none';
                }
              });
              
              // Apply column changes event
              applyColumnsBtn.addEventListener('click', function() {
                applyColumnChanges();
                columnSettingsModal.style.display = 'none';
              });
              
              // Functions
              function handleFile(file) {
                // Check if file is CSV
                if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                  showError('Only CSV files are allowed');
                  return;
                }
                
                currentFile = file;
                showLoading();
                
                const formData = new FormData();
                formData.append('file', file);
                
                // Upload file
                fetch('/api/csv/upload', {
                  method: 'POST',
                  body: formData
                })
                .then(response => {
                  if (!response.ok) {
                    return response.json().then(data => {
                      throw new Error(data.message || 'Failed to upload file');
                    });
                  }
                  return response.json();
                })
                .then(fileData => {
                  // Get file content
                  return fetch(\`/api/csv/\${fileData.filename}\`);
                })
                .then(response => {
                  if (!response.ok) {
                    return response.json().then(data => {
                      throw new Error(data.message || 'Failed to read file content');
                    });
                  }
                  return response.json();
                })
                .then(data => {
                  const content = data.content;
                  parseCSV(content);
                })
                .catch(error => {
                  showError(error.message);
                });
              }
              
              function parseCSV(csvContent) {
                // Simple CSV parser (can be replaced with a more robust one)
                const lines = csvContent.split('\\n');
                const headers = lines[0].split(',').map(header => header.trim());
                
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (line) {
                    const values = line.split(',');
                    const row = {};
                    headers.forEach((header, index) => {
                      row[header] = values[index] ? values[index].trim() : '';
                    });
                    data.push(row);
                  }
                }
                
                csvData = data;
                columns = headers;
                currentPage = 1;
                
                showFileInfo();
                renderTable();
                hideLoading();
                dataView.style.display = 'block';
              }
              
              function renderTable() {
                // Filter data based on search term
                const filteredData = csvData.filter(row => 
                  Object.values(row).some(value => 
                    String(value).toLowerCase().includes(searchTerm)
                  )
                );
                
                // Calculate pagination
                const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
                const startIndex = (currentPage - 1) * rowsPerPage;
                const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
                
                // Create table
                let tableHTML = '<table class="data-grid">';
                
                // Table header
                tableHTML += '<thead><tr>';
                columns.forEach(column => {
                  tableHTML += \`<th>\${column}</th>\`;
                });
                tableHTML += '</tr></thead>';
                
                // Table body
                tableHTML += '<tbody>';
                if (paginatedData.length === 0) {
                  tableHTML += \`<tr><td colspan="\${columns.length}" style="text-align: center; padding: 2rem;">No data found</td></tr>\`;
                } else {
                  paginatedData.forEach(row => {
                    tableHTML += '<tr>';
                    columns.forEach(column => {
                      tableHTML += \`<td>\${row[column] || ''}</td>\`;
                    });
                    tableHTML += '</tr>';
                  });
                }
                tableHTML += '</tbody>';
                tableHTML += '</table>';
                
                tableContainer.innerHTML = tableHTML;
                renderPagination(totalPages);
              }
              
              function renderPagination(totalPages) {
                let paginationHTML = '';
                
                if (totalPages > 1) {
                  // Previous button
                  paginationHTML += \`<button \${currentPage === 1 ? 'disabled' : ''} onclick="changePage(\${currentPage - 1})">Previous</button>\`;
                  
                  // Page numbers
                  const maxVisiblePages = 5;
                  if (totalPages <= maxVisiblePages) {
                    for (let i = 1; i <= totalPages; i++) {
                      paginationHTML += \`<button class="\${currentPage === i ? 'active' : ''}" onclick="changePage(\${i})">\${i}</button>\`;
                    }
                  } else {
                    // Always show first page
                    paginationHTML += \`<button class="\${currentPage === 1 ? 'active' : ''}" onclick="changePage(1)">1</button>\`;
                    
                    // Calculate range around current page
                    const leftBound = Math.max(2, currentPage - 1);
                    const rightBound = Math.min(totalPages - 1, currentPage + 1);
                    
                    // Add ellipsis after first page if needed
                    if (leftBound > 2) {
                      paginationHTML += \`<button disabled>...</button>\`;
                    }
                    
                    // Add pages around current page
                    for (let i = leftBound; i <= rightBound; i++) {
                      paginationHTML += \`<button class="\${currentPage === i ? 'active' : ''}" onclick="changePage(\${i})">\${i}</button>\`;
                    }
                    
                    // Add ellipsis before last page if needed
                    if (rightBound < totalPages - 1) {
                      paginationHTML += \`<button disabled>...</button>\`;
                    }
                    
                    // Always show last page
                    paginationHTML += \`<button class="\${currentPage === totalPages ? 'active' : ''}" onclick="changePage(\${totalPages})">\${totalPages}</button>\`;
                  }
                  
                  // Next button
                  paginationHTML += \`<button \${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(\${currentPage + 1})">Next</button>\`;
                }
                
                paginationElement.innerHTML = paginationHTML;
                
                // Define changePage function in global scope
                window.changePage = function(page) {
                  currentPage = page;
                  renderTable();
                };
              }
              
              function showFileInfo() {
                if (currentFile) {
                  fileInfo.innerHTML = \`
                    <div style="display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" style="width: 1.25rem; height: 1.25rem; color: var(--primary-color); margin-right: 0.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span style="font-weight: 500;">\${currentFile.name}</span>
                      <span style="color: var(--text-light); margin-left: 0.5rem;">(\${formatFileSize(currentFile.size)})</span>
                      <button style="margin-left: 0.5rem; background: none; border: none; cursor: pointer; color: var(--text-light);" onclick="removeFile()">
                        <svg xmlns="http://www.w3.org/2000/svg" style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  \`;
                  fileInfo.style.display = 'block';
                  
                  // Define removeFile function in global scope
                  window.removeFile = function() {
                    currentFile = null;
                    csvData = [];
                    columns = [];
                    fileInfo.style.display = 'none';
                    dataView.style.display = 'none';
                    fileInput.value = '';
                  };
                }
              }
              
              function showLoading() {
                loadingIndicator.style.display = 'block';
                errorMessage.style.display = 'none';
              }
              
              function hideLoading() {
                loadingIndicator.style.display = 'none';
              }
              
              function showError(message) {
                errorMessage.textContent = message;
                errorMessage.style.display = 'block';
                loadingIndicator.style.display = 'none';
              }
              
              function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
              }
              
              function downloadCSV() {
                if (csvData.length === 0) return;
                
                let csvContent = columns.join(',') + '\\n';
                
                // Filter data based on search term
                const filteredData = csvData.filter(row => 
                  Object.values(row).some(value => 
                    String(value).toLowerCase().includes(searchTerm)
                  )
                );
                
                filteredData.forEach(row => {
                  const rowData = columns.map(column => row[column] || '');
                  csvContent += rowData.join(',') + '\\n';
                });
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', \`\${currentFile.name.split('.')[0] || 'data'}_filtered.csv\`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
              
              // Column management functions
              function openColumnSettingsModal() {
                // Initialize or update column list
                refreshColumnList();
                
                // Show modal
                columnSettingsModal.style.display = 'flex';
              }
              
              function refreshColumnList() {
                // Clear current list
                columnList.innerHTML = '';
                
                // Get columns to display
                const columnsToDisplay = columnOrder.length > 0 ? columnOrder : columns;
                
                // Create items for each column
                columnsToDisplay.forEach((column, index) => {
                  const isVisible = visibleColumns.length === 0 || visibleColumns.includes(column);
                  
                  const li = document.createElement('li');
                  li.className = 'column-item';
                  li.draggable = true;
                  li.dataset.column = column;
                  
                  // Add drag handle
                  const dragHandle = document.createElement('span');
                  dragHandle.className = 'drag-handle';
                  dragHandle.innerHTML = '&#9776;'; // hamburger icon
                  li.appendChild(dragHandle);
                  
                  // Add checkbox and label
                  const label = document.createElement('label');
                  
                  const checkbox = document.createElement('input');
                  checkbox.type = 'checkbox';
                  checkbox.checked = isVisible;
                  checkbox.addEventListener('change', function() {
                    // This will be processed when applying changes
                  });
                  
                  label.appendChild(checkbox);
                  label.appendChild(document.createTextNode(column));
                  
                  li.appendChild(label);
                  columnList.appendChild(li);
                });
                
                // Add drag and drop functionality
                setupDragAndDrop();
              }
              
              function setupDragAndDrop() {
                const items = columnList.querySelectorAll('.column-item');
                
                items.forEach(item => {
                  item.addEventListener('dragstart', handleDragStart);
                  item.addEventListener('dragover', handleDragOver);
                  item.addEventListener('dragleave', handleDragLeave);
                  item.addEventListener('drop', handleDrop);
                  item.addEventListener('dragend', handleDragEnd);
                });
              }
              
              let draggedItem = null;
              
              function handleDragStart(e) {
                draggedItem = this;
                this.style.opacity = '0.4';
                
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.innerHTML);
              }
              
              function handleDragOver(e) {
                if (e.preventDefault) {
                  e.preventDefault();
                }
                
                e.dataTransfer.dropEffect = 'move';
                this.classList.add('over');
                
                return false;
              }
              
              function handleDragLeave(e) {
                this.classList.remove('over');
              }
              
              function handleDrop(e) {
                if (e.stopPropagation) {
                  e.stopPropagation();
                }
                
                if (draggedItem !== this) {
                  // Get the positions
                  const items = Array.from(columnList.querySelectorAll('.column-item'));
                  const fromIndex = items.indexOf(draggedItem);
                  const toIndex = items.indexOf(this);
                  
                  // Re-order in DOM
                  if (fromIndex < toIndex) {
                    columnList.insertBefore(draggedItem, this.nextSibling);
                  } else {
                    columnList.insertBefore(draggedItem, this);
                  }
                }
                
                return false;
              }
              
              function handleDragEnd(e) {
                this.style.opacity = '1';
                
                columnList.querySelectorAll('.column-item').forEach(item => {
                  item.classList.remove('over');
                });
              }
              
              function applyColumnChanges() {
                // Get current order from UI
                const items = columnList.querySelectorAll('.column-item');
                
                // Update column order
                columnOrder = Array.from(items).map(item => item.dataset.column);
                
                // Update visible columns
                visibleColumns = Array.from(items)
                  .filter(item => item.querySelector('input[type="checkbox"]').checked)
                  .map(item => item.dataset.column);
                
                // Re-render table with new settings
                renderTable();
              }
              
              // Add CSS animation for spinner
              const style = document.createElement('style');
              style.textContent = \`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              \`;
              document.head.appendChild(style);
            });
          </script>
        </body>
      </html>
    `);
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
