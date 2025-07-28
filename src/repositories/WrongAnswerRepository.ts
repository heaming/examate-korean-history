import dayjs from 'dayjs';
import {OrderType, StudyHistory, WrongAnswer, WrongAnswerStats} from '../types';
import { BaseRepository } from './BaseRepository';

export class WrongAnswerRepository extends BaseRepository<WrongAnswer> {
  async initializeTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS wrong_answer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        questionId TEXT NOT NULL,
        lastWrongAt TEXT NOT NULL,
        wrongCount INTEGER DEFAULT 1,
        tags TEXT,
        userAnswer INTEGER,
        correctAnswer INTEGER NOT NULL,
        note TEXT,
        isBookmarked INTEGER
        createdAt TEXT NOT NULL DEFAULT  (date('now'))
      )
    `;

    await this.executeQuery(sql);

    const indexSql1 = `
      CREATE INDEX IF NOT EXISTS idx_wrong_asnwer_last_wrong_at
      ON wrong_answer(lastWrongAt DESC)
    `;

    // year, round 복합 인덱스 (연도별/회차별 조회용)
    const indexSql2 = `
    CREATE INDEX IF NOT EXISTS idx_wrong_answer_wrong_count
    ON wrong_answer(wrong_count DESC)
    `;

    await this.executeQuery(indexSql1);
    await this.executeQuery(indexSql2);
  }

  async getWrongAnswers(tags = [], limit: number=10, offset: number=0, orderType: OrderType): Promise<StudyHistory[]> {
    let dynamicOrderBy = "";
    switch (orderType) {
      case "SOLVED_AT":
        dynamicOrderBy = `\nORDER BY wrongCount DESC`;
        break;
      case "RECENTLY":
      default:
        dynamicOrderBy = `\nORDER BY solvedAt DESC`;
        break;
    }

    const sql = `
      WITH latest_wrong AS (
        SELECT DISTINCT questionId
        FROM study_history
        WHERE (questionId, solvedAt) IN (
          SELECT questionId, MAX(solvedAt)
          FROM study_history
          GROUP BY questionId
        )
          AND isCorrect = 0
      )
      SELECT
        s.*,
        CASE WHEN b.questionId IS NOT NULL THEN 1 ELSE 0 END as isBookmarked,
        COALESCE(w.wrongCount, 1) as wrongCount,
        w.lastWrongAt
      FROM study_history s
             JOIN latest_wrong lw ON s.questionId = lw.questionId
             LEFT JOIN bookmark b ON s.questionId = b.questionId
             LEFT JOIN wrong_answers w ON s.questionId = w.questionId
      WHERE (s.questionId, s.solvedAt) IN (
        SELECT questionId, MAX(solvedAt)
        FROM study_history
        GROUP BY questionId
      )
      ${dynamicOrderBy}
      LIMIT ? OFFSET ?
    `;
    const result = await this.executeQuery(sql, [limit, offset]);
    const questions: StudyHistory[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      questions.push({
        id: row.id,
        questionId: row.questionId,
        year: row.year,
        round: row.round,
        solvedAt: row.solvedAt,
        isBookmarked: row.isBookmarked,
        isCorrect: this.integerToBoolean(row.isCorrect),
        userAnswer: row.userAnswer,
        correctAnswer: row.correctAnswer,
        createdAt: row.createdAt
      });
    }
  }

  async findAll(): Promise<WrongAnswer[]> {
    const result = await this.executeQuery(
      'SELECT * FROM wrong_answers ORDER BY lastWrongAt DESC'
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        isBookmarked: this.integerToBoolean(row.isBookmarked)
      };
    });
  }

  async findById(questionId: string): Promise<WrongAnswer | null> {
    const result = await this.executeQuery(
      'SELECT * FROM wrong_answers WHERE questionId = ?',
      [questionId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows.item(0);
    return {
      ...row,
      isBookmarked: this.integerToBoolean(row.isBookmarked)
    };
  }

  async create(data: Omit<WrongAnswer, 'id'>): Promise<WrongAnswer> {
    const wrongAnswer: WrongAnswer = {
      questionId: data.questionId,
      wrongCount: data.wrongCount || 1,
      lastWrongAt: data.lastWrongAt,
      note: data.note,
      isBookmarked: data.isBookmarked || false,
      userAnswer: data.userAnswer,
      correctAnswer: data.correctAnswer
    };
    
    await this.executeQuery(
      `INSERT OR REPLACE INTO wrong_answers (questionId, wrongCount, lastWrongAt, note, isBookmarked, userAnswer, correctAnswer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        wrongAnswer.questionId,
        wrongAnswer.wrongCount,
        wrongAnswer.lastWrongAt,
        wrongAnswer.note || null,
        this.booleanToInteger(wrongAnswer.isBookmarked),
        wrongAnswer.userAnswer,
        wrongAnswer.correctAnswer
      ]
    );
    
    return wrongAnswer;
  }

  async update(questionId: string, data: Partial<WrongAnswer>): Promise<WrongAnswer> {
    const existing = await this.findById(questionId);
    if (!existing) throw new Error('Wrong answer record not found');
    
    const updated = { ...existing, ...data };
    
    await this.executeQuery(
      `UPDATE wrong_answers SET wrongCount=?, lastWrongAt=?, note=?, isBookmarked=?, userAnswer=?, correctAnswer=?
       WHERE questionId=?`,
      [
        updated.wrongCount,
        updated.lastWrongAt,
        updated.note || null,
        this.booleanToInteger(updated.isBookmarked),
        updated.userAnswer,
        updated.correctAnswer,
        questionId
      ]
    );
    
    return updated;
  }

  async delete(questionId: string): Promise<boolean> {
    const result = await this.executeQuery(
      'DELETE FROM wrong_answers WHERE questionId = ?',
      [questionId]
    );
    
    return result.rowsAffected > 0;
  }

  // 추가 메서드들
  async incrementWrongCount(questionId: string, userAnswer: number, correctAnswer: number): Promise<WrongAnswer> {
    const existing = await this.findById(questionId);
    
    if (existing) {
      // 기존 레코드 업데이트
      return await this.update(questionId, {
        wrongCount: existing.wrongCount + 1,
        lastWrongAt: dayjs().format('YYYY-MM-DD'),
        userAnswer,
        correctAnswer
      });
    } else {
      // 새 레코드 생성
      return await this.create({
        questionId,
        wrongCount: 1,
        lastWrongAt: dayjs().format('YYYY-MM-DD'),
        isBookmarked: false,
        userAnswer,
        correctAnswer
      });
    }
  }

  async updateNote(questionId: string, note: string): Promise<WrongAnswer> {
    const existing = await this.findById(questionId);
    if (!existing) throw new Error('Wrong answer record not found');
    
    return await this.update(questionId, { note });
  }

  async toggleBookmark(questionId: string): Promise<WrongAnswer> {
    const existing = await this.findById(questionId);
    if (!existing) throw new Error('Wrong answer record not found');
    
    return await this.update(questionId, { isBookmarked: !existing.isBookmarked });
  }

  async getWrongAnswerStats(): Promise<WrongAnswerStats> {
    // 총 오답 수
    const totalResult = await this.executeQuery('SELECT COUNT(*) as count FROM wrong_answers');
    const totalWrongAnswers = totalResult.rows.item(0).count;

    // 가장 많이 틀린 카테고리 (북마크 테이블과 조인 필요)
    const categoryResult = await this.executeQuery(`
      SELECT b.category, COUNT(*) as count 
      FROM wrong_answers w 
      JOIN bookmarks b ON w.questionId = b.questionId 
      GROUP BY b.category 
      ORDER BY count DESC 
      LIMIT 1
    `);
    
    const mostWrongCategory = categoryResult.rows.length > 0 
      ? categoryResult.rows.item(0).category 
      : '';

    // 평균 오답 횟수
    const avgResult = await this.executeQuery('SELECT AVG(wrongCount) as avg FROM wrong_answers');
    const averageWrongCount = avgResult.rows.item(0).avg || 0;

    // 최근 7일 오답 수
    const sevenDaysAgo = dayjs().subtract(7, 'day');
    const recentResult = await this.executeQuery(
      'SELECT COUNT(*) as count FROM wrong_answers WHERE lastWrongAt >= ?',
      [sevenDaysAgo.format()]
    );
    const recentWrongAnswers = recentResult.rows.item(0).count;

    return {
      totalWrongAnswers,
      mostWrongCategory,
      averageWrongCount: Math.round(averageWrongCount * 100) / 100,
      recentWrongAnswers
    };
  }

  async getWrongAnswersByCount(minCount: number): Promise<WrongAnswer[]> {
    const result = await this.executeQuery(
      'SELECT * FROM wrong_answers WHERE wrongCount >= ? ORDER BY wrongCount DESC, lastWrongAt DESC',
      [minCount]
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        isBookmarked: this.integerToBoolean(row.isBookmarked)
      };
    });
  }

  async getBookmarkedWrongAnswers(): Promise<WrongAnswer[]> {
    const result = await this.executeQuery(
      'SELECT * FROM wrong_answers WHERE isBookmarked = 1 ORDER BY lastWrongAt DESC'
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        isBookmarked: this.integerToBoolean(row.isBookmarked)
      };
    });
  }

  async getWrongAnswersByDateRange(startDate: string, endDate: string): Promise<WrongAnswer[]> {
    const result = await this.executeQuery(
      'SELECT * FROM wrong_answers WHERE lastWrongAt BETWEEN ? AND ? ORDER BY lastWrongAt DESC',
      [startDate, endDate]
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        isBookmarked: this.integerToBoolean(row.isBookmarked)
      };
    });
  }

  async searchWrongAnswers(searchTerm: string): Promise<WrongAnswer[]> {
    const result = await this.executeQuery(
      'SELECT * FROM wrong_answers WHERE note LIKE ? ORDER BY lastWrongAt DESC',
      [`%${searchTerm}%`]
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        isBookmarked: this.integerToBoolean(row.isBookmarked)
      };
    });
  }
} 