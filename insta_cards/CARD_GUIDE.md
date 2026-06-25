# 인스타그램 카드뉴스 제작 가이드

## 포맷 기준 (확정)

### 크기
- 1080 x 1080px (인스타 정방형)

### 레이아웃
- 텍스트 중앙 정렬
- 핵심 메시지 **2줄 이내**로 압축
- 폰트: Apple SD Gothic Neo / Noto Sans KR / Malgun Gothic

### 구조 (위→아래)
1. **태그** (상단 고정, 40px, 카테고리/주제)
2. **메인 텍스트** (중앙, 148~160px, 핵심 단어만)
3. **서브 텍스트** (하단 고정, 44px, 한 줄 요약)
4. **브랜드** (우측 하단, AICUT)

### 컬러 테마 교대 적용
- 다크: #0D1630 배경 + 퍼플(#a78bfa) / 시안(#06b6d4) / 골드(#F4B942) 포인트
- 라이트: #FDFAF2 배경 + 퍼플(#8b5cf6) 포인트

### 배경 글로우
- 중앙 radial-gradient 글로우 (포인트 컬러 35~45% opacity)

### 핵심 원칙
- 썸네일(300x300)에서도 읽혀야 함
- 텍스트 최소화 — 핵심 단어 2~3개만
- 메인 폰트 최소 148px
- 여백 충분히 (padding 90~100px)

## 디자인 파일
- HTML 소스: `insta_cards/card1~5.html`
- PNG 출력: `insta_cards/card1~5_*.png`
- 생성 스크립트: `insta_cards/generate_cards.js`

## 새 카드 제작 순서
1. 주제/테마 결정
2. 카드 HTML 작성 (위 포맷 기준)
3. `node generate_cards.js` 실행
4. 정이사님 확인 후 `insta_post.js`로 업로드
