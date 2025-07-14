// 웹 환경에서는 사용하지 않는 더미 DatabaseManager
export class DatabaseManager {
  private static instance: DatabaseManager;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    console.log('Web environment: DatabaseManager.initialize() called but not implemented');
  }

  getDatabase(): any {
    throw new Error('DatabaseManager.getDatabase() not available in web environment');
  }

  async closeDatabase(): Promise<void> {
    console.log('Web environment: DatabaseManager.closeDatabase() called but not implemented');
  }

  async resetDatabase(): Promise<void> {
    console.log('Web environment: DatabaseManager.resetDatabase() called but not implemented');
  }
} 