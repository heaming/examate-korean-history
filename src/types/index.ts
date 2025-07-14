export interface BookmarkData {
  id: string;
  questionId: string;
  title: string;
  category: string;
  year: number;
  round: number;
  number: number;
  answer?: string;
  note?: string;
  tags: string[];
  bookmarkedAt: string; // ISO string
}

export interface WrongAnswerRecord {
  questionId: string;
  wrongCount: number;
  lastWrongAt: string; // ISO string
  note?: string;
  isBookmarked: boolean;
  userAnswer: number;
  correctAnswer: number;
}

export interface StudyStats {
  id: number;
  studyStreak: number;
  lastStudyDate: Date | null;
  totalStudyTime: number;
  createAt: Date;
  updatedAt: Date;
}

export interface TodayStats {
  solvedToday: number;
  correctToday: number;
  studyTimeToday: number; // 분 단위
  bookmarksToday: number;
}

export interface RecentQuestionData {
  id: number;
  questionId: string;
  solvedAt: string; // ISO string
  isCorrect: boolean;
  studyTime: number; // 초 단위
  userAnswer: number;
  correctAnswer: number;
}

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: number;
  correctAnswer: number;
  studyTime: number; // 초 단위
  solvedAt: string; // ISO string
}

export interface ExamResult {
  id: string;
  examType: string;
  year: number;
  round: number;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number; // 분 단위
  completedAt: string; // ISO string
  questionResults: QuestionResult[];
}

export interface WrongAnswerStats {
  totalWrongAnswers: number;
  mostWrongCategory: string;
  averageWrongCount: number;
  recentWrongAnswers: number; // 최근 7일
}

// 웹뷰 통신 메시지 타입
export interface NativeMessage {
  type: 
    // 북마크 관련
    | 'SAVE_BOOKMARK' 
    | 'REMOVE_BOOKMARK' 
    | 'GET_BOOKMARKS' 
    // 학습 통계 관련
    | 'GET_STUDY_STATS'
    | 'UPDATE_STUDY_STATS'
    | 'GET_TODAY_STATS'
    | 'GET_HOME_PAGE_DATA'
    // 최근 문제 관련
    | 'GET_RECENT_QUESTIONS'
    | 'SAVE_QUESTION_RESULT'
    // 오답노트 관련
    | 'SAVE_WRONG_ANSWER'
    | 'GET_WRONG_ANSWERS'
    | 'GET_WRONG_ANSWER_STATS'
    | 'UPDATE_WRONG_ANSWER_NOTE'
    | 'TOGGLE_WRONG_ANSWER_BOOKMARK'
    | 'REMOVE_WRONG_ANSWER'
    // 시험 결과 관련
    | 'GET_EXAM_RESULTS' 
    | 'SAVE_EXAM_RESULT';
  data?: any;
}

// 홈페이지 데이터 통합 타입
export interface HomePageData {
  // 학습 진도
  totalProblems: number;
  solvedProblems: number;
  correctAnswers: number;
  studyStreak: number;
  accuracy: number;
  progressPercentage: number;
  
  // 오늘의 학습
  todaySolved: number;
  todayCorrect: number;
  todayStudyTime: number;
  todayBookmarks: number;
  todayAccuracy: number;
  
  // 최근 문제
  recentQuestions: RecentQuestionData[];
  
  // 북마크
  bookmarks: BookmarkData[];
} 