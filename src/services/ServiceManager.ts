import { BookmarkService } from './BookmarkService';
import { HomePageService } from './HomePageService';
import { StudyStatsService } from './StudyStatsService';

class ServiceManager {
  private static instance: ServiceManager;
  
  // 서비스 인스턴스들
  private studyStatsService: StudyStatsService | null = null;
  private bookmarkService: BookmarkService | null = null;
  private homePageService: HomePageService | null = null;

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
    await this.studyStatsService.initialize();
    console.log('StudyStatsService initialized');
  }

  /**
   * BookmarkService 초기화
   */
  private async initializeBookmarkService(): Promise<void> {
    console.log('Initializing BookmarkService...');
    this.bookmarkService = new BookmarkService();
    await this.bookmarkService.initialize();
    console.log('BookmarkService initialized');
  }

  /**
   * HomePageService 초기화 (의존성 주입)
   */
  private async initializeHomePageService(): Promise<void> {
    console.log('Initializing HomePageService...');
    
    // 의존성 서비스들을 먼저 초기화
    const [studyStatsService, bookmarkService] = await Promise.all([
      this.getStudyStatsService(),
      this.getBookmarkService()
    ]);

    // 초기화된 서비스들을 주입하여 HomePageService 생성
    this.homePageService = new HomePageService(studyStatsService, bookmarkService);
    
    console.log('HomePageService initialized');
  }

  /**
   * 모든 서비스 사전 초기화 (선택적)
   */
  async preInitializeAll(): Promise<void> {
    console.log('Pre-initializing all services...');
    
    await Promise.all([
      this.getStudyStatsService(),
      this.getBookmarkService(),
      this.getHomePageService()
    ]);
    
    console.log('All services pre-initialized');
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

      if (this.studyStatsService) {
        cleanupPromises.push(this.studyStatsService.cleanup());
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
  } {
    return {
      studyStatsService: this.studyStatsService !== null,
      bookmarkService: this.bookmarkService !== null,
      homePageService: this.homePageService !== null
    };
  }
}

export default ServiceManager; 