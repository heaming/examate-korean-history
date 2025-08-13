import { BookmarkService } from './BookmarkService';
import { HomePageService } from './HomePageService';
import { StudyStatsService } from './StudyStatsService';
import {StudyHistoryService} from "@/src/service/StudyHistoryService";
import {WrongAnswerService} from "@/src/service/WrongAnswerService";

export class ServiceManager {
  private static instance: ServiceManager;
  
  // 서비스 인스턴스들
  private studyStatsService: StudyStatsService | null = null;
  private studyHistoryService: StudyHistoryService | null = null;
  private bookmarkService: BookmarkService | null = null;
  private homePageService: HomePageService | null = null;
  private wrongAnswerService: WrongAnswerService | null = null;

  // 초기화 상태 추적
  private initializationPromises: Map<string, Promise<any>> = new Map();
  
  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * StudyStatsService 인스턴스 반환 (지연 초기화)
   */
  async getStudyStatsService(): Promise<StudyStatsService> {
    if (this.studyStatsService) {
      return this.studyStatsService;
    }

    // 동시에 여러 곳에서 호출될 경우 중복 초기화 방지
    const initKey = 'studyStatsService';
    if (this.initializationPromises.has(initKey)) {
      await this.initializationPromises.get(initKey);
      return this.studyStatsService!;
    }

    const initPromise = this.initializeStudyStatsService();
    this.initializationPromises.set(initKey, initPromise);
    
    try {
      await initPromise;
      return this.studyStatsService!;
    } finally {
      this.initializationPromises.delete(initKey);
    }
  }

  /**
   * StudyHistoryService 인스턴스 반환 (지연 초기화)
   */
  async getStudyHistoryService(): Promise<StudyHistoryService> {
    if (this.studyHistoryService) {
      return this.studyHistoryService;
    }

    const initKey = 'studyHistoryService';
    if (this.initializationPromises.has(initKey)) {
      await this.initializationPromises.get(initKey);
      return this.studyHistoryService!;
    }

    const initPromise = this.initializeStudyHistoryService();
    this.initializationPromises.set(initKey, initPromise);

    try {
      await initPromise;
      return this.studyHistoryService!;
    } finally {
      this.initializationPromises.delete(initKey);
    }
  }

  /**
   * BookmarkService 인스턴스 반환 (지연 초기화)
   */
  async getBookmarkService(): Promise<BookmarkService> {
    if (this.bookmarkService) {
      return this.bookmarkService;
    }

    const initKey = 'bookmarkService';
    if (this.initializationPromises.has(initKey)) {
      await this.initializationPromises.get(initKey);
      return this.bookmarkService!;
    }

    const initPromise = this.initializeBookmarkService();
    this.initializationPromises.set(initKey, initPromise);
    
    try {
      await initPromise;
      return this.bookmarkService!;
    } finally {
      this.initializationPromises.delete(initKey);
    }
  }

  /**
   * WrongAnswerService 인스턴스 반환 (지연 초기화)
   */
  async getWrongAnswerService(): Promise<WrongAnswerService> {
    if (this.wrongAnswerService) {
      return this.wrongAnswerService;
    }

    const initKey = 'wrongAnswerService';
    if (this.initializationPromises.has(initKey)) {
      await this.initializationPromises.get(initKey);
      return this.wrongAnswerService!;
    }

    const initPromise = this.initializeWrongAnswerService();
    this.initializationPromises.set(initKey, initPromise);

    try {
      await initPromise;
      return this.wrongAnswerService!;
    } finally {
      this.initializationPromises.delete(initKey);
    }
  }

  /**
   * HomePageService 인스턴스 반환 (지연 초기화)
   */
  async getHomePageService(): Promise<HomePageService> {
    if (this.homePageService) {
      return this.homePageService;
    }

    const initKey = 'homePageService';
    if (this.initializationPromises.has(initKey)) {
      await this.initializationPromises.get(initKey);
      return this.homePageService!;
    }

    const initPromise = this.initializeHomePageService();
    this.initializationPromises.set(initKey, initPromise);
    
    try {
      await initPromise;
      return this.homePageService!;
    } finally {
      this.initializationPromises.delete(initKey);
    }
  }


  /**
   * StudyStatsService 초기화
   */
  private async initializeStudyStatsService(): Promise<void> {
    console.log('Initializing StudyStatsService...');
    this.studyStatsService = new StudyStatsService();
    console.log('StudyStatsService initialized');
  }


  /**
   * StudyStatsService 초기화
   */
  private async initializeStudyHistoryService(): Promise<void> {
    console.log('Initializing StudyHistoryService...');
    this.studyHistoryService = new StudyHistoryService();
    console.log('StudyHistoryService initialized');
  }

  /**
   * BookmarkService 초기화
   */
  private async initializeBookmarkService(): Promise<void> {
    console.log('Initializing BookmarkService...');
    this.bookmarkService = new BookmarkService();
    console.log('BookmarkService initialized');
  }

  /**
   * WrongAnswerService 초기화
   */
  private async initializeWrongAnswerService(): Promise<void> {
    console.log('Initializing WrongAnswerService...');
    this.wrongAnswerService = new WrongAnswerService();
    console.log('WrongAnswerService initialized');
  }

  /**
   * HomePageService 초기화 (의존성 주입)
   */
  private async initializeHomePageService(): Promise<void> {
    console.log('Initializing HomePageService...');
    
    // 의존성 서비스들을 먼저 초기화
    const [studyStatsService, studyHistoryService, bookmarkService] = await Promise.all([
      this.getStudyStatsService(),
      this.getStudyHistoryService(),
      this.getBookmarkService()
    ]);

    this.homePageService = new HomePageService(studyStatsService, studyHistoryService, bookmarkService);
    console.log('HomePageService initialized');
  }

  /**
   * 서비스 사전 초기화
   */
  async preInitializeAll(): Promise<void> {
    console.log('Pre-initializing all services...');
    try {
      await Promise.all([
        this.getStudyStatsService(),
        this.getStudyHistoryService(),
        this.getBookmarkService(),
        this.getWrongAnswerService(),
        this.getHomePageService(),
      ]);
      console.log('All services pre-initialized');
    } catch (e) {
      console.error('preInitializeAll failed:', e);
    }
  }
  /**
   * 모든 서비스 정리 (앱 종료 시)
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up services...');

    try {
      // 의존성 역순으로 정리 (HomePageService -> 개별 서비스들)
      const cleanupPromises: Promise<void>[] = [];

      if (this.homePageService) {
        cleanupPromises.push(this.homePageService.cleanup());
      }

      if (this.wrongAnswerService) {
        cleanupPromises.push(this.wrongAnswerService.cleanup());
      }

      if (this.studyStatsService) {
        cleanupPromises.push(this.studyStatsService.cleanup());
      }

      if (this.studyHistoryService) {
        cleanupPromises.push(this.studyHistoryService.cleanup());
      }

      if (this.bookmarkService) {
        cleanupPromises.push(this.bookmarkService.cleanup());
      }

      // 모든 cleanup을 병렬로 실행
      await Promise.all(cleanupPromises);

    } catch (error) {
      console.error('Error during services cleanup:', error);
    } finally {
      // 인스턴스 초기화
      this.studyStatsService = null;
      this.studyHistoryService = null;
      this.bookmarkService = null;
      this.homePageService = null;
      this.initializationPromises.clear();

      console.log('Services cleaned up');
    }
  }

  /**
   * 서비스 상태 확인 (디버깅용)
   */
  getServiceStatus(): {
    studyStatsService: boolean;
    bookmarkService: boolean;
    homePageService: boolean;
    studyHistoryService: boolean;
  } {
    return {
      studyStatsService: this.studyStatsService !== null,
      bookmarkService: this.bookmarkService !== null,
      homePageService: this.homePageService !== null,
      studyHistoryService: this.studyHistoryService !== null
    };
  }
}