import { DatabaseAdapter } from '../database/DatabaseAdapter';

export class WebDatabaseDebugger {
  private dbAdapter: DatabaseAdapter;

  constructor() {
    this.dbAdapter = DatabaseAdapter.getInstance();
  }

  // 개발 환경에서만 사용 가능한 디버깅 메서드들
  async logAllTables(): Promise<void> {
    if (!this.dbAdapter.isUsingWebDatabase()) {
      console.log('Web database not available');
      return;
    }

    console.log('=== 모든 테이블 데이터 ===');
    
    const tables = ['bookmarks', 'wrong_answers', 'study_stats', 'recent_questions'];
    
    for (const table of tables) {
      try {
        const rows = await this.dbAdapter.getAllRows(`SELECT * FROM ${table}`);
        console.log(`\n${table.toUpperCase()} (${rows.length} rows):`);
        console.table(rows);
      } catch (error) {
        console.log(`${table}: 테이블이 존재하지 않거나 오류 발생`);
      }
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.dbAdapter.isUsingWebDatabase()) {
      console.log('Web database not available');
      return;
    }

    console.log('모든 데이터 삭제 중...');
    await this.dbAdapter.resetDatabase();
    console.log('모든 데이터가 삭제되었습니다.');
  }

  async addTestBookmarks(): Promise<void> {
    if (!this.dbAdapter.isUsingWebDatabase()) {
      console.log('Web database not available');
      return;
    }

    console.log('테스트 북마크 추가 중...');
    
    const testBookmarks = [
      {
        id: 'test-1',
        questionId: 'q-2023-1-1',
        title: '조선 건국과 관련된 인물',
        category: '조선시대',
        year: 2023,
        round: 1,
        number: 1,
        answer: '태조 이성계',
        note: '테스트 노트 1',
        tags: JSON.stringify(['조선', '건국', '이성계']),
        bookmarkedAt: new Date().toISOString()
      },
      {
        id: 'test-2',
        questionId: 'q-2023-1-2',
        title: '고구려의 영토 확장',
        category: '고구려',
        year: 2023,
        round: 1,
        number: 2,
        answer: '광개토대왕',
        note: '테스트 노트 2',
        tags: JSON.stringify(['고구려', '광개토대왕', '영토확장']),
        bookmarkedAt: new Date().toISOString()
      },
      {
        id: 'test-3',
        questionId: 'q-2022-2-5',
        title: '일제강점기 독립운동',
        category: '근현대사',
        year: 2022,
        round: 2,
        number: 5,
        answer: '3.1운동',
        note: '테스트 노트 3',
        tags: JSON.stringify(['일제강점기', '독립운동', '3.1운동']),
        bookmarkedAt: new Date().toISOString()
      }
    ];

    for (const bookmark of testBookmarks) {
      try {
        await this.dbAdapter.runSql(
          `INSERT INTO bookmarks (id, questionId, title, category, year, round, number, answer, note, tags, bookmarkedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            bookmark.id,
            bookmark.questionId,
            bookmark.title,
            bookmark.category,
            bookmark.year,
            bookmark.round,
            bookmark.number,
            bookmark.answer,
            bookmark.note,
            bookmark.tags,
            bookmark.bookmarkedAt
          ]
        );
      } catch (error) {
        console.error('테스트 북마크 추가 실패:', bookmark.id, error);
      }
    }
    
    console.log('테스트 북마크 추가 완료!');
  }

  async exportDatabase(): Promise<void> {
    if (!this.dbAdapter.isUsingWebDatabase()) {
      console.log('Web database not available');
      return;
    }

    const data = this.dbAdapter.exportWebDatabase();
    if (data) {
      // 브라우저에서 파일 다운로드
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `examate-db-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('데이터베이스 내보내기 완료!');
    }
  }

  async getTableInfo(tableName: string): Promise<void> {
    if (!this.dbAdapter.isUsingWebDatabase()) {
      console.log('Web database not available');
      return;
    }

    try {
      const schema = await this.dbAdapter.getAllRows(`PRAGMA table_info(${tableName})`);
      console.log(`${tableName} 테이블 스키마:`);
      console.table(schema);
      
      const count = await this.dbAdapter.getAllRows(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`${tableName} 총 레코드 수: ${count[0].count}`);
    } catch (error) {
      console.error(`테이블 정보 조회 실패: ${tableName}`, error);
    }
  }

  // 글로벌 디버깅 함수들을 window 객체에 추가
  setupGlobalDebugFunctions(): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).dbDebug = {
        logAllTables: () => this.logAllTables(),
        clearAllData: () => this.clearAllData(),
        addTestBookmarks: () => this.addTestBookmarks(),
        exportDatabase: () => this.exportDatabase(),
        getTableInfo: (tableName: string) => this.getTableInfo(tableName),
        help: () => {
          console.log(`
=== 웹 데이터베이스 디버깅 도구 ===
사용법:
- dbDebug.logAllTables()     : 모든 테이블 데이터 출력
- dbDebug.clearAllData()     : 모든 데이터 삭제
- dbDebug.addTestBookmarks() : 테스트 북마크 추가
- dbDebug.exportDatabase()   : 데이터베이스 파일 다운로드
- dbDebug.getTableInfo(name) : 특정 테이블 정보 조회
- dbDebug.help()            : 이 도움말 표시
          `);
        }
      };
      
      console.log('🔧 웹 데이터베이스 디버깅 도구가 활성화되었습니다!');
      console.log('사용법을 보려면 dbDebug.help()를 입력하세요.');
    }
  }
} 