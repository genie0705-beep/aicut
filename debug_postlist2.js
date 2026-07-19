const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 블로그 메인 먼저 방문 (로그인 상태 체크)
  console.log('1. 블로그 메인 방문...');
  await page.goto('https://blog.naver.com', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(3000);
  let text = await page.evaluate(() => document.body.innerText);
  const loggedIn = text.includes('로그아웃') || text.includes('내메뉴') || text.includes('관리');
  console.log('   로그인:', loggedIn ? '✅' : '❌');

  // 관리자 페이지 접속
  console.log('\n2. 관리자 방문...');
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(4000);
  text = await page.evaluate(() => document.body.innerText);
  console.log('   관리자 접속:', !text.includes('페이지 주소') && !text.includes('유효하지 않은') ? '✅' : '❌');

  // 프레임 확인
  console.log('\n3. 모든 프레임:');
  page.frames().forEach((f, i) => {
    if (f.url() !== 'about:blank') console.log(`  [${i}] ${f.url().substring(0, 100)}`);
  });

  // Stats iframe에서 데이터 추출
  const statFrame = page.frames().find(f => f.url().includes('blog.stat.naver.com'));
  if (statFrame) {
    console.log('\n4. 통계 프레임 데이터:');
    text = await statFrame.evaluate(() => document.body.innerText);
    text.split('\n').filter(l => l.trim()).forEach(l => console.log('  ' + l));
  }

  // 5. 게시글 링크 수집을 위해 다른 방법 시도
  console.log('\n5. 블로그 PostList 접속 (새 탭)...');
  const page2 = await ctx.newPage();
  await page2.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=0', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await sleep(5000);

  console.log('   프레임 구성:');
  page2.frames().forEach((f, i) => {
    if (f.url() !== 'about:blank') console.log(`  [${i}] ${f.url().substring(0, 100)}`);
  });

  // PostList가 iframe 내부에 있는지 확인
  const postFrame = page2.frames().find(f => f.url().includes('PostList'));
  if (postFrame) {
    text = await postFrame.evaluate(() => document.body.innerText);
    console.log('\n   PostList 텍스트 미리보기:');
    text.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 100)}`));
  } else {
    text = await page2.evaluate(() => document.body.innerText);
    console.log('\n   메인 페이지 텍스트 (첫 40줄):');
    text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 100)}`));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message));
