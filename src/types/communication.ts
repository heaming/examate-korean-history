// 웹뷰 통신 및 네이티브 브릿지 관련 타입들

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

// 메시지 응답 타입
export interface NativeMessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 각 메시지 타입별 페이로드 타입들
export interface SaveBookmarkPayload {
  questionId: string;
  title: string;
  category: string;
  year: number;
  round: number;
  number: number;
  answer?: string;
  note?: string;
  tags: string[];
}

export interface SaveQuestionResultPayload {
  questionId: string;
  isCorrect: boolean;
  userAnswer: number;
  correctAnswer: number;
  studyTime?: number;
}

export interface SaveWrongAnswerPayload {
  questionId: string;
  userAnswer: number;
  correctAnswer: number;
  note?: string;
}

export interface UpdateWrongAnswerNotePayload {
  questionId: string;
  note: string;
} 