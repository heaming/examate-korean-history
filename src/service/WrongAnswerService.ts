import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import {WrongAnswerRepository} from "@/src/repository/WrongAnswerRepository";
import {BookmarkService} from "@/src/service/BookmarkService";
import {Bookmark, BookmarkData, OrderType, WrongAnswer} from "@/src/types";
dayjs.locale('ko')

export class WrongAnswerService {
  private wrongAnswerRepository: WrongAnswerRepository;
  private bookmarkService: BookmarkService;

  constructor(bookmarkService: BookmarkService) {
    this.wrongAnswerRepository = new WrongAnswerRepository();
    this.bookmarkService = bookmarkService;
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
      return await this.wrongAnswerRepository.upsertWrongAnswers(dataList);
  }


  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up BookmarkService...');

      if (this.wrongAnswerRepository && typeof this.wrongAnswerRepository.cleanup === 'function') {
        await this.wrongAnswerRepository.cleanup();
      }

      console.log('BookmarkService cleaned up');
    } catch (error) {
      console.error('Error during BookmarkService cleanup:', error);
    }
  }
} 