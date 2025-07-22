import { BaseNativeBridge } from '../BaseNativeBridge';
import ServiceManager from '../../services/ServiceManager';

export class BookmarkBridge extends BaseNativeBridge {
    private serviceManager = ServiceManager.getInstance();

    getSupportedMessageTypes(): string[] {
        return [
            'GET_BOOKMARK_DATA',
            'GET_BOOKMARKS',
            'SAVE_BOOKMARK',
            'REMOVE_BOOKMARK',
            'GET_BOOKMARKS_BY_YEAR_ROUND',
        ];
    }

    async handleMessage(type: string, data?: any): Promise<any> {
        const bookmarkService = await this.serviceManager.getBookmarkService();

        switch (type) {
            case 'GET_BOOKMARK_DATA':
                return await bookmarkService.getBookmarkData();

            case 'SAVE_BOOKMARK':
                return await bookmarkService.addBookmark(data);

            case 'REMOVE_BOOKMARK':
                return await bookmarkService.removeBookmark(data.id);

            case 'GET_BOOKMARKS':
                const bookmarks = await bookmarkService.getBookmarks(data.limit, data.offset);
                return bookmarks;

            case 'UPDATE_BOOKMARK':
                return await bookmarkService.updateBookmark(data.id, data.bookmark);

            case 'GET_BOOKMARKS_BY_YEAR_ROUND':
                return await bookmarkService.getBookmarksByYearRound(data.year, data.round);

            default:
                throw new Error(`Unknown bookmark message type: ${type}`);
        }
    }
}