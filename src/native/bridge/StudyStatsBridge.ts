import { BaseNativeBridge } from '../BaseNativeBridge';
import ServiceManager from '@/src/service/ServiceManager';

export class StudyStatsBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return [
            'GET_STUDY_STATS',
            'UPDATE_STUDY_STATS',
            // 'GET_TODAY_STATS',
            // 'GET_RECENT_QUESTIONS',
            // 'SAVE_QUESTION_RESULT'
        ];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        const studyStatsService = await this.serviceManager.getStudyStatsService();

        switch (type) {
            case 'GET_STUDY_STATS':
                return await studyStatsService.getStudyStats();

            case 'UPDATE_STUDY_STATS':
                return await studyStatsService.updateStudyStats(data);

            // case 'GET_TODAY_STATS':
            //     return await studyStatsService.getTodayStats();
            //
            // case 'GET_RECENT_QUESTIONS':
            //     return await studyStatsService.getRecentQuestions();
            //
            // case 'SAVE_QUESTION_RESULT':
            //     await studyStatsService.recordQuestionResult(data);
            //     return { success: true };

            default:
                throw new Error(`Unknown study stats message type: ${type}`);
        }
    }
}