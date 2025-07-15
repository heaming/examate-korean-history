import dayjs from 'dayjs';
import { StudyHistoryRepository } from '../repositories/StudyHistoryRepository';
import { StudyStatsRepository } from '../repositories/StudyStatsRepository';
import { StudyHistory, StudyStats } from '../types/database';
import { HomePageData, MonthlyStats, TodayStats, WeeklyStats } from '../types/service';

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

  /**
   * 전체 학습 통계 조회
   */
  async getStudyStats(): Promise<StudyStats> {
    const stats = await this.studyStatsRepository.getStats();

    if (!stats) {
      const now = dayjs().format();
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
   * 오늘의 학습 통계 조회
   */
  async getTodayStats(): Promise<TodayStats> {
    const todayStats = await this.studyHistoryRepository.getTodayStats();
    
    return {
      solvedToday: todayStats.solvedToday,
      correctToday: todayStats.correctToday,
      studyTimeToday: todayStats.studyTimeToday, // 이미 분 단위로 변환됨
      bookmarksToday: 0 // 북마크는 별도 서비스에서 관리
    };
  }

  /**
   * 학습 통계 업데이트
   */
  async updateStudyStats(data: Partial<StudyStats>): Promise<StudyStats> {
    await this.studyStatsRepository.updateStats(data);
    return await this.getStudyStats();
  }

  /**
   * 문제 풀이 결과 기록
   */
  async recordQuestionResult(questionResult: {
    questionId: string;
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
    studyTime?: number; // 분 단위, 선택적 필드
  }): Promise<void> {
    // StudyHistory 형태로 데이터 변환
    const studyHistoryData: Omit<StudyHistory, 'id'> = {
      questionId: questionResult.questionId,
      solvedAt: dayjs().format(),
      isCorrect: questionResult.isCorrect,
      userAnswer: questionResult.userAnswer,
      correctAnswer: questionResult.correctAnswer,
      createdAt: dayjs().format()
    };

    // 학습 기록 저장
    await this.studyHistoryRepository.create(studyHistoryData);

    // 학습 시간 추가 (있는 경우에만)
    if (questionResult.studyTime) {
      await this.studyStatsRepository.addStudyTime(questionResult.studyTime);
    }
    
    // 연속 학습일 업데이트
    await this.updateStudyStreak();
  }

  /**
   * 연속 학습일 업데이트
   */
  async updateStudyStreak(): Promise<void> {
    const streak = await this.studyHistoryRepository.getStudyStreak();
    await this.studyStatsRepository.updateStudyStreak(streak);
  }

  /**
   * 홈페이지 데이터 조회
   */
  async getHomePageData(totalProblems: number): Promise<HomePageData> {
    const studyStats = await this.getStudyStats();
    const todayStats = await this.getTodayStats();
    const recentQuestions = await this.studyHistoryRepository.getRecentQuestions(5);
    
    // 전체 문제 수와 정답 수 계산
    const allHistory = await this.studyHistoryRepository.findAll();
    const totalSolved = allHistory.length;
    const totalCorrect = allHistory.filter(h => h.isCorrect).length;
    
    // 정답률 계산
    const accuracy = totalSolved > 0 
      ? Math.round((totalCorrect / totalSolved) * 100)
      : 0;
    
    // 전체 진행률 계산
    const progressPercentage = totalProblems > 0 
      ? Math.round((totalSolved / totalProblems) * 100)
      : 0;
    
    // 오늘의 정답률 계산
    const todayAccuracy = todayStats.solvedToday > 0 
      ? Math.round((todayStats.correctToday / todayStats.solvedToday) * 100)
      : 0;

    return {
      // 학습 진도
      totalProblems,
      solvedProblems: totalSolved,
      correctAnswers: totalCorrect,
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

  /**
   * 최근 문제 조회
   */
  async getRecentQuestions(limit: number = 10): Promise<StudyHistory[]> {
    return await this.studyHistoryRepository.getRecentQuestions(limit);
  }

  /**
   * 특정 날짜의 문제 조회
   */
  async getQuestionsByDate(date: string): Promise<StudyHistory[]> {
    return await this.studyHistoryRepository.getQuestionsByDate(date);
  }

  /**
   * 학습 통계 초기화
   */
  async resetStats(): Promise<void> {
    await this.studyStatsRepository.delete(1);
  }

  /**
   * 학습 기록 삭제
   */
  async deleteStudyHistory(id: number): Promise<boolean> {
    return await this.studyHistoryRepository.delete(id);
  }

  /**
   * 주간 학습 통계 조회
   */
  async getWeeklyStats(): Promise<WeeklyStats> {
    const weekAgo = dayjs().subtract(7, 'day');
    const allHistory = await this.studyHistoryRepository.findAll();
    
    const weeklyHistory = allHistory.filter(h => 
      dayjs(h.solvedAt).isAfter(weekAgo)
    );
    
    const weeklySolved = weeklyHistory.length;
    const weeklyCorrect = weeklyHistory.filter(h => h.isCorrect).length;
    const weeklyAccuracy = weeklySolved > 0 
      ? Math.round((weeklyCorrect / weeklySolved) * 100) 
      : 0;
    
    return {
      weeklyStudyTime: 0, // StudyHistory에서 studyTime 제거되어 0으로 설정
      weeklySolved,
      weeklyCorrect,
      weeklyAccuracy
    };
  }

  /**
   * 월간 학습 통계 조회
   */
  async getMonthlyStats(): Promise<MonthlyStats> {
    const monthAgo = dayjs().subtract(30, 'day');
    const allHistory = await this.studyHistoryRepository.findAll();
    
    const monthlyHistory = allHistory.filter(h => 
      dayjs(h.solvedAt).isAfter(monthAgo)
    );
    
    const monthlySolved = monthlyHistory.length;
    const monthlyCorrect = monthlyHistory.filter(h => h.isCorrect).length;
    const monthlyAccuracy = monthlySolved > 0 
      ? Math.round((monthlyCorrect / monthlySolved) * 100) 
      : 0;
    
    return {
      monthlyStudyTime: 0, // StudyHistory에서 studyTime 제거되어 0으로 설정
      monthlySolved,
      monthlyCorrect,
      monthlyAccuracy
    };
  }
} 