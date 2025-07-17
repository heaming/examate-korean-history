import dayjs from 'dayjs';
import { StudyHistory } from '../types/database';
import { BaseRepository } from './BaseRepository';

dayjs().locale('')

export class StudyHistoryRepository extends BaseRepository<StudyHistory> {
  constructor() {
    super();
  }

  async initializeTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS study_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        questionId TEXT NOT NULL,
        solvedAt TEXT NOT NULL,
        isCorrect INTEGER NOT NULL DEFAULT 0,
        userAnswer INTEGER DEFAULT 0,
        correctAnswer INTEGER NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await this.executeQuery(sql);
    
    // 인덱스 생성
    const indexSql = `
      CREATE INDEX IF NOT EXISTS idx_study_history_solved_at 
      ON study_history(solvedAt DESC)
    `;
    
    await this.executeQuery(indexSql);
  }

  async addQuestion(data: Omit<StudyHistory, 'id'>): Promise<StudyHistory> {
    const sql = `
      INSERT INTO study_history (questionId, solvedAt, isCorrect, userAnswer, correctAnswer, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await this.executeQuery(sql, [
      data.questionId,
      data.solvedAt,
      this.booleanToInteger(data.isCorrect),
      data.userAnswer,
      data.correctAnswer,
      data.createdAt
    ]);
    
    return {
      id: result.insertId,
      ...data
    };
  }

  async getStudyHistoryTotalCount(): Promise<{solvedCount: number, correctCount: number}> {
    const sql = `
      SELECT
        COUNT(*) AS solvedCount,
        SUM(CASE WHEN isCorrect THEN 1 ELSE 0 END) AS correctCount
      FROM (
             SELECT *
             FROM study_history
             WHERE (questionId, solvedAt) IN (
               SELECT questionId, MAX(solvedAt)
               FROM study_history
               GROUP BY questionId
             )
           ) AS latest
    `;

    const result = await this.executeQuery(sql);

    if (result.rows.length === 0) return { solvedCount: 0, correctCount: 0 };

    const row = result.rows.item(0);

    return { solvedCount: row.solvedCount, correctCount: row.correctCount };
  }

  async getRecentQuestions(limit: number = 3): Promise<StudyHistory[]> {
    const sql = `
      SELECT * FROM study_history
      WHERE (questionId, solvedAt) IN (
        SELECT questionId, MAX(solvedAt) AS maxSolvedAt
        FROM study_history
        GROUP BY questionId
      )
      ORDER BY solvedAt DESC
      LIMIT ?
    `;

    const result = await this.executeQuery(sql, [limit]);
    const questions: StudyHistory[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      questions.push({
        id: row.id,
        questionId: row.questionId,
        solvedAt: row.solvedAt,
        isCorrect: this.integerToBoolean(row.isCorrect),
        userAnswer: row.userAnswer,
        correctAnswer: row.correctAnswer,
        createdAt: row.createdAt
      });
    }

    return questions;
  }

  async getQuestionsByDate(date: string): Promise<StudyHistory[]> {
    const sql = `
      SELECT * FROM study_history 
      WHERE DATE(solvedAt) = DATE(?)
      ORDER BY solvedAt DESC
    `;
    
    const result = await this.executeQuery(sql, [date]);
    const questions: StudyHistory[] = [];
    
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      questions.push({
        id: row.id,
        questionId: row.questionId,
        solvedAt: row.solvedAt,
        isCorrect: this.integerToBoolean(row.isCorrect),
        userAnswer: row.userAnswer,
        correctAnswer: row.correctAnswer,
        createdAt: row.createdAt
      });
    }
    
    return questions;
  }

  async getTodayStats(): Promise<{
    solvedToday: number;
    correctToday: number;
    studyTimeToday: number;
  }> {
    const today = dayjs().format();
    
    const sql = `
      SELECT 
        COUNT(*) as solvedToday,
        SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correctToday
      FROM study_history 
      WHERE DATE(solvedAt) = DATE(?)
    `;
    
    const result = await this.executeQuery(sql, [today]);
    
    if (result.rows.length === 0) {
      return {
        solvedToday: 0,
        correctToday: 0,
        studyTimeToday: 0
      };
    }
    
    const row = result.rows.item(0);
    return {
      solvedToday: row.solvedToday || 0,
      correctToday: row.correctToday || 0,
      studyTimeToday: 0 // StudyHistory에서 studyTime 제거되어 0으로 설정
    };
  }

  async getStudyStreak(): Promise<number> {
    const sql = `
      SELECT DATE(solvedAt) as study_date
      FROM study_history
      GROUP BY DATE(solvedAt)
      ORDER BY study_date DESC
      LIMIT 100
    `;
    
    const result = await this.executeQuery(sql);
    
    if (result.rows.length === 0) return 0;
    
    let streak = 0;
    const today = dayjs();
    
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      const studyDate = dayjs(row.study_date);
      const expectedDate = today.subtract(i, 'day');
      
      // 날짜 비교 (시간 제외)
      if (studyDate.format('YYYY-MM-DD') === expectedDate.format('YYYY-MM-DD')) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // BaseRepository 추상 메서드 구현
  async findAll(): Promise<StudyHistory[]> {
    return await this.getRecentQuestions();
  }

  async findById(id: string | number): Promise<StudyHistory | null> {
    const sql = 'SELECT * FROM study_history WHERE id = ?';
    const result = await this.executeQuery(sql, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows.item(0);
    return {
      id: row.id,
      questionId: row.questionId,
      solvedAt: row.solvedAt,
      isCorrect: this.integerToBoolean(row.isCorrect),
      userAnswer: row.userAnswer,
      correctAnswer: row.correctAnswer,
      createdAt: row.createdAt
    };
  }

  async create(data: Omit<StudyHistory, 'id'>): Promise<StudyHistory> {
    return await this.addQuestion(data);
  }

  async update(id: string | number, data: Partial<StudyHistory>): Promise<StudyHistory> {
    const updateFields = [];
    const values = [];
    
    if (data.questionId !== undefined) {
      updateFields.push('questionId = ?');
      values.push(data.questionId);
    }
    
    if (data.solvedAt !== undefined) {
      updateFields.push('solvedAt = ?');
      values.push(data.solvedAt);
    }
    
    if (data.isCorrect !== undefined) {
      updateFields.push('isCorrect = ?');
      values.push(this.booleanToInteger(data.isCorrect));
    }
    
    if (data.userAnswer !== undefined) {
      updateFields.push('userAnswer = ?');
      values.push(data.userAnswer);
    }
    
    if (data.correctAnswer !== undefined) {
      updateFields.push('correctAnswer = ?');
      values.push(data.correctAnswer);
    }
    
    if (data.createdAt !== undefined) {
      updateFields.push('createdAt = ?');
      values.push(data.createdAt);
    }
    
    if (updateFields.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error('Question not found');
      return existing;
    }
    
    const sql = `
      UPDATE study_history 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    values.push(id);
    await this.executeQuery(sql, values);
    
    const updated = await this.findById(id);
    if (!updated) throw new Error('Failed to update question');
    
    return updated;
  }

  async delete(id: string | number): Promise<boolean> {
    const sql = 'DELETE FROM study_history WHERE id = ?';
    const result = await this.executeQuery(sql, [id]);
    
    return result.rowsAffected > 0;
  }
} 