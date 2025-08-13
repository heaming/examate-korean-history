import { BookmarkRepository } from '@/src/repository/BookmarkRepository';
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

  async removeBookmark(questionId: string): Promise<boolean> {
    try {
      return await this.bookmarkRepository.delete(questionId);
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

  async updateBookmark(id: string, bookmark: Partial<Bookmark>): Promise<Bookmark | null> {
    try {
      return await this.bookmarkRepository.update(id, bookmark);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw new Error('북마크 업데이트에 실패했습니다.');
    }
  }

  async getBookmarksByYearRound(year: number, round: number): Promise<{bookmarkId: number, questionId: string}[]> {
    try {
      return await this.bookmarkRepository.getBookmarksByYearRound(year, round);
    } catch (error) {
      console.error('Error getting bookmarks by year and round:', error);
      throw new Error('북마크 조회에 실패했습니다.');
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

  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up BookmarkService...');

      if (this.bookmarkRepository && typeof this.bookmarkRepository.cleanup === 'function') {
        await this.bookmarkRepository.cleanup();
      }

      console.log('BookmarkService cleaned up');
    } catch (error) {
      console.error('Error during BookmarkService cleanup:', error);
    }
  }
} 