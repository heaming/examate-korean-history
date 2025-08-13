import { DatabaseAdapter } from '../database/DatabaseAdapter';

export abstract class BaseRepository<T> {
  protected dbAdapter: DatabaseAdapter;

  constructor() {
    this.dbAdapter = DatabaseAdapter.getInstance();
  }

  protected async executeQuery(
    query: string, 
    params: any[] = []
  ): Promise<any> {
    // SELECT 쿼리인지 확인
    const isSelectQuery = query.trim().toLowerCase().startsWith('select');
    
    if (isSelectQuery) {
      const rows = await this.dbAdapter.getAllRows(query, params);
      // expo-sqlite 형식으로 변환
      return {
        rows: {
          length: rows.length,
          item: (index: number) => rows[index],
          _array: rows
        }
      };
    } else {
      const result = await this.dbAdapter.runSql(query, params);
      return {
        rowsAffected: result.changes || 0,
        insertId: result.lastInsertRowid || 0
      };
    }
  }

  protected async executeBatch(queries: Array<{ query: string; params: any[] }>): Promise<void> {
    try {
      for (const { query, params } of queries) {
        await this.dbAdapter.runSql(query, params);
      }
    } catch (error) {
      console.error('Batch SQL Error:', error);
      throw error;
    }
  }

  // 추상 메서드들 - 각 Repository에서 구현해야 함
  abstract findAll(): Promise<T[]>;
  abstract findById(id: string | number): Promise<T | null>;
  abstract create(data: Omit<T, 'id'>): Promise<T>;
  abstract update(id: string | number, data: Partial<T>): Promise<T | null>;
  abstract delete(id: string | number): Promise<boolean>;

  // 공통 유틸리티 메서드들
  protected mapRowToObject(row: any): any {
    const obj: any = {};
    for (let i = 0; i < row.length; i++) {
      const key = row.item(i);
      obj[key] = row.item(i)[key];
    }
    return obj;
  }

  protected parseJsonField(value: string | null): any {
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      return [];
    }
  }

  protected stringifyJsonField(value: any): string {
    try {
      return JSON.stringify(value || []);
    } catch (error) {
      console.error('JSON Stringify Error:', error);
      return '[]';
    }
  }

  protected booleanToInteger(value?: boolean | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value ? 1 : 0;
  }

  protected integerToBoolean(value?: number | null): boolean | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value === 1;
  }

  // 데이터베이스 준비 상태 확인
  protected isDatabaseReady(): boolean {
    return this.dbAdapter !== null;
  }

  async cleanup(): Promise<void> {
    try {
      console.log(`Cleaning up ${this.constructor.name}...`);
      console.log(`${this.constructor.name} cleaned up`);
    } catch (error) {
      console.error(`Error during ${this.constructor.name} cleanup:`, error);
    }
  }
} 