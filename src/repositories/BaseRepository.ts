import { Platform } from 'react-native';
import { DatabaseManager } from '../database/DatabaseManager';

export abstract class BaseRepository<T> {
  protected getDb(): any {
    if (Platform.OS === 'web') {
      throw new Error('Database not available in web environment');
    }
    return DatabaseManager.getInstance().getDatabase();
  }

  protected async executeQuery(
    query: string, 
    params: any[] = []
  ): Promise<any> {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          query,
          params,
          (tx: any, result: any) => resolve(result),
          (tx: any, error: any) => {
            console.error('SQL Error:', error);
            reject(error);
          }
        );
      });
    });
  }

  protected async executeBatch(queries: Array<{ query: string; params: any[] }>): Promise<void> {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.transaction((tx: any) => {
        queries.forEach(({ query, params }) => {
          tx.executeSql(
            query,
            params,
            () => {}, // success callback
            (tx: any, error: any) => {
              console.error('Batch SQL Error:', error);
              reject(error);
            }
          );
        });
      }, 
      (error: any) => {
        console.error('Transaction Error:', error);
        reject(error);
      },
      () => {
        resolve();
      });
    });
  }

  // 추상 메서드들 - 각 Repository에서 구현해야 함
  abstract findAll(): Promise<T[]>;
  abstract findById(id: string | number): Promise<T | null>;
  abstract create(data: Omit<T, 'id'>): Promise<T>;
  abstract update(id: string | number, data: Partial<T>): Promise<T>;
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

  protected booleanToInteger(value: boolean): number {
    return value ? 1 : 0;
  }

  protected integerToBoolean(value: number): boolean {
    return value === 1;
  }

  // 데이터베이스 준비 상태 확인
  protected isDatabaseReady(): boolean {
    if (Platform.OS === 'web') return false;
    return DatabaseManager.getInstance().isReady();
  }
} 