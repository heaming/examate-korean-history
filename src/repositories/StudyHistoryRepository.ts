import { RecentQuestionData } from '../types';
import { BaseRepository } from './BaseRepository';

export class StudyHistoryRepository extends BaseRepository<RecentQuestionData> {
  constructor() {
    super();
  }

  async initializeTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS recent_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        questionId TEXT NOT NULL,
        solvedAt TEXT NOT NULL,
        isCorrect INTEGER NOT NULL DEFAULT 0,
        studyTime INTEGER NOT NULL DEFAULT 0,
        userAnswer INTEGER NOT NULL,
        correctAnswer INTEGER NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await this.executeQuery(sql);
    
    // 인덱스 생성
    const indexSql = `
      CREATE INDEX IF NOT EXISTS idx_recent_questions_solved_at 
      ON recent_questions(solvedAt DESC)
    `;
    
    await this.executeQuery(indexSql);
  }

  async addQuestion(data: Omit<RecentQuestionData, 'id'>): Promise<RecentQuestionData> {
    const sql = `
      INSERT INTO recent_questions (questionId, solvedAt, isCorrect, studyTime, userAnswer, correctAnswer)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await this.executeQuery(sql, [
      data.questionId,
      data.solvedAt,
      this.booleanToInteger(data.isCorrect),
      data.studyTime,
      data.userAnswer,
      data.correctAnswer
    ]);
    
    return {
      id: result.insertId,
      ...data
    };
  }

  async getRecentQuestions(limit: number = 10): Promise<RecentQuestionData[]> {
    const sql = `
      SELECT * FROM recent_questions 
      ORDER BY solvedAt DESC 
      LIMIT ?
    `;
    
    const result = await this.executeQuery(sql, [limit]);
    const questions: RecentQuestionData[] = [];
    
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      questions.push({
        id: row.id,
        questionId: row.questionId,
        solvedAt: row.solvedAt,
        isCorrect: this.integerToBoolean(row.isCorrect),
        studyTime: row.studyTime,
        userAnswer: row.userAnswer,
        correctAnswer: row.correctAnswer
      });
    }
    
    return questions;
  }

  async getQuestionsByDate(date: string): Promise<RecentQuestionData[]> {
    const sql = `
      SELECT * FROM recent_questions 
      WHERE DATE(solvedAt) = DATE(?)
      ORDER BY solvedAt DESC
    `;
    
    const result = await this.executeQuery(sql, [date]);
    const questions: RecentQuestionData[] = [];
    
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      questions.push({
        id: row.id,
        questionId: row.questionId,
        solvedAt: row.solvedAt,
        isCorrect: this.integerToBoolean(row.isCorrect),
        studyTime: row.studyTime,
        userAnswer: row.userAnswer,
        correctAnswer: row.correctAnswer
      });
    }
    
    return questions;
  }

  async getTodayStats(): Promise<{
    solvedToday: number;
    correctToday: number;
    studyTimeToday: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        COUNT(*) as solvedToday,
        SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correctToday,
        SUM(studyTime) as studyTimeToday
      FROM recent_questions 
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
      studyTimeToday: Math.round((row.studyTimeToday || 0) / 60) // 초를 분으로 변환
    };
  }

  async getStudyStreak(): Promise<number> {
    const sql = `
      SELECT DATE(solvedAt) as study_date
      FROM recent_questions
      GROUP BY DATE(solvedAt)
      ORDER BY study_date DESC
      LIMIT 100
    `;
    
    const result = await this.executeQuery(sql);
    
    if (result.rows.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      const studyDate = new Date(row.study_date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      // 날짜 비교 (시간 제외)
      if (studyDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // BaseRepository 추상 메서드 구현
  async findAll(): Promise<RecentQuestionData[]> {
    return await this.getRecentQuestions();
  }

  async findById(id: string | number): Promise<RecentQuestionData | null> {
    const sql = 'SELECT * FROM recent_questions WHERE id = ?';
    const result = await this.executeQuery(sql, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows.item(0);
    return {
      id: row.id,
      questionId: row.questionId,
      solvedAt: row.solvedAt,
      isCorrect: this.integerToBoolean(row.isCorrect),
      studyTime: row.studyTime,
      userAnswer: row.userAnswer,
      correctAnswer: row.correctAnswer
    };
  }

  async create(data: Omit<RecentQuestionData, 'id'>): Promise<RecentQuestionData> {
    return await this.addQuestion(data);
  }

  async update(id: string | number, data: Partial<RecentQuestionData>): Promise<RecentQuestionData> {
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
    
    if (data.studyTime !== undefined) {
      updateFields.push('studyTime = ?');
      values.push(data.studyTime);
    }
    
    if (data.userAnswer !== undefined) {
      updateFields.push('userAnswer = ?');
      values.push(data.userAnswer);
    }
    
    if (data.correctAnswer !== undefined) {
      updateFields.push('correctAnswer = ?');
      values.push(data.correctAnswer);
    }
    
    if (updateFields.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error('Question not found');
      return existing;
    }
    
    const sql = `
      UPDATE recent_questions 
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
    const sql = 'DELETE FROM recent_questions WHERE id = ?';
    const result = await this.executeQuery(sql, [id]);
    
    return result.rowsAffected > 0;
  }
} 