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

  async initializeSchema(): Promise<void> {
    await this.createTables();
    await this.createIndexes();
    await this.initializeStats();
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

    const tables = [
      {
        name: 'bookmark',
        sql: `
          CREATE TABLE IF NOT EXISTS bookmark (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            questionId TEXT NOT NULL UNIQUE,
            year INTEGER,
            round INTEGER,
            questionNumber TEXT NOT NULL,
            questionText TEXT NOT NULL,
            questionImageUrl TEXT,
            correctAnswer INTEGER NOT NULL,
            explanation TEXT,
            note TEXT,
            tags TEXT,
            bookmarkedAt TEXT NOT NULL
          )
        `
      },
      {
        name: 'wrong_answer',
        sql: `
          CREATE TABLE IF NOT EXISTS wrong_answer (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              questionId TEXT NOT NULL,
              lastWrongAt TEXT NOT NULL,
              wrongCount INTEGER NOT NULL DEFAULT 1,
              tags TEXT,
              userAnswer INTEGER,
              correctAnswer INTEGER NOT NULL,
              note TEXT,
              createdAt TEXT NOT NULL DEFAULT (date('now'))
            )
        `
      },
      {
        name: 'study_stats',
        sql: `
          CREATE TABLE IF NOT EXISTS study_stats (
            id INTEGER PRIMARY KEY DEFAULT 1,
            studyStreak INTEGER NOT NULL DEFAULT 0,
            lastStudyDate TEXT,
            totalStudyTime INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL DEFAULT (date('now')),
            updatedAt TEXT NOT NULL DEFAULT (date('now'))
            )
        `
      },
      {
        name: 'study_history',
        sql: `
          CREATE TABLE IF NOT EXISTS study_history (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              questionId TEXT NOT NULL,
              year INTEGER NOT NULL,
              round INTEGER NOT NULL,
              solvedAt TEXT NOT NULL,
              isCorrect INTEGER,
              userAnswer INTEGER DEFAULT 0,
              correctAnswer INTEGER NOT NULL,
              createdAt TEXT NOT NULL DEFAULT (date('now'))
            )
        `
      }
    ];

    for (const table of tables) {
      try {
        console.log(`Creating table: ${table.name}`);
        await this.executeSql(table.sql);
        console.log(`Table ${table.name} created successfully`);
      } catch (error) {
        console.error(`Error creating table ${table.name}:`, error);
        continue;
      }
    }
  }

  private async initializeStats(): Promise<void> {
    if (!this.db) return;

    try {
      const res = await this.executeSql(`SELECT COUNT(*) AS count FROM study_stats WHERE id = 1`);
      const exists = res.rows?.[0]?.count === 1;
      if (!exists) {
        await this.executeSql(`
        INSERT OR IGNORE INTO study_stats
          (id, studyStreak, lastStudyDate, totalStudyTime, createdAt, updatedAt)
        VALUES (1, 0, '', 0, date('now'), date('now'))
      `);
      }
    } catch (error) {
      console.error('Error initializing stats:', error);
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    const indexes = [
      // bookmark
      `CREATE INDEX IF NOT EXISTS idx_bookmark_question_id ON bookmark(questionId)`,
      `CREATE INDEX IF NOT EXISTS idx_bookmark_bookmarked_at ON bookmark(bookmarkedAt DESC)`,

      // wrong_answer
      `CREATE INDEX IF NOT EXISTS idx_wrong_answer_last_wrong_at ON wrong_answer(lastWrongAt DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_wrong_answer_wrong_count ON wrong_answer(wrongCount DESC)`,

      // study_history
      `CREATE INDEX IF NOT EXISTS idx_study_history_solved_at ON study_history(solvedAt DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_study_history_year_round ON study_history(year, round, solvedAt DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_study_history_question_id ON study_history(questionId, solvedAt DESC)`
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
      this.db = null;
      console.log('Database closed');
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) return;

    const tables = [
        'bookmark',
        'wrong_answer',
        'study_stats',
        'study_history',
    ];

    for (const table of tables) {
      await this.executeSql(`DROP TABLE IF EXISTS ${table}`);
    }

    await this.createTables();
    console.log('Database reset completed');
  }
} 