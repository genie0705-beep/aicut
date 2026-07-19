const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 블로그 게시글별 통계 수집 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. admin 블로그 post list 페이지 접속
  console.log('1. 블로그 관리자 - 게시글 목록 접속...');
  await page.goto('https://admin.blog.naver.com/aicut/manage/post', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  let text = await page.evaluate(() => document.body.innerText);
  console.log('   [manage/post]');
  text.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  // 다양한 admin URL 시도
  const urls = [
    'https://admin.blog.naver.com/aicut/post/list',
    'https://admin.blog.naver.com/aicut/manage/content',
    'https://admin.blog.naver.com/aicut/contents',
    'https://admin.blog.naver.com/aicut/manage',
  ];

  for (const url of urls) {
    console.log(`\n   시도: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await sleep(3000);
    
    text = await page.evaluate(() => document.body.innerText);
    const hasPosts = text.includes('조회') || text.includes('글') || text.includes('포스트') || text.includes('게시글');
    const hasError = text.includes('페이지 주소') || text.includes('유효하지 않은');
    
    if (!hasError && hasPosts) {
      console.log('   ✅ 게시글 목록 발견!');
      text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));
      break;
    } else if (!hasError) {
      console.log('   접속됨, 미리보기:', text.replace(/\n/g, ' | ').substring(0, 150));
    } else {
      console.log('   ❌ 접근 불가');
    }
  }

  // 2. 블로그 메인 PostList에서 "통계" 링크가 있는 게시글 수집
  console.log('\n\n2. 블로그 PostList - 통계 링크 수집...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await sleep(4000);

  const postFrame = page.frames().find(f => f.url().includes('PostList'));
  if (postFrame) {
    // 모든 게시글 제목 + 통계 링크 수집
    const posts = await postFrame.evaluate(() => {
      const items = [];
      const links = document.querySelectorAll('a, span, strong, div');
      let currentTitle = '';
      let currentDate = '';
      
      for (const el of links) {
        const t = el.textContent.trim();
        
        // 제목 찾기 (strong 태그 또는 title 클래스)
        if (el.tagName === 'STRONG' || el.className.includes('title') || el.className.includes('subject')) {
          if (t.length > 5 && t.length < 100 && !t.includes('NAVER') && !t.includes('블로그')) {
            currentTitle = t;
          }
        }
        
        // 날짜 찾기
        if (t.includes('2026') && (t.includes('.') || t.includes(':') || t.includes('시간'))) {
          currentDate = t;
        }
        
        // 통계 링크 발견
        if (t === '통계') {
          items.push({
            title: currentTitle,
            date: currentDate,
            statLink: el.href || 'N/A'
          });
        }
      }
      return items.slice(0, 50);
    });

    console.log(`   총 게시글: ${posts.length}개`);
    posts.forEach((p, i) => console.log(`    ${i+1}. [${p.date}] ${p.title.substring(0, 60)}`));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
