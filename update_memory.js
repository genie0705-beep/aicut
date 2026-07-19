const fs = require('fs');
const append = `

## ✅ 블로그 최종 작성 톤 기준 (2026-07-16 확정)

### 마지막 작성 톤 (제헌절 포스팅, 2026-07-16)
- 레퍼런스: blog.naver.com/aicut/224348766674
- 방식: RULES.md 6-2-3 방식
- 스타일: 시의성 키워드 + 실제 정보 + 서비스 연계
- 구조: 공감형 도입 -> 정보 -> 행사 리스트 -> 서비스 연결 -> CTA
- 문장: 짧고 직설적, 한 문단 1-2문장
- 이미지-글: 글 -> 이미지 -> 글 -> 이미지 교차 배치

### 앞으로 모든 작성 기준
- 마지막 톤(제헌절)으로 통일
- 6-2-3 API 텍스트 입력 후 섹션별 이미지 교차 업로드
- 글-이미지-글-이미지 순서로 천천히 진행
- SEO 체크리스트 13항목 전부 적용
`;
fs.appendFileSync('C:\\Users\\paul\\.openclaw\\workspace\\MEMORY.md', append, 'utf8');
console.log('✅ MEMORY.md 업데이트 완료');
