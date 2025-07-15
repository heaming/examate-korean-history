import { StudyHistoryRepository } from '../repositories/StudyHistoryRepository';
import { StudyStatsRepository } from '../repositories/StudyStatsRepository';
import { HomePageData, StudyStats, TodayStats } from '../types';

export class StudyStatsService {
  private studyStatsRepository: StudyStatsRepository;
  private studyHistoryRepository: StudyHistoryRepository;

  constructor() {
    this.studyStatsRepository = new StudyStatsRepository();
    this.studyHistoryRepository = new StudyHistoryRepository();
  }

  async initialize(): Promise<void> {
    await this.studyStatsRepository.initializeTable();
    await this.studyHistoryRepository.initializeTable();
  }

  async getStudyStats(): Promise<StudyStats> {
    const stats = await this.studyStatsRepository.getStats();
    
    if (!stats) {
      // 기본 통계 생성
      const defaultStats: Omit<StudyStats, 'id'> = {
        studyStreak: number;
        lastStudyDate: string | undefined;
        totalStudyTime: number;
        createAt: string;
        updatedAt: string | undefined;
      };
      
      const created = await this.studyStatsRepository.create(defaultStats);
      return created;
    }
    
    return stats;
  }

  async getTodayStats(): Promise<TodayStats> {
    const todayStats = await this.studyHistoryRepository.getTodayStats();
    
    return {
      solvedToday: todayStats.solvedToday,
      correctToday: todayStats.correctToday,
      studyTimeToday: todayStats.studyTimeToday,
      bookmarksToday: 0 // 북마크는 별도 서비스에서 관리
    };
  }

  async updateStudyStats(data: Partial<StudyStats>): Promise<StudyStats> {
    await this.studyStatsRepository.updateStats(data);
    return await this.getStudyStats();
  }

  async recordQuestionResult(questionResult: {
    questionId: string;
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
    studyTime: number; // 초 단위
  }): Promise<void> {
    // 최근 문제에 추가
    await this.studyHistoryRepository.addQuestion({
      questionId: questionResult.questionId,
      solvedAt: new Date().toISOString(),
      isCorrect: questionResult.isCorrect,
      studyTime: questionResult.studyTime,
      userAnswer: questionResult.userAnswer,
      correctAnswer: questionResult.correctAnswer
    });

    // 전체 통계 업데이트
    await this.studyStatsRepository.incrementSolvedCount(questionResult.isCorrect);
    
    // 학습 시간 추가 (초를 분으로 변환)
    const studyTimeInMinutes = Math.round(questionResult.studyTime / 60);
    await this.studyStatsRepository.addStudyTime(studyTimeInMinutes);
    
    // 연속 학습일 업데이트
    await this.updateStudyStreak();
  }

  async updateStudyStreak(): Promise<void> {
    const streak = await this.studyHistoryRepository.getStudyStreak();
    await this.studyStatsRepository.updateStudyStreak(streak);
  }

  async getHomePageData(totalProblems: number): Promise<HomePageData> {
    const studyStats = await this.getStudyStats();
    const todayStats = await this.getTodayStats();
    const recentQuestions = await this.studyHistoryRepository.getRecentQuestions(5);
    
    // 정답률 계산
    const accuracy = studyStats.totalSolved > 0 
      ? Math.round((studyStats.totalCorrect / studyStats.totalSolved) * 100)
      : 0;
    
    // 전체 진행률 계산
    const progressPercentage = totalProblems > 0 
      ? Math.round((studyStats.totalSolved / totalProblems) * 100)
      : 0;
    
    // 오늘의 정답률 계산
    const todayAccuracy = todayStats.solvedToday > 0 
      ? Math.round((todayStats.correctToday / todayStats.solvedToday) * 100)
      : 0;

    return {
      // 학습 진도
      totalProblems,
      solvedProblems: studyStats.totalSolved,
      correctAnswers: studyStats.totalCorrect,
      studyStreak: studyStats.studyStreak,
      accuracy,
      progressPercentage,
      
      // 오늘의 학습
      todaySolved: todayStats.solvedToday,
      todayCorrect: todayStats.correctToday,
      todayStudyTime: todayStats.studyTimeToday,
      todayBookmarks: todayStats.bookmarksToday,
      todayAccuracy,
      
      // 최근 문제
      recentQuestions,
      
      // 북마크 (별도 서비스에서 관리)
      bookmarks: []
    };
  }

  async getRecentQuestions(limit: number = 10) {
    return await this.studyHistoryRepository.getRecentQuestions(limit);
  }

  async resetStats(): Promise<void> {
    await this.studyStatsRepository.delete(1);
  }
} 