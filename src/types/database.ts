// 데이터베이스 엔티티 타입들

export interface Bookmark {
  id: number;
  questionId: string;
  year: number;
  round: number;
  questionNumber: string;
  questionText: string;
  questionImageUrl?: string;
  correctAnswer: number;
  explanation?: string;
  note?: string;
  tags?: string[];
  bookmarkedAt: string;
}

export interface WrongAnswer {
  id?: number | null;
  questionId: string;
  lastWrongAt: string;
  wrongCount: number;
  tags?: string[]
  userAnswer?: number| null;
  correctAnswer: number;
  note?: string;
  isBookmarked?: boolean | null;
  createdAt?: string | null;
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
  id?: number | null;
  year: number;
  round: number;
  questionId: string;
  solvedAt?: string;
  isCorrect?: boolean | null;
  userAnswer?: number| null;
  correctAnswer: number;
  createdAt?: string | null;
}

export type OrderType = 'RECENTLY' | 'SOLVED_AT'