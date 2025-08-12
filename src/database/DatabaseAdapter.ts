import { DatabaseManager } from './DatabaseManager';

export interface IDatabaseAdapter {
  initialize(): Promise<void>;
  initializeSchema(): Promise<void>;
  getAllRows(sql: string, params?: any[]): Promise<any[]>;
  runSql(sql: string, params?: any[]): Promise<any>;
  resetDatabase(): Promise<void>;
  closeDatabase(): Promise<void>;
}

class NativeDatabaseAdapter implements IDatabaseAdapter {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async initialize() {
    await this.dbManager.initialize();
  }
  async initializeSchema() {
    await this.dbManager.initializeSchema();
  }

  async getAllRows(sql: string, params: any[] = []): Promise<any[]> {
    const db = this.dbManager.getDatabase();
    const result = await db.getAllAsync(sql, params);
    return result;
  }

  async runSql(sql: string, params: any[] = []): Promise<any> {
    const db = this.dbManager.getDatabase();
    const result = await db.runAsync(sql, params);
    return result;
  }

  async resetDatabase(): Promise<void> {
    await this.dbManager.resetDatabase();
  }

  async closeDatabase(): Promise<void> {
    await this.dbManager.closeDatabase();
  }
}

export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private adapter: IDatabaseAdapter;

  private constructor() {
    console.log('Using NativeDatabaseAdapter for all environments');
    this.adapter = new NativeDatabaseAdapter();
  }

  static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  async initializeSchema(): Promise<void> {
    await this.adapter.initializeSchema();
  }

  async getAllRows(sql: string, params: any[] = []): Promise<any[]> {
    return await this.adapter.getAllRows(sql, params);
  }

  async runSql(sql: string, params: any[] = []): Promise<any> {
    return await this.adapter.runSql(sql, params);
  }

  async resetDatabase(): Promise<void> {
    await this.adapter.resetDatabase();
  }

  async closeDatabase(): Promise<void> {
    await this.adapter.closeDatabase();
  }

  async bootstrap() {
    await this.initialize();
    await this.initializeSchema();
  }
} 