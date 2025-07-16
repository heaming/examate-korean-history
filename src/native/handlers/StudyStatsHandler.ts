import { NativeMessage } from '../../types';
import ServiceManager from '../../services/ServiceManager';

export class StudyStatsHandler {
    private serviceManager = ServiceManager.getInstance();

    async handle(message: NativeMessage): Promise<any> {
        const studyStatsService = await this.serviceManager.getStudyStatsService();

        switch (message.type) {
            case 'GET_STUDY_STATS':
                return await studyStatsService.getStudyStats();

            case 'UPDATE_STUDY_STATS':
                return await studyStatsService.updateStudyStats(message.data);

            case 'GET_TODAY_STATS':
                return await studyStatsService.getTodayStats();

            case 'GET_RECENT_QUESTIONS':
                return await studyStatsService.getRecentQuestions();

            case 'SAVE_QUESTION_RESULT':
                await studyStatsService.recordQuestionResult(message.data);
                return { success: true };

            default:
                throw new Error(`Unknown study stats message type: ${message.type}`);
        }
    }
}