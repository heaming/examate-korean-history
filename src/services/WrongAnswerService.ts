import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import {WrongAnswerRepository} from "@/src/repositories/WrongAnswerRepository";
import {BookmarkService} from "@/src/services/BookmarkService";
import {Bookmark, BookmarkData} from "@/src/types";
dayjs.locale('ko')

export class WrongAnswerService {
  private wrongAnswerRepository: WrongAnswerRepository;
  private bookmarkService: BookmarkService; // BookmarkRepository 대신 BookmarkService 사용
  private isInitialized: boolean = false;

  constructor(bookmarkService: BookmarkService) {
    this.wrongAnswerRepository = new WrongAnswerRepository();
    this.bookmarkService = bookmarkService;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing WrongAnswerService...');

      await this.wrongAnswerRepository.initializeTable();

      console.log('WrongAnswerService initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize WrongAnswerService:', error);
      throw error;
    }
  }


  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up BookmarkService...');

      // Repository cleanup이 있다면 호출
      if (this.wrongAnswerRepository && typeof this.wrongAnswerRepository.cleanup === 'function') {
        await this.wrongAnswerRepository.cleanup();
      }

      console.log('BookmarkService cleaned up');
    } catch (error) {
      console.error('Error during BookmarkService cleanup:', error);
    }
  }
} 