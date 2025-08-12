import { BaseNativeBridge } from '../BaseNativeBridge';
import ServiceManager from '../../services/ServiceManager';

export class WrongAnswerBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return [
            'SAVE_WRONG_ANSWER',
            'GET_WRONG_ANSWERS',
            'SAVE_WRONG_ANSWERS'
        ];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        const wrongAnswerService =  await this.serviceManager.getWrongAnswerService();
        switch (type) {
            case 'SAVE_WRONG_ANSWER':
                return { success: true };

            case 'SAVE_WRONG_ANSWERS':
                return await wrongAnswerService.upsertWrongAnswers(data);

            case 'GET_WRONG_ANSWERS':
                return await wrongAnswerService.getWrongAnswers(data.tags, data.limit, data.offset, data.orderType);

            default:
                throw new Error(`Unknown wrong answer message type: ${type}`);
        }
    }
}