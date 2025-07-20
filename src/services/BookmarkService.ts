import { BookmarkRepository } from '../repositories/BookmarkRepository';
import {Bookmark, BookmarkData} from '../types';
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
dayjs.locale('ko')

export class BookmarkService {
  private bookmarkRepository: BookmarkRepository;
  private isInitialized: boolean = false;

  constructor() {
    this.bookmarkRepository = new BookmarkRepository();
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing BookmarkService...');

      await this.bookmarkRepository.initializeTable();

      console.log('BookmarkService initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize BookmarkService:', error);
      throw error;
    }
  }

  /**
   * 북마크 초기 데이터 조회
   */
  async getBookmarkData(): Promise<BookmarkData> {
    if (!this.isInitialized) {
      throw new Error('BookmarkService not initialized');
    }

    try {
      const [
        bookmarks,
        totalCount
      ] = await Promise.all([
        this.bookmarkRepository.getBookmarks(),
        this.bookmarkRepository.getBookmarksTotalCount(),
      ]);

      return {
        bookmarks,
        totalCount
      }
    } catch (error) {
      console.error('Error getting bookmark page data:', error);
      throw error;
    }
  }
  

  async getAllBookmarks(): Promise<Bookmark[]> {
    const bookmarks = await this.bookmarkRepository.getAllBookmarks();
    console.log('BookmarkService: 북마크 조회 완료, 총', bookmarks.length, '개');
    return bookmarks;
  }

  async getBookmarkById(id: string): Promise<Bookmark | null> {
    try {
      return await this.bookmarkRepository.findById(id);
    } catch (error) {
      console.error('Error getting bookmark by id:', error);
      throw new Error('북마크를 불러오는데 실패했습니다.');
    }
  }

  async getBookmarks(limit: number=10, offset: number=10): Promise<Bookmark[]> {
    try {
      return await this.bookmarkRepository.getBookmarks(Number(limit), Number(offset));
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  async addBookmark(Bookmark: Omit<Bookmark, 'id'>): Promise<Bookmark> {
    try {
      // 중복 체크
      const existing = await this.bookmarkRepository.findByQuestionId(Bookmark.questionId);
      if (existing) {
        throw new Error('이미 북마크된 문제입니다.');
      }

      // 북마크 생성
      const bookmark: Omit<Bookmark, 'id'> = {
        ...Bookmark,
        bookmarkedAt: dayjs().format('YYYY-MM-DD'),
        tags: Bookmark.tags || []
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

  async updateBookmarkNote(id: string, note: string): Promise<Bookmark> {
    try {
      return await this.bookmarkRepository.update(id, { note });
    } catch (error) {
      console.error('Error updating bookmark note:', error);
      throw new Error('북마크 노트 업데이트에 실패했습니다.');
    }
  }

  async getBookmarksByCategory(category: string): Promise<Bookmark[]> {
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

  async getBookmarksByYear(year: number): Promise<Bookmark[]> {
    try {
      return await this.bookmarkRepository.findByYear(year);
    } catch (error) {
      console.error('Error getting bookmarks by year:', error);
      throw new Error('연도별 북마크를 불러오는데 실패했습니다.');
    }
  }

  async searchBookmarks(searchTerm: string): Promise<Bookmark[]> {
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

  async getBookmarkTotalCount(): Promise<number> {
    try {
      return await this.bookmarkRepository.getBookmarkTotalCount();
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  }

  async getBookmarkCountByDate(date: string): Promise<number> {
    try {
      return await this.bookmarkRepository.getBookmarkCountByDate(date);
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  }

  async getBookmarkTodayCount(): Promise<number> {
    const today = dayjs().format('YYYY-MM-DD');
    try {
      return await this.bookmarkRepository.getBookmarkCountByDate(today);
    } catch (error) {
      console.error('Error getting today bookmark count:', error);
      return 0;
    }
  }

  async getTodayBookmarks(): Promise<Bookmark[]> {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      
      return await this.bookmarkRepository.getBookmarksByDate(today);
    } catch (error) {
      console.error('Error getting today bookmarks:', error);
      return [];
    }
  }

  async getBookmarksByDate(date: string): Promise<Bookmark[]> {
    try {
      return await this.bookmarkRepository.getBookmarksByDate(date);
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
  }): Promise<{ isBookmarked: boolean; bookmark?: Bookmark }> {
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
          bookmarkedAt: dayjs().format('YYYY-MM-DD'),
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

  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up BookmarkService...');

      // Repository cleanup이 있다면 호출
      if (this.bookmarkRepository && typeof this.bookmarkRepository.cleanup === 'function') {
        await this.bookmarkRepository.cleanup();
      }

      console.log('BookmarkService cleaned up');
    } catch (error) {
      console.error('Error during BookmarkService cleanup:', error);
    }
  }
} 