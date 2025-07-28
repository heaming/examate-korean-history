import { BaseNativeBridge } from '../BaseNativeBridge';
import ServiceManager from '../../services/ServiceManager';

export class StudyHistoryBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return [
            'GET_STUDY_HISTORIES',
            'SAVE_STUDY_HISTORIES',
            'SAVE_STUDY_HISTORY'
        ];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        const studyHistoryService = await this.serviceManager.getStudyHistoryService();
        switch (type) {
            case 'GET_STUDY_HISTORIES':
                return await studyHistoryService.getStudyHistories(data.year, data.round);

            case 'SAVE_STUDY_HISTORIES':
                return await studyHistoryService.addStudyHistories(data);

            case 'SAVE_STUDY_HISTORY':
                return;
                // return await studyHistoryService.addStudyHistory(data);

            default:
                throw new Error(`Unknown exam result message type: ${type}`);
        }
    }
}