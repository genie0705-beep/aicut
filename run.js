// 에이컷(AICUT) 브랜드 성장 자동화 시스템
// ============================================
// 사용법: node run.js [작업명]
//   전체 실행: node run.js all
//   선택 실행: node run.js blog kin insta threads

const CONFIG = {
  brand: 'AICUT',
  site: 'https://aicut.co.kr',
  naver_blog: 'aicut',
  insta_id: 'aicut.official',
  
  // 댓글 설정
  max_comments_per_run: 8,
  comment_delay_min: 8000,
  comment_delay_max: 15000,
  
  // 지식iN 설정
  max_kin_answers: 3,
  
  // 이미지 설정
  image_size: '700x700',
  image_format: 'png',
  
  // 광고
  ad_bid_default: 2500,
  ad_budget_daily: 30000,
};

// 사용 가능한 작업 목록
const TASKS = {
  blog:    { name: '블로그 초안 작성', file: './skills/blog_draft.js' },
  image:   { name: '이미지 생성',    file: './skills/image_gen.js' },
  kin:     { name: '지식iN 답변',    file: './skills/kin_answer.js' },
  insta:   { name: '인스타 댓글',    file: './skills/insta_comment.js' },
  threads: { name: 'Threads 포스팅', file: './skills/threads_post.js' },
  report:  { name: '성과 리포트',    file: './skills/report.js' },
};

async function run() {
  const args = process.argv.slice(2);
  const tasks = args.includes('all') ? Object.keys(TASKS) : args;
  
  if (tasks.length === 0) {
    console.log('사용법: node run.js all');
    console.log('        node run.js blog image kin');
    console.log('        node run.js insta threads');
    console.log('\n가능한 작업:', Object.keys(TASKS).join(', '));
    return;
  }
  
  console.log('🚀 에이컷 자동화 시작 (' + new Date().toLocaleString('ko-KR') + ')');
  console.log('='.repeat(50));
  
  for (const task of tasks) {
    if (!TASKS[task]) {
      console.log('⚠️ 알 수 없는 작업:', task);
      continue;
    }
    console.log('\n▶ ' + TASKS[task].name + ' 시작...');
    try {
      await require(TASKS[task].file)(CONFIG);
      console.log('✅ ' + TASKS[task].name + ' 완료');
    } catch(e) {
      console.log('❌ ' + TASKS[task].name + ' 실패:', e.message.split('\n')[0]);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 에이컷 자동화 종료');
}

run().catch(e => console.log('FATAL:', e.message));
