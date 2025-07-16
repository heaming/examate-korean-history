import { NativeMessage } from '../../types';
import ServiceManager from '../../services/ServiceManager';

export class ExamResultHandler {
    private serviceManager = ServiceManager.getInstance();

    async handle(message: NativeMessage): Promise<any> {
        // ExamResultService 구현 후 연결
        switch (message.type) {
            case 'GET_EXAM_RESULTS':
                return [];

            case 'SAVE_EXAM_RESULT':
                return { success: true };

            default:
                throw new Error(`Unknown exam result message type: ${message.type}`);
        }
    }
}