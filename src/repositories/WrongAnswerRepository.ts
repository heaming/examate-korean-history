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

  async getWrongAnswers(tags: string[] = [], limit: number = 10, offset: number = 0, orderType: OrderType): Promise<WrongAnswer[]> {
    let dynamicOrderBy = "";
    switch (orderType) {
      case "WRONG_COUNT":
        dynamicOrderBy = `\nORDER BY wrongCount DESC`;
        break;
      case "RECENTLY":
      default:
        dynamicOrderBy = `\nORDER BY lastWrongAt DESC`;
        break;
    }

    let tagFilterCondition = "";
    let queryParams: any[] = [];

    if (tags && tags.length > 0) {
      tagFilterCondition = `
      \nAND EXISTS (
        SELECT 1 FROM json_each(w.tags) 
        WHERE value IN (${tags.map(() => '?').join(', ')})
      )
    `;
      queryParams = [...tags];
    }

    const sql = `
      SELECT
        w.*,
        CASE WHEN b.questionId IS NOT NULL THEN 1 ELSE 0 END as isBookmarked
      FROM wrong_answer w
      LEFT JOIN bookmark b ON w.questionId = b.questionId
      WHERE 1=1
        ${tagFilterCondition}
        ${dynamicOrderBy}
        LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    const result = await this.executeQuery(sql, queryParams);
    const wrongAnswers: WrongAnswer[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      wrongAnswers.push({
        id: row.id,
        questionId: row.questionId,
        lastWrongAt: row.lastWrongAt,
        wrongCount: row.wrongCount,
        tags: this.parseJsonField(row.tags), // JSON 문자열을 배열로 파싱
        userAnswer: row.userAnswer,
        correctAnswer: row.correctAnswer,
        note: row.note,
        isBookmarked: this.integerToBoolean(row.isBookmarked),
        createdAt: row.createdAt
      });
    }

    return wrongAnswers;
  }

  async getWrongAnswerByQuestionId(questionId: string): Promise<WrongAnswer | null> {
    const result = await this.executeQuery(`
        SELECT * 
        FROM wrong_answers
        LEFT JOIN bookmark b ON w.questionId = b.questionId
        WHERE questionId = ?
      `,
        [questionId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows.item(0);
    return row || null;
  }

  async upsertWrongAnswer(data: WrongAnswer) {
    let existing = await this.getWrongAnswerByQuestionId(data.questionId);
    const now = dayjs().format('YYYY-MM-DD');
    if (existing && existing.id) {
      return await this.update(existing.id, {
        lastWrongAt: now,
        wrongCount: existing.wrongCount+1,
        userAnswer: data.userAnswer,
      })
    }

    return await this.create(data);
  }

  async upsertWrongAnswers(dataList: Omit<WrongAnswer, 'id'>[]): Promise<void> {
    if (!dataList.length) return;

    try {
      await this.executeQuery('BEGIN TRANSACTION');

      const existingIds = dataList.map(d => d.questionId);
      const placeholders = existingIds.map(() => '?').join(', ');
      const existingResult = await this.executeQuery(
          `SELECT * FROM wrong_answer WHERE questionId IN (${placeholders})`,
          existingIds
      );

      const existingMap = new Map<string, WrongAnswer>();
      for (let i = 0; i < existingResult.rows.length; i++) {
        const row = existingResult.rows.item(i);
        existingMap.set(row.questionId, {
          ...row,
          tags: this.parseJsonField(row.tags),
        });
      }

      const queries = dataList.map(data => {
        const now = dayjs().format('YYYY-MM-DD');
        const existing = existingMap.get(data.questionId);

        // 기존 데이터가 있으면 기존 값 우선, 새 데이터로 덮어쓰기
        const mergedData = existing ? {
          questionId: data.questionId,
          lastWrongAt: data.lastWrongAt || now,
          wrongCount: existing.wrongCount + 1, // 기존 카운트 + 1
          tags: data.tags !== undefined ? data.tags : existing.tags, // data에 있으면 새 값, 없으면 기존 값
          userAnswer: data.userAnswer !== undefined ? data.userAnswer : existing.userAnswer,
          correctAnswer: data.correctAnswer, // correctAnswer는 항상 새 값 (필수)
          note: data.note !== undefined ? data.note : existing.note,
          isBookmarked: data.isBookmarked !== undefined ? data.isBookmarked : existing.isBookmarked,
          createdAt: existing.createdAt // 생성일은 기존 값 유지
        } : {
          // 새 데이터인 경우
          questionId: data.questionId,
          lastWrongAt: data.lastWrongAt || now,
          wrongCount: data.wrongCount || 1,
          tags: data.tags || [],
          userAnswer: data.userAnswer || null,
          correctAnswer: data.correctAnswer,
          note: data.note || null,
          isBookmarked: data.isBookmarked || false,
          createdAt: data.createdAt || now
        };

        return {
          query: `INSERT OR REPLACE INTO wrong_answer 
                (questionId, lastWrongAt, wrongCount, tags, userAnswer, correctAnswer, note, isBookmarked, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            mergedData.questionId,
            mergedData.lastWrongAt,
            mergedData.wrongCount,
            this.stringifyJsonField(mergedData.tags),
            mergedData.userAnswer,
            mergedData.correctAnswer,
            mergedData.note,
            this.booleanToInteger(mergedData.isBookmarked),
            mergedData.createdAt
          ]
        };
      });

      await this.executeBatch(queries);
      await this.executeQuery('COMMIT');

    } catch (error) {
      await this.executeQuery('ROLLBACK');
      console.error('Failed to bulk create wrong answers:', error);
      throw error;
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

  async findById(id: number): Promise<WrongAnswer | null> {
    const result = await this.executeQuery(
      'SELECT * FROM wrong_answers WHERE id = ?',
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows.item(0);
    return row || null;
  }

  async create(data: Omit<WrongAnswer, 'id'>): Promise<WrongAnswer> {
    const now = dayjs().format('YYYY-MM-DD');

    const result = await this.executeQuery(
        `INSERT INTO wrong_answer (questionId, lastWrongAt, wrongCount, tags, userAnswer, correctAnswer, note,
                                   createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.questionId,
          data.lastWrongAt || now,
          data.wrongCount || 1,
          this.stringifyJsonField(data.tags),
          data.userAnswer || null,
          data.correctAnswer,
          data.note || null,
          data.createdAt || now
        ]
    );

    const row = result.rows.item(0);
    return row as WrongAnswer;
  }

  async update(id: number, data: Partial<WrongAnswer>): Promise<WrongAnswer | null> {
    const updateFields = [];
    const values = [];

    if (data.lastWrongAt !== undefined) {
      updateFields.push('lastWrongAt = ?');
      values.push(data.lastWrongAt);
    }

    if (data.wrongCount !== undefined) {
      updateFields.push('wrongCount = ?');
      values.push(data.wrongCount);
    }

    if (data.tags !== undefined) {
      updateFields.push('tags = ?');
      values.push(this.stringifyJsonField(data.tags));
    }

    if (data.userAnswer !== undefined) {
      updateFields.push('userAnswer = ?');
      values.push(data.userAnswer);
    }

    if (data.correctAnswer !== undefined) {
      updateFields.push('correctAnswer = ?');
      values.push(data.correctAnswer);
    }

    if (data.note !== undefined) {
      updateFields.push('note = ?');
      values.push(data.note);
    }

    if (updateFields.length === 0) return null;

    const sql = `
    UPDATE wrong_answer 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `;

    values.push(id);

    await this.executeQuery(sql, values);

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.executeQuery(
      'DELETE FROM wrong_answers WHERE id = ?',
      [id]
    );
    return result.rowsAffected > 0;
  }
} 