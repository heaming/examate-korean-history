import { StudyStatsService } from './StudyStatsService';
import { BookmarkService } from './BookmarkService';
import { HomePageData } from '@/src/types';
import {StudyHistoryService} from "@/src/service/StudyHistoryService";

export class HomePageService {
    private studyStatsService: StudyStatsService;
    private studyHistoryService: StudyHistoryService;
    private bookmarkService: BookmarkService;

    constructor(
        studyStatsService: StudyStatsService,
        studyHistoryService: StudyHistoryService,
        bookmarkService: BookmarkService
    ) {
        this.studyStatsService = studyStatsService;
        this.studyHistoryService = studyHistoryService;
        this.bookmarkService = bookmarkService;
    }

    /**
     * 홈페이지 데이터 조회
     */
    async getHomePageData(): Promise<HomePageData> {
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
        console.log('HomePageService cleaned up');
    }
}