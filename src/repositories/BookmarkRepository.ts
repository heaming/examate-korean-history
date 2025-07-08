import { BookmarkData } from '../types';
import { BaseRepository } from './BaseRepository';

export class BookmarkRepository extends BaseRepository<BookmarkData> {
  async findAll(): Promise<BookmarkData[]> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmarks ORDER BY bookmarkedAt DESC'
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        tags: this.parseJsonField(row.tags)
      };
    });
  }

  async findById(id: string): Promise<BookmarkData | null> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmarks WHERE id = ?',
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows.item(0);
    return {
      ...row,
      tags: this.parseJsonField(row.tags)
    };
  }

  async create(data: Omit<BookmarkData, 'id'>): Promise<BookmarkData> {
    const id = `${data.year}-${data.round}-${data.number}-${Date.now()}`;
    const bookmark: BookmarkData = { id, ...data };
    
    await this.executeQuery(
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
        bookmark.answer || null,
        bookmark.note || null,
        this.stringifyJsonField(bookmark.tags),
        bookmark.bookmarkedAt
      ]
    );
    
    return bookmark;
  }

  async update(id: string, data: Partial<BookmarkData>): Promise<BookmarkData> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Bookmark not found');
    
    const updated = { ...existing, ...data };
    
    await this.executeQuery(
      `UPDATE bookmarks SET questionId=?, title=?, category=?, year=?, round=?, number=?, answer=?, note=?, tags=?, bookmarkedAt=?
       WHERE id=?`,
      [
        updated.questionId,
        updated.title,
        updated.category,
        updated.year,
        updated.round,
        updated.number,
        updated.answer || null,
        updated.note || null,
        this.stringifyJsonField(updated.tags),
        updated.bookmarkedAt,
        id
      ]
    );
    
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.executeQuery(
      'DELETE FROM bookmarks WHERE id = ?',
      [id]
    );
    
    return result.rowsAffected > 0;
  }

  // 추가 메서드들
  async findByQuestionId(questionId: string): Promise<BookmarkData | null> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmarks WHERE questionId = ?',
      [questionId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows.item(0);
    return {
      ...row,
      tags: this.parseJsonField(row.tags)
    };
  }

  async findByCategory(category: string): Promise<BookmarkData[]> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmarks WHERE category = ? ORDER BY bookmarkedAt DESC',
      [category]
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        tags: this.parseJsonField(row.tags)
      };
    });
  }

  async findByYear(year: number): Promise<BookmarkData[]> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmarks WHERE year = ? ORDER BY round DESC, number ASC',
      [year]
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        tags: this.parseJsonField(row.tags)
      };
    });
  }

  async searchBookmarks(searchTerm: string): Promise<BookmarkData[]> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmarks WHERE title LIKE ? OR note LIKE ? ORDER BY bookmarkedAt DESC',
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        tags: this.parseJsonField(row.tags)
      };
    });
  }

  async getBookmarkCount(): Promise<number> {
    const result = await this.executeQuery('SELECT COUNT(*) as count FROM bookmarks');
    return result.rows.item(0).count;
  }

  async getBookmarksByDateRange(startDate: string, endDate: string): Promise<BookmarkData[]> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmarks WHERE bookmarkedAt BETWEEN ? AND ? ORDER BY bookmarkedAt DESC',
      [startDate, endDate]
    );
    
    return Array.from({ length: result.rows.length }, (_, i) => {
      const row = result.rows.item(i);
      return {
        ...row,
        tags: this.parseJsonField(row.tags)
      };
    });
  }

  async deleteByQuestionId(questionId: string): Promise<boolean> {
    const result = await this.executeQuery(
      'DELETE FROM bookmarks WHERE questionId = ?',
      [questionId]
    );
    
    return result.rowsAffected > 0;
  }

  async getAllBookmarks(): Promise<BookmarkData[]> {
    const result = await this.executeQuery(
      'SELECT * FROM bookmarks ORDER BY created_at DESC'
    );
    
    console.log('=== 북마크 조회 결과 ===');
    console.log('총 북마크 수:', result.rows?.length || 0);
    
    const bookmarks = result.rows?._array || [];
    bookmarks.forEach((bookmark: any, index: number) => {
      console.log(`북마크 ${index + 1}:`, {
        id: bookmark.id,
        questionId: bookmark.question_id,
        title: bookmark.title?.substring(0, 50) + '...',
        createdAt: bookmark.created_at
      });
    });
    
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