import { NativeMessage } from '../../types';
import ServiceManager from '../../services/ServiceManager';

export class BookmarkHandler {
    private serviceManager = ServiceManager.getInstance();

    async handle(message: NativeMessage): Promise<any> {
        const bookmarkService = await this.serviceManager.getBookmarkService();

        switch (message.type) {
            case 'SAVE_BOOKMARK':
                return await bookmarkService.addBookmark(message.data);

            case 'REMOVE_BOOKMARK':
                return await bookmarkService.removeBookmark(message.data.id);

            case 'GET_BOOKMARKS':
                console.log('북마크 조회 요청 받음');
                const bookmarks = await bookmarkService.getAllBookmarks();
                console.log('북마크 조회 완료:', bookmarks.length, '개');
                return bookmarks;

            default:
                throw new Error(`Unknown bookmark message type: ${message.type}`);
        }
    }
}