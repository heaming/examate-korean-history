// 서비스 레이어 DTO 및 응답 타입들

import { BookmarkData, StudyHistory } from './database';

export interface TodayStats {
  solvedToday: number;
  correctToday: number;
  studyTimeToday: number; // 분 단위
  bookmarksToday: number;
}

export interface WrongAnswerStats {
  totalWrongAnswers: number;
  mostWrongCategory: string;
  averageWrongCount: number;
  recentWrongAnswers: number; // 최근 7일
}

// 홈페이지 데이터 통합 타입
export interface HomePageData {
  // 학습 진도
  solvedCount: number;
  correctCount: number;
  studyStreak: number;
  accuracy: number;

  // 최근 문제
  recentQuestions: StudyHistory[];
  
  // 오늘의 학습
  todaySolved: number;
  todayCorrect: number;
  todayStudyTime: number;
  todayBookmarks: number;
}

// 주간 학습 통계
export interface WeeklyStats {
  weeklyStudyTime: number;
  weeklySolved: number;
  weeklyCorrect: number;
  weeklyAccuracy: number;
}

// 월간 학습 통계
export interface MonthlyStats {
  monthlyStudyTime: number;
  monthlySolved: number;
  monthlyCorrect: number;
  monthlyAccuracy: number;
} 