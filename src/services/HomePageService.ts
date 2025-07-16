import { StudyStatsService } from './StudyStatsService';
import { BookmarkService } from './BookmarkService';
import { HomePageData } from '../types/service';

export class HomePageService {
    private studyStatsService: StudyStatsService;
    private bookmarkService: BookmarkService;
    private isInitialized: boolean = false;

    constructor(
        studyStatsService: StudyStatsService,
        bookmarkService: BookmarkService
    ) {
        this.studyStatsService = studyStatsService;
        this.bookmarkService = bookmarkService;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        if (!this.studyStatsService || !this.bookmarkService) {
            throw new Error('HomePageService dependencies not properly injected');
        }

        console.log('HomePageService initialized with injected dependencies');
        this.isInitialized = true;
    }

    getStudyStatsService(): StudyStatsService {
        return this.studyStatsService;
    }

    getBookmarkService(): BookmarkService {
        return this.bookmarkService;
    }

    /**
     * 홈페이지 데이터 조회
     */
    async getHomePageData(): Promise<HomePageData> {
        if (!this.isInitialized) {
            throw new Error('HomePageService not initialized');
        }

        /**
         * export interface HomePageData {
         *   // 학습 진도
         *   solvedCount: number;
         *   correctCount: number;
         *   studyStreak: number;
         *   accuracy: number;
         *
         *   // 최근 문제
         *   recentQuestions: StudyHistory[];
         *
         *   // 오늘의 학습
         *   todaySolved: number;
         *   todayCorrect: number;
         *   todayStudyTime: number;
         *   todayBookmarks: number;
         * }
         */

        try {
            // 각 서비스에서 필요한 데이터 조회
            const [
                studyStats,
                todayStats,
                recentQuestions,
                todayBookmarks
            ] = await Promise.all([
                this.studyStatsService.getStudyStats(),
                this.studyStatsService.getTodayStats(),
                this.studyStatsService.getRecentQuestions(3),
                this.bookmarkService.getTodayBookmarks()
            ]);

            return {
                // 학습 진도
                solvedCount: studyStats.totalSolsved,
                correctCount: studyStats.totalCorrect,
                studyStreak: studyStats.studyStreak,
                accuracy,
                progressPercentage,

                // 오늘의 학습
                todaySolved: todayStats.solvedToday,
                todayCorrect: todayStats.correctToday,
                todayStudyTime: todayStats.studyTimeToday,
                todayBookmarks: todayBookmarks.length,
                todayAccuracy,
                recentQuestions
            };
        } catch (error) {
            console.error('Error getting home page data:', error);
            throw error;
        }
    }

    /**
     * 정리 메서드 (필요시)
     */
    async cleanup(): Promise<void> {
        this.isInitialized = false;
        console.log('HomePageService cleaned up');
    }
}