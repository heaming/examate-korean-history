# Examate Mobile App

`examate-web`을 웹뷰로 감싸서 모바일 앱으로 만든 프로젝트입니다.

## 📁 프로젝트 구조

```
src/
├── types/                    # TypeScript 타입 정의
│   └── index.ts
├── database/                 # SQLite 데이터베이스 관리
│   └── DatabaseManager.ts
├── repositories/             # 데이터 접근 레이어
│   ├── BaseRepository.ts
│   ├── BookmarkRepository.ts
│   └── WrongAnswerRepository.ts
├── services/                 # 비즈니스 로직 레이어
│   └── BookmarkService.ts
└── native/                   # 웹뷰 통신 레이어
    └── BaseNativeBridge.ts
```

## 🗄️ 데이터베이스 스키마

### 북마크 테이블 (bookmarks)
- `id`: 기본키
- `questionId`: 문제 ID
- `title`: 문제 제목
- `category`: 카테고리
- `year`: 연도
- `round`: 회차
- `number`: 문제 번호
- `answer`: 답안
- `note`: 노트
- `tags`: 태그 (JSON)
- `bookmarkedAt`: 북마크 생성일

### 오답노트 테이블 (wrong_answers)
- `questionId`: 문제 ID (기본키)
- `wrongCount`: 틀린 횟수
- `lastWrongAt`: 마지막 틀린 날짜
- `note`: 노트
- `isBookmarked`: 북마크 여부
- `userAnswer`: 사용자 답안
- `correctAnswer`: 정답

### 학습 통계 테이블 (study_stats)
- `id`: 기본키 (항상 1)
- `totalSolved`: 총 해결한 문제 수
- `totalCorrect`: 총 정답 수
- `totalStudyTime`: 총 학습 시간 (분)
- `studyStreak`: 연속 학습 일수
- `lastStudyDate`: 마지막 학습 날짜

### 최근 문제 테이블 (recent_questions)
- `id`: 기본키
- `questionId`: 문제 ID
- `solvedAt`: 해결 날짜
- `isCorrect`: 정답 여부
- `studyTime`: 학습 시간 (초)
- `userAnswer`: 사용자 답안
- `correctAnswer`: 정답

## 🔄 웹뷰 통신 메시지

### 북마크 관련
- `SAVE_BOOKMARK`: 북마크 저장
- `REMOVE_BOOKMARK`: 북마크 삭제
- `GET_BOOKMARKS`: 북마크 목록 조회

### 학습 통계 관련
- `GET_STUDY_STATS`: 학습 통계 조회
- `UPDATE_STUDY_STATS`: 학습 통계 업데이트
- `GET_TODAY_STATS`: 오늘의 학습 통계 조회

### 최근 문제 관련
- `GET_RECENT_QUESTIONS`: 최근 문제 조회
- `SAVE_QUESTION_RESULT`: 문제 결과 저장

### 오답노트 관련
- `SAVE_WRONG_ANSWER`: 오답 저장
- `GET_WRONG_ANSWERS`: 오답 목록 조회
- `GET_WRONG_ANSWER_STATS`: 오답 통계 조회
- `UPDATE_WRONG_ANSWER_NOTE`: 오답 노트 업데이트
- `TOGGLE_WRONG_ANSWER_BOOKMARK`: 오답 북마크 토글
- `REMOVE_WRONG_ANSWER`: 오답 삭제

## 🚀 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. examate-web 실행
```bash
cd ../examate-web
npm run dev
```

### 3. 모바일 앱 실행
```bash
# iOS
npm run ios

# Android
npm run android

# 웹 (개발용)
npm run web
```

## 💡 사용 예시

### 웹뷰에서 Native로 메시지 전송
```javascript
// examate-web에서 사용
window.ReactNativeWebView?.postMessage(JSON.stringify({
  type: 'SAVE_BOOKMARK',
  data: {
    questionId: 'q123',
    title: '문제 제목',
    category: '한국사',
    year: 2024,
    round: 1,
    number: 1,
    tags: ['태그1', '태그2']
  }
}));
```

### Native에서 웹뷰로 응답 전송
```javascript
// 자동으로 처리됨
{
  type: 'SAVE_BOOKMARK_RESPONSE',
  data: { /* 저장된 북마크 데이터 */ },
  requestId: 'optional-request-id'
}
```

## 🏗️ 아키텍처 패턴

### Repository Pattern
- 데이터 접근 로직을 추상화
- 테스트 용이성 향상
- 데이터 소스 변경 시 유연성 제공

### Service Pattern
- 비즈니스 로직 캡슐화
- Repository와 Controller 사이의 중간 레이어
- 복잡한 비즈니스 규칙 처리

### Bridge Pattern
- 웹뷰와 Native 간의 통신 추상화
- 메시지 타입별 라우팅
- 에러 처리 및 응답 관리

## 🔧 개발 시 주의사항

1. **데이터베이스 초기화**: 앱 시작 시 반드시 `DatabaseManager.initialize()` 호출
2. **에러 처리**: 모든 비동기 작업에 try-catch 블록 사용
3. **메시지 포맷**: 웹뷰 통신 시 JSON 포맷 준수
4. **타입 안정성**: TypeScript 타입 정의 활용
5. **성능**: 대용량 데이터 처리 시 페이지네이션 고려

## 📝 TODO

- [ ] WrongAnswerService 구현
- [ ] StudyStatsService 구현
- [ ] RecentQuestionService 구현
- [ ] ExamResultService 구현
- [ ] 데이터 마이그레이션 로직
- [ ] 오프라인 동기화
- [ ] 성능 최적화
- [ ] 단위 테스트 작성 