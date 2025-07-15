// 데이터베이스 엔티티 타입들

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
  lastStudyDate: string | undefined;
  totalStudyTime: number;
  createAt: string;
  updatedAt: string | undefined;
}

export interface StudyHistory {
  id: number;
  questionId: string;
  solvedAt: string;
  isCorrect: boolean;
  userAnswer: number;
  correctAnswer: number;
  createdAt: string;
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

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: number;
  correctAnswer: number;
  studyTime: number; // 초 단위
  solvedAt: string; // ISO string
} 