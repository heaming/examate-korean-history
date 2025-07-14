import { Platform } from 'react-native';
import { WebDatabaseManager } from './WebDatabaseManager';

export interface IDatabaseAdapter {
  initialize(): Promise<void>;
  getAllRows(sql: string, params?: any[]): Promise<any[]>;
  runSql(sql: string, params?: any[]): Promise<any>;
  resetDatabase(): Promise<void>;
  closeDatabase(): Promise<void>;
}

class NativeDatabaseAdapter implements IDatabaseAdapter {
  private dbManager: any;

  constructor() {
    if (Platform.OS === 'web') {
      throw new Error('NativeDatabaseAdapter cannot be used in web environment');
    }
    // 동적으로 DatabaseManager 로드
    const { DatabaseManager } = require('./DatabaseManager');
    this.dbManager = DatabaseManager.getInstance();
  }

  async initialize(): Promise<void> {
    await this.dbManager.initialize();
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

class WebDatabaseAdapter implements IDatabaseAdapter {
  private webDbManager: WebDatabaseManager;

  constructor() {
    this.webDbManager = WebDatabaseManager.getInstance();
  }

  async initialize(): Promise<void> {
    await this.webDbManager.initialize();
  }

  async getAllRows(sql: string, params: any[] = []): Promise<any[]> {
    return await this.webDbManager.getAllRows(sql, params);
  }

  async runSql(sql: string, params: any[] = []): Promise<any> {
    return await this.webDbManager.runSql(sql, params);
  }

  async resetDatabase(): Promise<void> {
    await this.webDbManager.resetDatabase();
  }

  async closeDatabase(): Promise<void> {
    this.webDbManager.closeDatabase();
  }
}

export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private adapter: IDatabaseAdapter;

  private constructor() {
    // 웹 환경에서는 항상 웹 데이터베이스 사용
    if (Platform.OS === 'web') {
      console.log('Using WebDatabaseAdapter for web environment');
      this.adapter = new WebDatabaseAdapter();
    } else {
      console.log('Using NativeDatabaseAdapter for native environment');
      this.adapter = new NativeDatabaseAdapter();
    }
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

  // 개발용 헬퍼 메서드들
  isUsingWebDatabase(): boolean {
    return this.adapter instanceof WebDatabaseAdapter;
  }

  // 웹 데이터베이스 전용 메서드들 (개발용)
  exportWebDatabase(): Uint8Array | null {
    if (this.adapter instanceof WebDatabaseAdapter) {
      return this.adapter['webDbManager'].exportDatabase();
    }
    return null;
  }

  importWebDatabase(data: Uint8Array): void {
    if (this.adapter instanceof WebDatabaseAdapter) {
      this.adapter['webDbManager'].importDatabase(data);
    }
  }
} 