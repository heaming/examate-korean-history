import { NativeMessage } from '../../types';
import ServiceManager from '../../services/ServiceManager';

export class HomePageHandler {
    private serviceManager = ServiceManager.getInstance();

    async handle(message: NativeMessage): Promise<any> {
        if (message.type === 'GET_HOME_PAGE_DATA') {
            const homePageService = await this.serviceManager.getHomePageService();
            return await homePageService.getHomePageData();
        }

        throw new Error(`Unknown home page message type: ${message.type}`);
    }
}