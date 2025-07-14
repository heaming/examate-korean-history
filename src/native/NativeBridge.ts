import { BookmarkService } from '../services/BookmarkService';
import { StudyStatsService } from '../services/StudyStatsService';
import { NativeMessage } from '../types';

export class NativeBridge {
  private bookmarkService: BookmarkService;
  private studyStatsService: StudyStatsService;

  constructor() {
    this.bookmarkService = new BookmarkService();
    this.studyStatsService = new StudyStatsService();
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      await this.studyStatsService.initialize();
      console.log('StudyStatsService initialized');
    } catch (error) {
      console.error('Failed to initialize StudyStatsService:', error);
    }
  }

  async handleMessage(message: NativeMessage): Promise<any> {
    try {
      console.log('Handling message:', message.type, message.data);
      
      switch (message.type) {
        // 북마크 관련
        case 'SAVE_BOOKMARK':
          return await this.bookmarkService.addBookmark(message.data);
        
        case 'REMOVE_BOOKMARK':
          return await this.bookmarkService.removeBookmark(message.data.id);
        
        case 'GET_BOOKMARKS':
          console.log('북마크 조회 요청 받음');
          const bookmarks = await this.bookmarkService.getAllBookmarks();
          console.log('북마크 조회 완료:', bookmarks.length, '개');
          return bookmarks;
        
        // 학습 통계 관련
        case 'GET_STUDY_STATS':
          return await this.handleGetStudyStats();
        
        case 'UPDATE_STUDY_STATS':
          return await this.handleUpdateStudyStats(message.data);
        
        case 'GET_TODAY_STATS':
          return await this.handleGetTodayStats();
        
        case 'GET_HOME_PAGE_DATA':
          return await this.handleGetHomePageData(message.data);
        
        // 최근 문제 관련
        case 'GET_RECENT_QUESTIONS':
          return await this.handleGetRecentQuestions();
        
        case 'SAVE_QUESTION_RESULT':
          return await this.handleSaveQuestionResult(message.data);
        
        // 오답노트 관련
        case 'SAVE_WRONG_ANSWER':
          return await this.handleSaveWrongAnswer(message.data);
        
        case 'GET_WRONG_ANSWERS':
          return await this.handleGetWrongAnswers();
        
        case 'GET_WRONG_ANSWER_STATS':
          return await this.handleGetWrongAnswerStats();
        
        case 'UPDATE_WRONG_ANSWER_NOTE':
          return await this.handleUpdateWrongAnswerNote(message.data);
        
        case 'TOGGLE_WRONG_ANSWER_BOOKMARK':
          return await this.handleToggleWrongAnswerBookmark(message.data);
        
        case 'REMOVE_WRONG_ANSWER':
          return await this.handleRemoveWrongAnswer(message.data);
        
        // 시험 결과 관련
        case 'GET_EXAM_RESULTS':
          return await this.handleGetExamResults();
        
        case 'SAVE_EXAM_RESULT':
          return await this.handleSaveExamResult(message.data);
        
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      throw error;
    }
  }

  // 북마크 관련 헬퍼 메서드들
  private async handleGetBookmarks(): Promise<any> {
    return await this.bookmarkService.getAllBookmarks();
  }

  private async handleSaveBookmark(data: any): Promise<any> {
    return await this.bookmarkService.addBookmark(data);
  }

  private async handleRemoveBookmark(data: any): Promise<any> {
    return await this.bookmarkService.removeBookmark(data.id);
  }

  // 학습 통계 관련 헬퍼 메서드들
  private async handleGetStudyStats(): Promise<any> {
    return await this.studyStatsService.getStudyStats();
  }

  private async handleUpdateStudyStats(data: any): Promise<any> {
    return await this.studyStatsService.updateStudyStats(data);
  }

  private async handleGetTodayStats(): Promise<any> {
    return await this.studyStatsService.getTodayStats();
  }

  private async handleGetHomePageData(data: any): Promise<any> {
    const totalProblems = data?.totalProblems || 1250; // 기본값 또는 전달받은 값
    return await this.studyStatsService.getHomePageData(totalProblems);
  }

  // 최근 문제 관련 헬퍼 메서드들
  private async handleGetRecentQuestions(): Promise<any> {
    return await this.studyStatsService.getRecentQuestions();
  }

  private async handleSaveQuestionResult(data: any): Promise<any> {
    await this.studyStatsService.recordQuestionResult(data);
    return { success: true };
  }

  // 오답노트 관련 헬퍼 메서드들 (추후 구현)
  private async handleSaveWrongAnswer(data: any): Promise<any> {
    // WrongAnswerService 구현 후 연결
    return { success: true };
  }

  private async handleGetWrongAnswers(): Promise<any> {
    // WrongAnswerService 구현 후 연결
    return [];
  }

  private async handleGetWrongAnswerStats(): Promise<any> {
    // WrongAnswerService 구현 후 연결
    return {
      totalWrongAnswers: 0,
      mostWrongCategory: '',
      averageWrongCount: 0,
      recentWrongAnswers: 0
    };
  }

  private async handleUpdateWrongAnswerNote(data: any): Promise<any> {
    // WrongAnswerService 구현 후 연결
    return { success: true };
  }

  private async handleToggleWrongAnswerBookmark(data: any): Promise<any> {
    // WrongAnswerService 구현 후 연결
    return { success: true };
  }

  private async handleRemoveWrongAnswer(data: any): Promise<any> {
    // WrongAnswerService 구현 후 연결
    return { success: true };
  }

  // 시험 결과 관련 헬퍼 메서드들 (추후 구현)
  private async handleGetExamResults(): Promise<any> {
    // ExamResultService 구현 후 연결
    return [];
  }

  private async handleSaveExamResult(data: any): Promise<any> {
    // ExamResultService 구현 후 연결
    return { success: true };
  }

  // 에러 응답 생성
  private createErrorResponse(error: any): any {
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }

  // 성공 응답 생성
  private createSuccessResponse(data: any): any {
    return {
      success: true,
      data
    };
  }
} 