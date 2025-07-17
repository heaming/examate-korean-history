import { DatabaseAdapter } from '../database/DatabaseAdapter';

export class WebDatabaseDebugger {
  private dbAdapter: DatabaseAdapter;

  constructor() {
    this.dbAdapter = DatabaseAdapter.getInstance();
  }

  // 모든 테이블의 데이터를 콘솔에 출력
  async logAllTables(): Promise<void> {
    const tables = ['bookmarks', 'wrong_answers', 'study_stats', 'recent_questions', 'exam_results', 'exam_question_results'];
    
    for (const tableName of tables) {
      try {
        console.log(`\n=== ${tableName.toUpperCase()} ===`);
        const rows = await this.dbAdapter.getAllRows(`SELECT * FROM ${tableName}`);
        console.table(rows);
      } catch (error) {
        console.warn(`Table ${tableName} not found or error:`, error);
      }
    }
  }

  // 모든 데이터 삭제
  async clearAllData(): Promise<void> {
    const tables = ['bookmarks', 'wrong_answers', 'study_stats', 'recent_questions', 'exam_results', 'exam_question_results'];
    
    for (const tableName of tables) {
      try {
        await this.dbAdapter.runSql(`DELETE FROM ${tableName}`);
        console.log(`Cleared ${tableName}`);
      } catch (error) {
        console.warn(`Failed to clear ${tableName}:`, error);
      }
    }
    
    console.log('All data cleared');
  }

  // 테스트용 북마크 데이터 추가
  async addTestBookmarks(): Promise<void> {
    const testBookmarks = [
      {
        questionId: 'test-1',
        title: '테스트 문제 1',
        category: '한국사',
        year: 2024,
        round: 1,
        number: 1,
        answer: '1',
        note: '테스트 노트 1',
        tags: JSON.stringify(['테스트', '한국사'])
      },
      {
        questionId: 'test-2',
        title: '테스트 문제 2',
        category: '한국사',
        year: 2024,
        round: 1,
        number: 2,
        answer: '2',
        note: '테스트 노트 2',
        tags: JSON.stringify(['테스트', '한국사'])
      }
    ];

    for (const bookmark of testBookmarks) {
      try {
        await this.dbAdapter.runSql(
          `INSERT OR REPLACE INTO bookmarks (questionId, title, category, year, round, number, answer, note, tags, bookmarkedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [bookmark.questionId, bookmark.title, bookmark.category, bookmark.year, bookmark.round, bookmark.number, bookmark.answer, bookmark.note, bookmark.tags]
        );
      } catch (error) {
        console.error('Failed to add test bookmark:', error);
      }
    }
    
    console.log('Test bookmarks added');
  }

  // 특정 테이블 정보 조회
  async getTableInfo(tableName: string): Promise<void> {
    try {
      console.log(`\n=== ${tableName.toUpperCase()} TABLE INFO ===`);
      
      // 테이블 구조 조회
      const schema = await this.dbAdapter.getAllRows(`PRAGMA table_info(${tableName})`);
      console.log('Schema:');
      console.table(schema);
      
      // 데이터 조회
      const data = await this.dbAdapter.getAllRows(`SELECT * FROM ${tableName} LIMIT 10`);
      console.log('Data (first 10 rows):');
      console.table(data);
      
      // 총 행 수 조회
      const countResult = await this.dbAdapter.getAllRows(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`Total rows: ${countResult[0]?.count || 0}`);
      
    } catch (error) {
      console.error(`Failed to get table info for ${tableName}:`, error);
    }
  }

  // 글로벌 디버깅 함수들을 window 객체에 추가
  setupGlobalDebugFunctions(): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).dbDebug = {
        logAllTables: () => this.logAllTables(),
        clearAllData: () => this.clearAllData(),
        addTestBookmarks: () => this.addTestBookmarks(),
        getTableInfo: (tableName: string) => this.getTableInfo(tableName),
        help: () => {
          console.log(`
=== 데이터베이스 디버깅 도구 ===
사용법:
- dbDebug.logAllTables()     : 모든 테이블 데이터 출력
- dbDebug.clearAllData()     : 모든 데이터 삭제
- dbDebug.addTestBookmarks() : 테스트 북마크 추가
- dbDebug.getTableInfo(name) : 특정 테이블 정보 조회
- dbDebug.help()            : 이 도움말 표시
          `);
        }
      };
      
      console.log('🔧 데이터베이스 디버깅 도구가 활성화되었습니다!');
      console.log('사용법을 보려면 dbDebug.help()를 입력하세요.');
    }
  }
} 