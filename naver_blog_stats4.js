const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 통계 v4 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 네이버 로그인 상태 먼저 확인
  console.log('1. 네이버 로그인 상태 확인...');
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  let text = await page.evaluate(() => document.body.innerText);
  const naverLoggedIn = text.includes('로그아웃');
  console.log('   네이버 전체 로그인:', naverLoggedIn ? '✅' : '❌');
  if (!naverLoggedIn) {
    console.log('   텍스트:', text.substring(0, 200));
  }

  // aicut 블로그 방문 - 프레임 구조 확인
  console.log('\n2. 블로그 방문 + 프레임 확인...');
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  const frameInfo = await page.evaluate(() => ({
    url: location.href,
    frames: Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src, id: f.id, name: f.name })),
    bodyLen: document.body.innerText.length,
    bodyPreview: document.body.innerText.substring(0, 500)
  }));
  console.log('   URL:', frameInfo.url.substring(0, 100));
  console.log('   iframes:', JSON.stringify(frameInfo.frames));
  console.log('   bodyLen:', frameInfo.bodyLen);
  console.log('   bodyPreview:', frameInfo.bodyPreview.substring(0, 300));

  // 메인 프레임이 있다면 접근
  for (const f of frameInfo.frames) {
    if (f.src) {
      try {
        const frame = page.frame({ url: f.src });
        if (frame) {
          const ft = await frame.evaluate(() => document.body.innerText).catch(() => 'access denied');
          console.log(`\n   Frame ${f.id || f.name || '?'} text:`, (ft || '').substring(0, 300));
        }
      } catch(e) {}
    }
  }

  // 3. 블로그 관리/설정 페이지 접속 시도
  console.log('\n3. 블로그 관리 페이지 시도...');
  const adminUrls = [
    'https://blog.naver.com/blogadmin?blogId=aicut',
    'https://blog.naver.com/blogadmin',
    'https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=0',
    'https://blog.naver.com/blogstats?blogId=aicut',
  ];
  
  for (const url of adminUrls) {
    console.log(`   시도: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await sleep(3000);
    const loc = await page.evaluate('location.href');
    const t = await page.evaluate(() => document.body.innerText);
    const preview = t.replace(/\n/g, ' | ').substring(0, 200);
    console.log(`   → ${loc.substring(0, 80)}`);
    console.log(`   → ${preview}`);
    
    if (t.includes('통계') || t.includes('방문자') || t.includes('조회수')) {
      console.log('   ✅ 통계 데이터 발견!');
      t.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));
      break;
    }
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
