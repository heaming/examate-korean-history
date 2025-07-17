import dayjs from 'dayjs';
import { StudyStatsRepository } from '../repositories/StudyStatsRepository';
import { StudyHistory, StudyStats } from '../types/database';
import { MonthlyStats, WeeklyStats } from '../types/service';

export class StudyStatsService {
  private studyStatsRepository: StudyStatsRepository;

  constructor() {
    this.studyStatsRepository = new StudyStatsRepository();
  }

  async initialize(): Promise<void> {
    await this.studyStatsRepository.initializeTable();
  }

  /**
   * 전체 학습 통계 조회
   */
  async getStudyStats(): Promise<StudyStats> {
    const stats = await this.studyStatsRepository.getStats();

    if (!stats) {
      const now = dayjs().format('YYYY-MM-DD');
      const defaultStats: Omit<StudyStats, 'id'> = {
        studyStreak: 0,
        lastStudyDate: undefined,
        totalStudyTime: 0,
        createAt: now,
        updatedAt: now,
      };
      
      const created = await this.studyStatsRepository.create(defaultStats);
      return created;
    }
    
    return stats;
  }

  /**
   * 학습 통계 업데이트
   */
  async updateStudyStats(data: Partial<StudyStats>): Promise<StudyStats> {
    await this.studyStatsRepository.updateStats(data);
    return await this.getStudyStats();
  }
  //
  // /**
  //  * 문제 풀이 결과 기록
  //  */
  // async recordQuestionResult(questionResult: {
  //   questionId: string;
  //   isCorrect: boolean;
  //   userAnswer: number;
  //   correctAnswer: number;
  //   studyTime?: number; // 분 단위, 선택적 필드
  // }): Promise<void> {
  //   // StudyHistory 형태로 데이터 변환
  //   const studyHistoryData: Omit<StudyHistory, 'id'> = {
  //     questionId: questionResult.questionId,
  //     solvedAt: dayjs().format('YYYY-MM-DD'),
  //     isCorrect: questionResult.isCorrect,
  //     userAnswer: questionResult.userAnswer,
  //     correctAnswer: questionResult.correctAnswer,
  //     createdAt: dayjs().format('YYYY-MM-DD')
  //   };
  //
  //   // 학습 기록 저장
  //   await this.studyHistoryRepository.create(studyHistoryData);
  //
  //   // 학습 시간 추가 (있는 경우에만)
  //   if (questionResult.studyTime) {
  //     await this.studyStatsRepository.addStudyTime(questionResult.studyTime);
  //   }
  //
  //   // 연속 학습일 업데이트
  //   await this.updateStudyStreak();
  // }
  //
  // /**
  //  * 연속 학습일 업데이트
  //  */
  // async updateStudyStreak(): Promise<void> {
  //   const streak = await this.studyHistoryRepository.getStudyStreak();
  //   await this.studyStatsRepository.updateStudyStreak(streak);
  // }
  //
  // /**
  //  * 특정 날짜의 문제 조회
  //  */
  // async getQuestionsByDate(date: string): Promise<StudyHistory[]> {
  //   return await this.studyHistoryRepository.getQuestionsByDate(date);
  // }
  //
  // /**
  //  * 학습 통계 초기화
  //  */
  // async resetStats(): Promise<void> {
  //   await this.studyStatsRepository.delete(1);
  // }
  //
  // /**
  //  * 학습 기록 삭제
  //  */
  // async deleteStudyHistory(id: number): Promise<boolean> {
  //   return await this.studyHistoryRepository.delete(id);
  // }
  //
  // /**
  //  * 주간 학습 통계 조회
  //  */
  // async getWeeklyStats(): Promise<WeeklyStats> {
  //   const weekAgo = dayjs().subtract(7, 'day');
  //   const allHistory = await this.studyHistoryRepository.findAll();
  //
  //   const weeklyHistory = allHistory.filter(h =>
  //     dayjs(h.solvedAt).isAfter(weekAgo)
  //   );
  //
  //   const weeklySolved = weeklyHistory.length;
  //   const weeklyCorrect = weeklyHistory.filter(h => h.isCorrect).length;
  //   const weeklyAccuracy = weeklySolved > 0
  //     ? Math.round((weeklyCorrect / weeklySolved) * 100)
  //     : 0;
  //
  //   return {
  //     weeklyStudyTime: 0, // StudyHistory에서 studyTime 제거되어 0으로 설정
  //     weeklySolved,
  //     weeklyCorrect,
  //     weeklyAccuracy
  //   };
  // }
  //
  // /**
  //  * 월간 학습 통계 조회
  //  */
  // async getMonthlyStats(): Promise<MonthlyStats> {
  //   const monthAgo = dayjs().subtract(30, 'day');
  //   const allHistory = await this.studyHistoryRepository.findAll();
  //
  //   const monthlyHistory = allHistory.filter(h =>
  //     dayjs(h.solvedAt).isAfter(monthAgo)
  //   );
  //
  //   const monthlySolved = monthlyHistory.length;
  //   const monthlyCorrect = monthlyHistory.filter(h => h.isCorrect).length;
  //   const monthlyAccuracy = monthlySolved > 0
  //     ? Math.round((monthlyCorrect / monthlySolved) * 100)
  //     : 0;
  //
  //   return {
  //     monthlyStudyTime: 0, // StudyHistory에서 studyTime 제거되어 0으로 설정
  //     monthlySolved,
  //     monthlyCorrect,
  //     monthlyAccuracy
  //   };
  // }

  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up StudyStatsService...');

      if (this.studyStatsRepository && typeof this.studyStatsRepository.cleanup === 'function') {
        await this.studyStatsRepository.cleanup();
      }

      console.log('StudyStatsService cleaned up');
    } catch (error) {
      console.error('Error during StudyStatsService cleanup:', error);
    }
  }

} 