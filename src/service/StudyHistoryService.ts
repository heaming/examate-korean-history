import dayjs from 'dayjs';
import { StudyHistoryRepository } from '@/src/repository/StudyHistoryRepository';
import {OrderType, StudyHistory} from '@/src/types';

export class StudyHistoryService {
  private studyHistoryRepository: StudyHistoryRepository;

  constructor() {
    this.studyHistoryRepository = new StudyHistoryRepository();
  }

  /**
   * 학습 이력 저장 조회
   */
  async getStudyHistories(year: number, round: number) {
    return await this.studyHistoryRepository.getStudyHistories(year, round);
  }

  /**
   * 전체 학습 이력 count 조회
   */
  async getStudyHistoryTotalCount(): Promise<{solvedCount: number, correctCount: number, accuracy: number}> {
    const studyHistoryTotalCount = await this.studyHistoryRepository.getStudyHistoryTotalCount();
    const accuracy = studyHistoryTotalCount.solvedCount > 0
        ? Math.round((studyHistoryTotalCount.solvedCount / studyHistoryTotalCount.correctCount) * 100) : 0;

    return { ...studyHistoryTotalCount, accuracy };
  }


  /**
   * 오늘의 학습 통계 조회
   */
  async getStudyHistoryCountByDate(): Promise<{solvedCount: number, correctCount: number}> {
    const today = dayjs().format('YYYY-MM-DD')

    const studyHistoryCountByDate = await this.studyHistoryRepository.getStudyHistoryCountByDate(today);
    
    return {
      solvedCount: studyHistoryCountByDate.solvedCount,
      correctCount: studyHistoryCountByDate.correctCount,
    };
  }

  /**
   * 최근 문제 조회
   */
  async getRecentQuestions(limit: number = 3): Promise<StudyHistory[]> {
    return await this.studyHistoryRepository.getRecentQuestions(limit);
  }

  /**
   * 문제 이력 저장
   */
  async addStudyHistories(studyHistories: Omit<StudyHistory, 'id'>[]) {
    return await this.studyHistoryRepository.addStudyHistories(studyHistories);
  }

  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up StudyHistoryService...');

      if (this.studyHistoryRepository && typeof this.studyHistoryRepository.cleanup === 'function') {
        await this.studyHistoryRepository.cleanup();
      }

      console.log('StudyHistoryService cleaned up');
    } catch (error) {
      console.error('Error during StudyHistoryService cleanup:', error);
    }
  }

} 