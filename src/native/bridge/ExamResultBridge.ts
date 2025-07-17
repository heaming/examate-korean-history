import { BaseNativeBridge } from '../BaseNativeBridge';
import ServiceManager from '../../services/ServiceManager';

export class ExamResultBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return ['GET_EXAM_RESULTS', 'SAVE_EXAM_RESULT'];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        // ExamResultService 구현 후 연결
        switch (type) {
            case 'GET_EXAM_RESULTS':
                return [];

            case 'SAVE_EXAM_RESULT':
                return { success: true };

            default:
                throw new Error(`Unknown exam result message type: ${type}`);
        }
    }
}