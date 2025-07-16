import { NativeMessage } from '../../types';
import ServiceManager from '../../services/ServiceManager';

export class WrongAnswerHandler {
    private serviceManager = ServiceManager.getInstance();

    async handle(message: NativeMessage): Promise<any> {
        // WrongAnswerService 구현 후 연결
        switch (message.type) {
            case 'SAVE_WRONG_ANSWER':
                return { success: true };

            case 'GET_WRONG_ANSWERS':
                return [];

            case 'GET_WRONG_ANSWER_STATS':
                return {
                    totalWrongAnswers: 0,
                    mostWrongCategory: '',
                    averageWrongCount: 0,
                    recentWrongAnswers: 0
                };

            case 'UPDATE_WRONG_ANSWER_NOTE':
                return { success: true };

            case 'TOGGLE_WRONG_ANSWER_BOOKMARK':
                return { success: true };

            case 'REMOVE_WRONG_ANSWER':
                return { success: true };

            default:
                throw new Error(`Unknown wrong answer message type: ${message.type}`);
        }
    }
}