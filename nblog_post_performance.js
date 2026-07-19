const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 블로그 게시글별 성과 분석 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('admin.blog.naver.com')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://admin.blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await sleep(5000);
  }
  await page.bringToFront();
  await sleep(2000);

  const adminBase = 'https://admin.blog.naver.com/aicut';

  // 다양한 admin URL 시도
  const adminUrls = [
    '/post',
    '/manage',
    '/manage/post',
    '/manage/post/list',
    '/manage/content',
    '/contents',
    '/contents/post',
    '/stat/post',
    '/stat/ranking',
  ];

  for (const path of adminUrls) {
    const url = adminBase + path;
    console.log(`시도: ${path}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await sleep(2000);
    
    const loc = await page.evaluate('location.href');
    const text = await page.evaluate(() => document.body.innerText);
    const hasError = text.includes('페이지 주소') || text.includes('유효하지 않은 요청');
    
    // 특정 프레임 확인
    const frames = page.frames();
    let frameData = null;
    for (const f of frames) {
      if (f.url().includes('admin.blog.naver.com') && f.url().includes(path) && f.url() !== url) {
        const ft = await f.evaluate(() => document.body.innerText).catch(() => '');
        if (ft && ft.length > 50 && !ft.includes('페이지 주소')) {
          frameData = ft;
          break;
        }
      }
    }

    if (!hasError) {
      const data = frameData || text;
      if (data.includes('조회') || data.includes('댓글') || data.includes('공감') || data.includes('글') || /1\.\s/.test(data)) {
        console.log(`   ✅ 게시글 데이터 발견!`);
        data.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));
        break;
      } else {
        console.log(`   ⚠️ 접속만 됨, 미리보기:`, data.replace(/\n/g, ' | ').substring(0, 150));
      }
    } else {
      console.log(`   ❌ 오류`, text.substring(0, 100));
    }
  }

  // 2. 블로그 메인 + post list에서 "통계" 링크가 있는 각 게시물
  console.log('\n2. 블로그 게시물별 공개 통계 정보...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=0', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await sleep(3000);

  const blogFrame = page.frames().find(f => f.url().includes('PostList'));
  if (blogFrame) {
    // 각 게시물 요소에서 "통계" 링크 클릭 가능 여부 확인
    const posts = await blogFrame.evaluate(() => {
      const items = [];
      // 게시물 제목과 날짜가 있는 요소들 수집
      const list = document.querySelectorAll('a, span, div, strong');
      let currentTitle = '';
      for (const el of list) {
        const t = el.textContent.trim();
        if (el.tagName === 'STRONG' || el.className.includes('title') || el.className.includes('subject') || el.className.includes('pcol')) {
          if (t.length > 5) currentTitle = t.substring(0, 60);
        }
        if (t === '통계') {
          items.push({
            title: currentTitle,
            link: el.href || '',
            parent: el.parentElement?.textContent?.trim()?.substring(0, 80) || ''
          });
        }
      }
      return items.slice(0, 20);
    });
    console.log('   통계 링크가 있는 게시물:', posts.length);
    posts.forEach((p, i) => console.log(`    ${i}. ${p.title}`));
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
