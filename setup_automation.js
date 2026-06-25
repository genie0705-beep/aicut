/**
 * setup_automation.js — 에이컷 마케팅 자동화 설정
 * 
 * 사용법: node setup_automation.js
 * 
 * 하는 일:
 * 1. 에이든이 실행 가능한 자동화 명령어 정리
 * 2. 크론 작업 등록 (선택사항)
 */

const config = {
  // ============================================================
  // 📋 자동화 명령어 모음
  // ============================================================
  commands: [
    {
      cmd: 'node marketing_status.js',
      desc: '📊 마케팅 현황 원버튼 체크 (20초)',
      when: '매일 아침 or 광고 체크 필요시'
    },
    {
      cmd: 'node daily_marketing.js',
      desc: '🚀 데일리 마케팅 전체 루틴 실행',
      when: '에이든에게 "마케팅 돌려줘"'
    },
    {
      cmd: 'node daily_marketing.js check',
      desc: '📈 현황만 확인 (광고+리포트)',
      when: '빠른 체크 필요시'
    },
    {
      cmd: '에이든 블로그 작성해',
      desc: '📝 블로그 포스팅 자동 작성 → 저장까지',
      when: '블로그 포스팅 필요시'
    },
    {
      cmd: '에이든 인스타/스레드 올려줘',
      desc: '📸 SNS 게시물 업로드',
      when: '블로그 작성 후 SNS에도 공유할 때'
    },
    {
      cmd: '에이든 광고 현황 분석해줘',
      desc: '🔍 상세 광고 분석 리포트',
      when: '주 1회 광고 성과 점검'
    },
    {
      cmd: '에이든 오늘 할 일 알려줘',
      desc: '💡 오늘의 추천 마케팅 액션',
      when: '매일 아침'
    },
  ],

  // ============================================================
  // 🔄 추천 크론 작업 (정기 자동화)
  // ============================================================
  cronJobs: [
    {
      name: '아침 마케팅 알림',
      schedule: { kind: 'cron', expr: '30 8 * * 1-5', tz: 'Asia/Seoul' },
      desc: '평일 아침 8:30 → "좋은 아침입니다! 오늘 블로그 포스팅 작성하시겠어요?"'
    },
    {
      name: '주간 광고 리포트',
      schedule: { kind: 'cron', expr: '0 10 * * 1', tz: 'Asia/Seoul' },
      desc: '매주 월요일 10시 → "지난주 광고 성과 리포트입니다"'
    }
  ]
};

// 실행
console.log('=== 🤖 에이컷 자동화 설정 ===\n');

console.log('🎯 사용 가능한 명령어');
console.log('─'.repeat(40));
for (const c of config.commands) {
  console.log(`${c.cmd.padEnd(40)} ${c.desc}`);
  console.log(`   → ${c.when}`);
  console.log();
}

console.log('🔄 추천 크론 작업');
console.log('─'.repeat(40));
for (const c of config.cronJobs) {
  console.log(`📌 ${c.name}: ${c.desc}`);
}

console.log('\n💡 시작하려면:');
console.log('   "에이든, 마케팅 돌려줘" — 하루 루틴 실행');
console.log('   "에이든, 현황 체크" — 빠른 현황 확인');
console.log('   "에이든, 설정해줘" — 크론 작업 등록');
