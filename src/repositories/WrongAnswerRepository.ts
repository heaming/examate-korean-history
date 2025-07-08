import { WrongAnswerRecord, WrongAnswerStats } from '../types';
import { BaseRepository } from './BaseRepository';

export class WrongAnswerRepository extends BaseRepository<WrongAnswerRecord> {
  async findAll(): Promise<WrongAnswerRecord[]> {
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

  async findById(questionId: string): Promise<WrongAnswerRecord | null> {
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

  async create(data: Omit<WrongAnswerRecord, 'id'>): Promise<WrongAnswerRecord> {
    const wrongAnswer: WrongAnswerRecord = {
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

  async update(questionId: string, data: Partial<WrongAnswerRecord>): Promise<WrongAnswerRecord> {
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
  async incrementWrongCount(questionId: string, userAnswer: number, correctAnswer: number): Promise<WrongAnswerRecord> {
    const existing = await this.findById(questionId);
    
    if (existing) {
      // 기존 레코드 업데이트
      return await this.update(questionId, {
        wrongCount: existing.wrongCount + 1,
        lastWrongAt: new Date().toISOString(),
        userAnswer,
        correctAnswer
      });
    } else {
      // 새 레코드 생성
      return await this.create({
        questionId,
        wrongCount: 1,
        lastWrongAt: new Date().toISOString(),
        isBookmarked: false,
        userAnswer,
        correctAnswer
      });
    }
  }

  async updateNote(questionId: string, note: string): Promise<WrongAnswerRecord> {
    const existing = await this.findById(questionId);
    if (!existing) throw new Error('Wrong answer record not found');
    
    return await this.update(questionId, { note });
  }

  async toggleBookmark(questionId: string): Promise<WrongAnswerRecord> {
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentResult = await this.executeQuery(
      'SELECT COUNT(*) as count FROM wrong_answers WHERE lastWrongAt >= ?',
      [sevenDaysAgo.toISOString()]
    );
    const recentWrongAnswers = recentResult.rows.item(0).count;

    return {
      totalWrongAnswers,
      mostWrongCategory,
      averageWrongCount: Math.round(averageWrongCount * 100) / 100,
      recentWrongAnswers
    };
  }

  async getWrongAnswersByCount(minCount: number): Promise<WrongAnswerRecord[]> {
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

  async getBookmarkedWrongAnswers(): Promise<WrongAnswerRecord[]> {
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

  async getWrongAnswersByDateRange(startDate: string, endDate: string): Promise<WrongAnswerRecord[]> {
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

  async searchWrongAnswers(searchTerm: string): Promise<WrongAnswerRecord[]> {
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