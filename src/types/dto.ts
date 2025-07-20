import {Bookmark, StudyHistory} from './database';

// 홈페이지 response dto
export interface HomePageData {
  // 학습 진도
  totalSolved: number;
  totalCorrect: number;
  studyStreak: number;
  accuracy: number;

  // 최근 문제
  recentQuestions: StudyHistory[];
  
  // 오늘의 학습
  todaySolved: number;
  todayCorrect: number;
  todayBookmarks: number;
}

// 북마크 페이지 response dto
export interface BookmarkData {
  bookmarks: Bookmark[];
  totalCount: number;
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


export interface WrongAnswerStats {
  totalWrongAnswers: number;
  mostWrongCategory: string;
  averageWrongCount: number;
  recentWrongAnswers: number; // 최근 7일
}