import { BaseNativeBridge } from '../BaseNativeBridge';
import ServiceManager from '../../services/ServiceManager';

export class WrongAnswerBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return [
            'GET_WRONG_ANSWERS',
            'SAVE_WRONG_ANSWERS',
            'REMOVE_WRONG_ANSWER'
        ];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        const wrongAnswerService =  await this.serviceManager.getWrongAnswerService();
        switch (type) {
            case 'GET_WRONG_ANSWERS':
                return await wrongAnswerService.getWrongAnswers(data.tags, data.limit, data.offset, data.orderType);

            case 'SAVE_WRONG_ANSWERS':
                return await wrongAnswerService.upsertWrongAnswers(data);


            default:
                throw new Error(`Unknown wrong answer message type: ${type}`);
        }
    }
}