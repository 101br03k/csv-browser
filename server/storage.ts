import { users, type User, type InsertUser, type CsvFile, type InsertCsvFile } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // CSV file operations
  saveCsvFile(file: InsertCsvFile): Promise<CsvFile>;
  getCsvFile(id: number): Promise<CsvFile | undefined>;
  getAllCsvFiles(): Promise<CsvFile[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private csvFiles: Map<number, CsvFile>;
  currentUserId: number;
  currentCsvFileId: number;

  constructor() {
    this.users = new Map();
    this.csvFiles = new Map();
    this.currentUserId = 1;
    this.currentCsvFileId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async saveCsvFile(file: InsertCsvFile): Promise<CsvFile> {
    const id = this.currentCsvFileId++;
    const csvFile: CsvFile = { ...file, id };
    this.csvFiles.set(id, csvFile);
    return csvFile;
  }
  
  async getCsvFile(id: number): Promise<CsvFile | undefined> {
    return this.csvFiles.get(id);
  }
  
  async getAllCsvFiles(): Promise<CsvFile[]> {
    return Array.from(this.csvFiles.values());
  }
}

export const storage = new MemStorage();
