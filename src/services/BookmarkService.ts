import dayjs from 'dayjs';
import { BookmarkRepository } from '../repositories/BookmarkRepository';
import { BookmarkData } from '../types';

export class BookmarkService {
  private bookmarkRepository: BookmarkRepository;

  constructor() {
    this.bookmarkRepository = new BookmarkRepository();
  }

  async getAllBookmarks(): Promise<BookmarkData[]> {
    console.log('BookmarkService: 모든 북마크 조회 시작');
    const bookmarks = await this.bookmarkRepository.getAllBookmarks();
    console.log('BookmarkService: 북마크 조회 완료, 총', bookmarks.length, '개');
    return bookmarks;
  }

  async getBookmarkById(id: string): Promise<BookmarkData | null> {
    try {
      return await this.bookmarkRepository.findById(id);
    } catch (error) {
      console.error('Error getting bookmark by id:', error);
      throw new Error('북마크를 불러오는데 실패했습니다.');
    }
  }

  async addBookmark(bookmarkData: Omit<BookmarkData, 'id'>): Promise<BookmarkData> {
    try {
      // 중복 체크
      const existing = await this.bookmarkRepository.findByQuestionId(bookmarkData.questionId);
      if (existing) {
        throw new Error('이미 북마크된 문제입니다.');
      }

      // 북마크 생성
      const bookmark: Omit<BookmarkData, 'id'> = {
        ...bookmarkData,
        bookmarkedAt: dayjs().format(),
        tags: bookmarkData.tags || []
      };

      return await this.bookmarkRepository.create(bookmark);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('북마크 추가에 실패했습니다.');
    }
  }

  async removeBookmark(id: string): Promise<boolean> {
    try {
      const success = await this.bookmarkRepository.delete(id);
      if (!success) {
        throw new Error('북마크를 찾을 수 없습니다.');
      }
      return success;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('북마크 삭제에 실패했습니다.');
    }
  }

  async removeBookmarkByQuestionId(questionId: string): Promise<boolean> {
    try {
      return await this.bookmarkRepository.deleteByQuestionId(questionId);
    } catch (error) {
      console.error('Error removing bookmark by question id:', error);
      throw new Error('북마크 삭제에 실패했습니다.');
    }
  }

  async isBookmarked(questionId: string): Promise<boolean> {
    try {
      const bookmark = await this.bookmarkRepository.findByQuestionId(questionId);
      return bookmark !== null;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  async updateBookmarkNote(id: string, note: string): Promise<BookmarkData> {
    try {
      return await this.bookmarkRepository.update(id, { note });
    } catch (error) {
      console.error('Error updating bookmark note:', error);
      throw new Error('북마크 노트 업데이트에 실패했습니다.');
    }
  }

  async getBookmarksByCategory(category: string): Promise<BookmarkData[]> {
    try {
      if (category === 'all') {
        return await this.getAllBookmarks();
      }
      return await this.bookmarkRepository.findByCategory(category);
    } catch (error) {
      console.error('Error getting bookmarks by category:', error);
      throw new Error('카테고리별 북마크를 불러오는데 실패했습니다.');
    }
  }

  async getBookmarksByYear(year: number): Promise<BookmarkData[]> {
    try {
      return await this.bookmarkRepository.findByYear(year);
    } catch (error) {
      console.error('Error getting bookmarks by year:', error);
      throw new Error('연도별 북마크를 불러오는데 실패했습니다.');
    }
  }

  async searchBookmarks(searchTerm: string): Promise<BookmarkData[]> {
    try {
      if (!searchTerm.trim()) {
        return await this.getAllBookmarks();
      }
      return await this.bookmarkRepository.searchBookmarks(searchTerm);
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      throw new Error('북마크 검색에 실패했습니다.');
    }
  }

  async getBookmarkCount(): Promise<number> {
    try {
      return await this.bookmarkRepository.getBookmarkCount();
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  }

  async getTodayBookmarks(): Promise<BookmarkData[]> {
    try {
      const today = dayjs();
      const startOfDay = today.startOf('day').format();
      const endOfDay = today.endOf('day').format();
      
      return await this.bookmarkRepository.getBookmarksByDateRange(startOfDay, endOfDay);
    } catch (error) {
      console.error('Error getting today bookmarks:', error);
      return [];
    }
  }

  async getBookmarksByDateRange(startDate: string, endDate: string): Promise<BookmarkData[]> {
    try {
      return await this.bookmarkRepository.getBookmarksByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error getting bookmarks by date range:', error);
      throw new Error('날짜별 북마크를 불러오는데 실패했습니다.');
    }
  }

  async toggleBookmark(questionData: {
    questionId: string;
    title: string;
    category: string;
    year: number;
    round: number;
    number: number;
    answer?: string;
    note?: string;
    tags?: string[];
  }): Promise<{ isBookmarked: boolean; bookmark?: BookmarkData }> {
    try {
      const existingBookmark = await this.bookmarkRepository.findByQuestionId(questionData.questionId);
      
      if (existingBookmark) {
        // 북마크 제거
        await this.bookmarkRepository.delete(existingBookmark.id);
        return { isBookmarked: false };
      } else {
        // 북마크 추가
        const newBookmark = await this.addBookmark({
          questionId: questionData.questionId,
          title: questionData.title,
          category: questionData.category,
          year: questionData.year,
          round: questionData.round,
          number: questionData.number,
          answer: questionData.answer,
          note: questionData.note,
          tags: questionData.tags || [],
          bookmarkedAt: dayjs().format()
        });
        return { isBookmarked: true, bookmark: newBookmark };
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw new Error('북마크 토글에 실패했습니다.');
    }
  }

  async getBookmarkCategories(): Promise<string[]> {
    try {
      const bookmarks = await this.getAllBookmarks();
      const categories = [...new Set(bookmarks.map(b => b.category))];
      return categories.sort();
    } catch (error) {
      console.error('Error getting bookmark categories:', error);
      return [];
    }
  }

  async getBookmarkYears(): Promise<number[]> {
    try {
      const bookmarks = await this.getAllBookmarks();
      const years = [...new Set(bookmarks.map(b => b.year))];
      return years.sort((a, b) => b - a); // 최신 연도부터
    } catch (error) {
      console.error('Error getting bookmark years:', error);
      return [];
    }
  }
} 