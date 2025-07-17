import ServiceManager from "@/src/services/ServiceManager";
import {BaseNativeBridge} from "@/src/native/BaseNativeBridge";

export class HomePageBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return [
            'GET_HOME_PAGE_DATA',
        ];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        switch (type) {
            case 'GET_HOME_PAGE_DATA':
                return await this.getHomePageData();
            default:
                throw new Error(`Unsupported message type: ${type}`);
        }
    }

    private async getHomePageData() {
        const homePageService = await this.serviceManager.getHomePageService();
        return await homePageService.getHomePageData();
    }
}