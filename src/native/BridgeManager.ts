import { BaseNativeBridge } from './BaseNativeBridge';
import { HomePageBridge } from './bridge/HomePageBridge';
import { BookmarkBridge } from './bridge/BookmarkBridge';
import { StudyStatsBridge } from './bridge/StudyStatsBridge';
import { WrongAnswerBridge } from './bridge/WrongAnswerBridge';
import { ExamResultBridge } from './bridge/ExamResultBridge';

export class BridgeManager {
    private static instance: BridgeManager;
    private bridges: BaseNativeBridge[] = [];
    private messageTypeMap = new Map<string, BaseNativeBridge>();

    static getInstance(): BridgeManager {
        if (!this.instance) {
            this.instance = new BridgeManager();
            this.instance.initializeBridges();
        }
        return this.instance;
    }

    private initializeBridges() {
        this.bridges = [
            new HomePageBridge(),
            new BookmarkBridge(),
            new StudyStatsBridge(),
            new WrongAnswerBridge(),
            new ExamResultBridge()
        ];

        // 메시지 타입별 브릿지 매핑
        this.bridges.forEach(bridge => {
            bridge.getSupportedMessageTypes().forEach(type => {
                this.messageTypeMap.set(type, bridge);
            });
        });

        console.log('BridgeManager initialized with bridges:', this.messageTypeMap.size, 'message types');
    }

    setWebViewRef(webViewRef: any) {
        this.bridges.forEach(bridge => {
            bridge.setWebViewRef(webViewRef);
        });
    }

    async handleMessage(message: any): Promise<any> {
        const bridge = this.messageTypeMap.get(message.type);

        if (bridge) {
            return await bridge.processRequest(message);
        } else {
            throw new Error(`No bridge found for message type: ${message.type}`);
        }
    }

    // 지원되는 메시지 타입 목록 반환
    getSupportedMessageTypes(): string[] {
        return Array.from(this.messageTypeMap.keys());
    }
}