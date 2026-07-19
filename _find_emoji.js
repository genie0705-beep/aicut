const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin.html', 'utf-8');
const lines = html.split('\n');

const targets = [
  '위치 현황',
  '다가오는 관리비',
  '오늘의 업무',
  '다가오는 추모일',
  '위치(구좌) 관리',
  '예약 현황',
  '계약 관리',
  '추가안장료 / 진행비',
  '관리비 주기 만료 예정',
  '신규 계약 작성',
  '관리비 관리',
  '영업자 관리',
  '수수료 정산',
  '관리비 납부 내역',
  '매출 관리',
  '납부 예정 달력',
  '월간 매출 추이',
  '계약 현황 요약',
  '연체 관리',
  '직원 목록',
  '업무지시',
  '오늘 출퇴근 현황',
  '휴가·부재 일정',
  '유족(고객) 관리',
  '최근 방문 기록',
  '유족 메모',
  '알림 템플릿 관리',
  '주제별 예시 문구',
  '발송 미리보기',
  '자동 발송 설정',
  '발송 로그',
  '발송 로그 예시',
  '사업장 설정',
  '관리비 기본 설정',
  '관리비 알림톡 발송 단계',
  '추모일 알림톡 발송 단계',
  '법정 신고 · 데이터 백업',
  '과거 데이터 가져오기'
];

targets.forEach(target => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(target)) {
      const line = lines[i].trim();
      // Extract just the h2 content
      const match = line.match(/<h2[^>]*>([^<]*)<\/h2>/);
      if (match) {
        const h2Content = match[1];
        console.log(`L${i+1}: [${h2Content}]`);
      } else {
        console.log(`L${i+1}: ${line.substring(0, 120)}`);
      }
      break;
    }
  }
});
