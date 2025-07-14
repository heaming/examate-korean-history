import initSqlJs, { Database } from 'sql.js';

export class WebDatabaseManager {
  private static instance: WebDatabaseManager;
  private db: Database | null = null;
  private SQL: any = null;

  private constructor() {}

  static getInstance(): WebDatabaseManager {
    if (!WebDatabaseManager.instance) {
      WebDatabaseManager.instance = new WebDatabaseManager();
    }
    return WebDatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing web database with sql.js...');
      
      // sql.js 초기화
      this.SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      // 기존 데이터 로드 (localStorage에서)
      const savedData = localStorage.getItem('examate-korean-history-db');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.db = new this.SQL.Database(new Uint8Array(data));
        console.log('Loaded existing database from localStorage');
      } else {
        this.db = new this.SQL.Database();
        console.log('Created new database');
      }
      
      await this.createTables();
      console.log('Web database initialization completed');
    } catch (error) {
      console.error('Failed to initialize web database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      {
        name: 'bookmarks',
        sql: `CREATE TABLE IF NOT EXISTS bookmarks (
          id TEXT PRIMARY KEY,
          questionId TEXT NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          year INTEGER NOT NULL,
          round INTEGER NOT NULL,
          number INTEGER NOT NULL,
          answer TEXT,
          note TEXT,
          tags TEXT,
          bookmarkedAt TEXT NOT NULL
        )`
      },
      {
        name: 'wrong_answers',
        sql: `CREATE TABLE IF NOT EXISTS wrong_answers (
          questionId TEXT PRIMARY KEY,
          wrongCount INTEGER NOT NULL DEFAULT 1,
          lastWrongAt TEXT NOT NULL,
          note TEXT,
          isBookmarked INTEGER DEFAULT 0,
          userAnswer INTEGER NOT NULL,
          correctAnswer INTEGER NOT NULL
        )`
      },
      {
        name: 'study_stats',
        sql: `CREATE TABLE IF NOT EXISTS study_stats (
          id INTEGER PRIMARY KEY,
          totalSolved INTEGER DEFAULT 0,
          totalCorrect INTEGER DEFAULT 0,
          totalStudyTime INTEGER DEFAULT 0,
          studyStreak INTEGER DEFAULT 0,
          lastStudyDate TEXT
        )`
      },
      {
        name: 'recent_questions',
        sql: `CREATE TABLE IF NOT EXISTS recent_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          questionId TEXT NOT NULL,
          solvedAt TEXT NOT NULL,
          isCorrect INTEGER NOT NULL,
          studyTime INTEGER NOT NULL,
          userAnswer INTEGER NOT NULL,
          correctAnswer INTEGER NOT NULL
        )`
      }
    ];

    for (const table of tables) {
      try {
        console.log(`Creating table: ${table.name}`);
        this.db.run(table.sql);
        console.log(`Table ${table.name} created successfully`);
      } catch (error) {
        console.error(`Error creating table ${table.name}:`, error);
        continue;
      }
    }

    // 초기 통계 데이터 삽입
    try {
      await this.initializeStats();
    } catch (error) {
      console.error('Error initializing stats:', error);
    }
    
    // 인덱스 생성
    try {
      await this.createIndexes();
    } catch (error) {
      console.error('Error creating indexes:', error);
    }

    // 데이터베이스 저장
    this.saveDatabase();
  }

  private async initializeStats(): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM study_stats');
      const result = stmt.getAsObject();
      const count = result.count as number;
      
      console.log('Current stats count:', count);
      
      if (count === 0) {
        this.db.run(
          'INSERT OR IGNORE INTO study_stats (id, totalSolved, totalCorrect, totalStudyTime, studyStreak) VALUES (1, 0, 0, 0, 0)'
        );
        console.log('Initial stats created');
      }
      
      stmt.free();
    } catch (error) {
      console.error('Error initializing stats:', error);
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_bookmarks_questionId ON bookmarks(questionId)',
      'CREATE INDEX IF NOT EXISTS idx_wrong_answers_lastWrongAt ON wrong_answers(lastWrongAt)',
      'CREATE INDEX IF NOT EXISTS idx_recent_questions_solvedAt ON recent_questions(solvedAt)'
    ];

    for (const index of indexes) {
      try {
        this.db.run(index);
      } catch (error) {
        console.error('Error creating index:', error);
      }
    }
  }

  // sql.js용 SQL 실행 메서드 (SELECT용)
  async getAllRows(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('Executing SELECT:', sql.substring(0, 100) + '...');
      const stmt = this.db.prepare(sql);
      
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      
      stmt.free();
      console.log('SELECT executed successfully, returned', results.length, 'rows');
      return results;
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  // sql.js용 SQL 실행 메서드 (INSERT/UPDATE/DELETE용)
  async runSql(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('Executing SQL:', sql.substring(0, 100) + '...');
      
      const stmt = this.db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      const result = stmt.step();
      const info = this.db.getRowsModified();
      
      stmt.free();
      
      // 변경사항이 있으면 데이터베이스 저장
      if (info > 0) {
        this.saveDatabase();
      }
      
      console.log('SQL executed successfully, rows affected:', info);
      return { changes: info, lastInsertRowid: this.db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0 };
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  // 데이터베이스를 localStorage에 저장
  private saveDatabase(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      localStorage.setItem('examate-korean-history-db', JSON.stringify(Array.from(data)));
      console.log('Database saved to localStorage');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // 데이터베이스 리셋 (개발/테스트용)
  async resetDatabase(): Promise<void> {
    if (!this.db) return;

    const tables = [
      'bookmarks',
      'wrong_answers', 
      'study_stats',
      'recent_questions',
      'exam_results',
      'exam_question_results'
    ];

    for (const table of tables) {
      try {
        this.db.run(`DROP TABLE IF EXISTS ${table}`);
      } catch (error) {
        console.error(`Error dropping table ${table}:`, error);
      }
    }

    await this.createTables();
    console.log('Web database reset completed');
  }

  // 데이터베이스 내보내기 (개발용)
  exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  // 데이터베이스 가져오기 (개발용)
  importDatabase(data: Uint8Array): void {
    if (!this.SQL) throw new Error('SQL.js not initialized');
    
    this.db?.close();
    this.db = new this.SQL.Database(data);
    this.saveDatabase();
  }

  closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Web database closed');
    }
  }
} 