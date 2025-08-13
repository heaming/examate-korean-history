import dayjs from 'dayjs';
import { StudyStatsRepository } from '@/src/repository/StudyStatsRepository';
import { StudyHistory, StudyStats } from '@/src/types';

export class StudyStatsService {
  private studyStatsRepository: StudyStatsRepository;

  constructor() {
    this.studyStatsRepository = new StudyStatsRepository();
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