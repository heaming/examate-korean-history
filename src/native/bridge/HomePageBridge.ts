import ServiceManager from "@/src/service/ServiceManager";
import {BaseNativeBridge} from "@/src/native/BaseNativeBridge";

export class HomePageBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return [
            'GET_HOME_PAGE_DATA',
        ];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        const homePageService = await this.serviceManager.getHomePageService();

        switch (type) {
            case 'GET_HOME_PAGE_DATA':
                return  await homePageService.getHomePageData();
            default:
                throw new Error(`Unsupported message type: ${type}`);
        }
    }
}