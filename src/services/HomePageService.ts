import { StudyStatsService } from './StudyStatsService';
import { BookmarkService } from './BookmarkService';
import { HomePageData } from '../types/dto';
import {StudyHistoryService} from "@/src/services/StudyHistoryService";

export class HomePageService {
    private studyStatsService: StudyStatsService;
    private studyHistoryService: StudyHistoryService;
    private bookmarkService: BookmarkService;
    private isInitialized: boolean = false;

    constructor(
        studyStatsService: StudyStatsService,
        studyHistoryService: StudyHistoryService,
        bookmarkService: BookmarkService
    ) {
        this.studyStatsService = studyStatsService;
        this.studyHistoryService = studyHistoryService;
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

    /**
     * 홈페이지 데이터 조회
     */
    async getHomePageData(): Promise<HomePageData> {
        if (!this.isInitialized) {
            throw new Error('HomePageService not initialized');
        }

        try {
            const [
                studyHistoryTotalCount,
                studyHistoryTodayCount,
                studyStats,
                recentQuestions,
                todayBookmarks
            ] = await Promise.all([
                this.studyHistoryService.getStudyHistoryTotalCount(),
                this.studyHistoryService.getStudyHistoryCountByDate(),
                this.studyStatsService.getStudyStats(),
                this.studyHistoryService.getRecentQuestions(3),
                this.bookmarkService.getBookmarkTodayCount()
            ]);

            return {
                // 학습 진도
                totalSolved: studyHistoryTotalCount.solvedCount,
                totalCorrect: studyHistoryTotalCount.correctCount,
                accuracy: studyHistoryTotalCount.accuracy,
                studyStreak: studyStats.studyStreak,

                // 최근 푼 문제
                recentQuestions,

                // 오늘의 학습
                todaySolved: studyHistoryTodayCount.solvedCount,
                todayCorrect: studyHistoryTodayCount.correctCount,
                todayBookmarks
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