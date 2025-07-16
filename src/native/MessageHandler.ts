import { NativeMessage } from '../types';
import {BookmarkHandler} from "./handlers/BookmarkHandler";
import {StudyStatsHandler} from "./handlers/StudyStatsHandler";
import {HomePageHandler} from "./handlers/HomePageHandler";
import {WrongAnswerHandler} from "./handlers/WrongAnswerHandler";
import {ExamResultHandler} from "./handlers/ExamResultHandler";

export class MessageHandler {
    private bookmarkHandler: BookmarkHandler;
    private studyStatsHandler: StudyStatsHandler;
    private homePageHandler: HomePageHandler;
    private wrongAnswerHandler: WrongAnswerHandler;
    private examResultHandler: ExamResultHandler;

    constructor() {
        this.bookmarkHandler = new BookmarkHandler();
        this.studyStatsHandler = new StudyStatsHandler();
        this.homePageHandler = new HomePageHandler();
        this.wrongAnswerHandler = new WrongAnswerHandler();
        this.examResultHandler = new ExamResultHandler();
    }

    async handle(message: NativeMessage): Promise<any> {
        switch (message.type) {
            // 북마크 관련
            case 'SAVE_BOOKMARK':
            case 'REMOVE_BOOKMARK':
            case 'GET_BOOKMARKS':
                return await this.bookmarkHandler.handle(message);

            // 학습 통계 관련
            case 'GET_STUDY_STATS':
            case 'UPDATE_STUDY_STATS':
            case 'GET_TODAY_STATS':
            case 'GET_RECENT_QUESTIONS':
            case 'SAVE_QUESTION_RESULT':
                return await this.studyStatsHandler.handle(message);

            // 홈페이지 데이터
            case 'GET_HOME_PAGE_DATA':
                return await this.homePageHandler.handle(message);

            // 오답노트 관련
            case 'SAVE_WRONG_ANSWER':
            case 'GET_WRONG_ANSWERS':
            case 'GET_WRONG_ANSWER_STATS':
            case 'UPDATE_WRONG_ANSWER_NOTE':
            case 'TOGGLE_WRONG_ANSWER_BOOKMARK':
            case 'REMOVE_WRONG_ANSWER':
                return await this.wrongAnswerHandler.handle(message);

            // 시험 결과 관련
            case 'GET_EXAM_RESULTS':
            case 'SAVE_EXAM_RESULT':
                return await this.examResultHandler.handle(message);

            default:
                throw new Error(`Unknown message type: ${message.type}`);
        }
    }
}