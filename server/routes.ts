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
  
  // Route to serve Vue app
  app.get('/vue', (req: Request, res: Response) => {
    const vueIndexPath = path.join(process.cwd(), 'vue-csv-viewer', 'index.html');
    res.sendFile(vueIndexPath);
  });
  
  // Serve static files for Vue app
  app.use('/vue-assets', (req: Request, res: Response, next: NextFunction) => {
    const filePath = path.join(process.cwd(), 'vue-csv-viewer', req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
