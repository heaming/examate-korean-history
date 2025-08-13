import {Bookmark} from '../types';
import { BaseRepository } from './BaseRepository';
import dayjs from "dayjs";

export class BookmarkRepository extends BaseRepository<Bookmark> {
  constructor() {
    super();
  }

  async findAll(): Promise<Bookmark[]> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmark ORDER BY bookmarkedAt DESC'
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        tags: this.parseJsonField(row.tags)
      };
    });
  }

  async findById(id: string): Promise<Bookmark | null> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmark WHERE id = ?',
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows.item(0);
    return {
      ...row,
      tags: this.parseJsonField(row.tags)
    };
  }

  async create(data: Omit<Bookmark, 'id'>): Promise<Bookmark> {
    const now = dayjs().format('YYYY-MM-DD');
    const bookmark = await this.executeQuery(
      `INSERT INTO bookmark (questionId, year, round, questionNumber, questionText, questionImageUrl, correctAnswer, explanation, note, tags, bookmarkedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.questionId,
        data.year,
        data.round,
        data.questionNumber,
        data.questionText,
        data.questionImageUrl || null,
        data.correctAnswer,
        data.explanation || null,
        data.note || null,
        this.stringifyJsonField(data.tags),
        now
      ]
    );
    
    return bookmark;
  }

  async update(id: string, bookmark: Partial<Bookmark>): Promise<Bookmark| null> {
    const updateFields = [];
    const values = [];

    if (bookmark.questionId !== undefined) {
      updateFields.push('questionId = ?');
      values.push(bookmark.questionId);
    }

    if (bookmark.year !== undefined) {
      updateFields.push('year = ?');
      values.push(bookmark.year);
    }

    if (bookmark.round !== undefined) {
      updateFields.push('round = ?');
      values.push(bookmark.round);
    }

    if (bookmark.questionNumber !== undefined) {
      updateFields.push('questionNumber = ?');
      values.push(bookmark.questionNumber);
    }

    if (bookmark.questionText !== undefined) {
      updateFields.push('questionText = ?');
      values.push(bookmark.questionText);
    }

    if (bookmark.questionImageUrl !== undefined) {
      updateFields.push('questionImageUrl = ?');
      values.push(bookmark.questionImageUrl);
    }

    if (bookmark.correctAnswer !== undefined) {
      updateFields.push('correctAnswer = ?');
      values.push(bookmark.correctAnswer);
    }

    if (bookmark.explanation !== undefined) {
      updateFields.push('explanation = ?');
      values.push(bookmark.explanation);
    }

    if (bookmark.note !== undefined) {
      updateFields.push('note = ?');
      values.push(bookmark.note);
    }

    if (bookmark.tags !== undefined) {
      updateFields.push('tags = ?');
      values.push(JSON.stringify(bookmark.tags)); // 배열을 JSON 문자열로 변환
    }

    if (bookmark.bookmarkedAt !== undefined) {
      updateFields.push('bookmarkedAt = ?');
      values.push(bookmark.bookmarkedAt);
    }

    if (updateFields.length === 0) return null;

    // updatedAt 필드 추가 (필요하다면)
    updateFields.push(`updatedAt = date('now')`);

    const sql = `
    UPDATE bookmark 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `;

    values.push(id); // WHERE 절용 id 추가

    return await this.executeQuery(sql, values);
  }

  async delete(questionId: string): Promise<boolean> {
    const result = await this.executeQuery(
        'DELETE FROM bookmark WHERE questionId = ?',
        [questionId]
    );

    return result.rowsAffected > 0;
  }

  async getBookmarks(limit: number=10, offset: number=0): Promise<Bookmark[]> {
    const result = await this.executeQuery(
        `
          SELECT *
          FROM bookmark
          ORDER BY bookmarkedAt DESC
            LIMIT ? OFFSET ?
        `,
        [limit, offset]
    );

    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        tags: this.parseJsonField(row.tags)
      };
    });
  }

  async getBookmarksTotalCount(): Promise<number> {
    const result = await this.executeQuery(`SELECT COUNT(*) as 'count' AS count FROM bookmark`);
    return result.rows.item(0).count;
  }

  async findByQuestionId(questionId: string): Promise<Bookmark | null> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmark WHERE questionId = ?',
      [questionId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows.item(0);
    return {
      ...row,
      tags: this.parseJsonField(row.tags)
    };
  }

  async getBookmarksByYearRound(year: number, round: number): Promise<{bookmarkId: number, questionId: string}[]> {
    const result = await this.executeQuery(`
      SELECT id, questionId
      FROM bookmark
      WHERE year = ?
      AND round = ?
    `, [year, round]);

    if (result.rows.length === 0) return [];

    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        bookmarkId: row.id,
        questionId: row.questionId,
      };
    });
  }

  // async findByCategory(category: string): Promise<Bookmark[]> {
  //   const result = await this.executeQuery(
  //     'SELECT * FROM bookmarks WHERE category = ? ORDER BY bookmarkedAt DESC',
  //     [category]
  //   );
  //
  //   return Array.from({ length: result.rows.length }, (_, i) => {
  //     const row = result.rows.item(i);
  //     return {
  //       ...row,
  //       tags: this.parseJsonField(row.tags)
  //     };
  //   });
  // }

  // async findByYear(year: number): Promise<Bookmark[]> {
  //   const result = await this.executeQuery(
  //     'SELECT * FROM bookmarks WHERE year = ? ORDER BY round DESC, number ASC',
  //     [year]
  //   );
  //
  //   return Array.from({ length: result.rows.length }, (_, i) => {
  //     const row = result.rows.item(i);
  //     return {
  //       ...row,
  //       tags: this.parseJsonField(row.tags)
  //     };
  //   });
  // }
  //
  // async searchBookmarks(searchTerm: string): Promise<Bookmark[]> {
  //   const result = await this.executeQuery(
  //     'SELECT * FROM bookmarks WHERE title LIKE ? OR note LIKE ? ORDER BY bookmarkedAt DESC',
  //     [`%${searchTerm}%`, `%${searchTerm}%`]
  //   );
  //
  //   return Array.from({ length: result.rows.length }, (_, i) => {
  //     const row = result.rows.item(i);
  //     return {
  //       ...row,
  //       tags: this.parseJsonField(row.tags)
  //     };
  //   });
  // }

  // async getBookmarkTotalCount(): Promise<number> {
  //   const result = await this.executeQuery('SELECT COUNT(*) as count FROM bookmarks');
  //   return result.rows.item(0).count;
  // }

  async getBookmarkCountByDate(date: string): Promise<number> {
    const result = await this.executeQuery(`
      SELECT count(*) as count
      FROM bookmark
      WHERE bookmarkedAt = ? 
      ORDER BY bookmarkedAt DESC
    `, [date]);

    return (result.rows.length === 0) ? 0 : result.rows.item(0).count;
  }

  // async getBookmarksByDate(date: string): Promise<Bookmark[]> {
  //   const result = await this.executeQuery(`
  //     SELECT *
  //     FROM bookmarks
  //     WHERE bookmarkedAt = ?
  //     ORDER BY bookmarkedAt DESC
  //   `, [date]);
  //
  //   return Array.from({ length: result.rows.length }, (_, i) => {
  //     const row = result.rows.item(i);
  //     return {
  //       ...row,
  //       tags: this.parseJsonField(row.tags)
  //     };
  //   });
  // }

  async getAllBookmarks(): Promise<Bookmark[]> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmark ORDER BY created_at DESC'
    );

    
    const bookmarks = result.rows?._array || [];
    return bookmarks.map((row: any) => ({
      id: row.id,
      questionId: row.question_id,
      title: row.title,
      content: row.content,
      difficulty: row.difficulty,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
} 