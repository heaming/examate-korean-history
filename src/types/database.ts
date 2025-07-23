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
  year: number;
  round: number;
  questionId: string;
  solvedAt?: string;
  isCorrect?: boolean | null;
  userAnswer?: number;
  correctAnswer: number;
  createdAt: string;
}