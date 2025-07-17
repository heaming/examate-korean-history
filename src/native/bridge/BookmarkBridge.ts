import { BaseNativeBridge } from '../BaseNativeBridge';
import ServiceManager from '../../services/ServiceManager';

export class BookmarkBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return ['GET_BOOKMARKS', 'SAVE_BOOKMARK', 'REMOVE_BOOKMARK'];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        const bookmarkService = await this.serviceManager.getBookmarkService();

        switch (type) {
            case 'SAVE_BOOKMARK':
                return await bookmarkService.addBookmark(data);

            case 'REMOVE_BOOKMARK':
                return await bookmarkService.removeBookmark(data.id);

            case 'GET_BOOKMARKS':
                console.log('북마크 조회 요청 받음');
                const bookmarks = await bookmarkService.getAllBookmarks();
                console.log('북마크 조회 완료:', bookmarks.length, '개');
                return bookmarks;

            default:
                throw new Error(`Unknown bookmark message type: ${type}`);
        }
    }
}