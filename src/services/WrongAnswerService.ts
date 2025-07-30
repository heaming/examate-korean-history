import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import {WrongAnswerRepository} from "@/src/repositories/WrongAnswerRepository";
import {BookmarkService} from "@/src/services/BookmarkService";
import {Bookmark, BookmarkData, OrderType, WrongAnswer} from "@/src/types";
dayjs.locale('ko')

export class WrongAnswerService {
  private wrongAnswerRepository: WrongAnswerRepository;
  private bookmarkService: BookmarkService;
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

  async getWrongAnswers(tags: string[] = [], limit:number = 10, offset:number = 0, orderType: OrderType = 'RECENTLY'): Promise<WrongAnswer[]> {
    try {
      return await this.wrongAnswerRepository.getWrongAnswers(tags, limit, offset, orderType);
    } catch (error) {
      console.error('Error getting Wrong Answers:', error);
      return [];
    }
  }

  async upsertWrongAnswers(dataList: Omit<WrongAnswer, 'id'>[]): Promise<void> {
    try {
      return await this.wrongAnswerRepository.upsertWrongAnswers(dataList);
    } catch (error) {
      console.error('Error upserting WrongAnswers', error);
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