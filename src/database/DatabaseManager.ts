import * as SQLite from 'expo-sqlite';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('SQLite module loaded successfully');
      console.log('Starting database initialization...');
      
      await this.openDatabase();
      await this.createTables();
      
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async openDatabase(): Promise<void> {
    try {
      console.log('Opening database...');
      this.db = await SQLite.openDatabaseAsync('examate-korean-history.db');
      console.log('Database opened successfully');
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not opened');

    // 테이블을 하나씩 생성하여 어떤 테이블에서 문제가 발생하는지 확인
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
        await this.executeSql(table.sql);
        console.log(`Table ${table.name} created successfully`);
      } catch (error) {
        console.error(`Error creating table ${table.name}:`, error);
        // 테이블 생성 실패해도 계속 진행
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
  }

  private async initializeStats(): Promise<void> {
    if (!this.db) return;

    try {
      const result = await this.executeSql('SELECT COUNT(*) as count FROM study_stats');
      
      // expo-sqlite의 결과 구조에 맞게 수정
      let count = 0;
      if (result.rows && result.rows.length > 0) {
        count = result.rows[0].count;
      }
      
      console.log('Current stats count:', count);
      
      if (count === 0) {
        await this.executeSql(
          'INSERT OR IGNORE INTO study_stats (id, totalSolved, totalCorrect, totalStudyTime, studyStreak) VALUES (1, 0, 0, 0, 0)'
        );
        console.log('Initial stats created');
      }
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
      // exam_results, exam_question_results 테이블은 아직 생성되지 않았으므로 제거
    ];

    for (const index of indexes) {
      try {
        await this.executeSql(index);
      } catch (error) {
        console.error('Error creating index:', error);
      }
    }
  }

  private async executeSql(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not opened');

    try {
      console.log('Executing SQL:', sql.substring(0, 100) + '...');

      const result = await this.db.runAsync(sql, params);
      
      console.log('SQL executed successfully');
      return result;
    } catch (error) {
      console.error('SQL execution error:', error);
      console.error('Failed SQL:', sql);
      throw error;
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      // react-native-sqlite-2는 자동으로 연결을 관리함
      this.db = null;
      console.log('Database closed');
    }
  }

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
      await this.executeSql(`DROP TABLE IF EXISTS ${table}`);
    }

    await this.createTables();
    console.log('Database reset completed');
  }
} 