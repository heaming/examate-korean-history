import { BaseNativeBridge } from '../BaseNativeBridge';
import ServiceManager from '../../services/ServiceManager';

export class WrongAnswerBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return [
            'SAVE_WRONG_ANSWER',
            'GET_WRONG_ANSWERS',
            'GET_WRONG_ANSWER_STATS',
            'UPDATE_WRONG_ANSWER_NOTE',
            'TOGGLE_WRONG_ANSWER_BOOKMARK',
            'REMOVE_WRONG_ANSWER'
        ];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        const wrongAnswerService =  await this.serviceManager.getWrongAnswerService();
        switch (type) {
            case 'SAVE_WRONG_ANSWER':
                return { success: true };

            case 'GET_WRONG_ANSWERS': // 오답
                return await wrongAnswerService.getWrongAnswers(data.tags, data.limit, data.offset, data.orderType);

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
                throw new Error(`Unknown wrong answer message type: ${type}`);
        }
    }
}