const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();

  // Handle any unexpected dialogs
  page.on('dialog', async dialog => {
    await dialog.dismiss();
  });

  console.log('========== 네이버 블로그 관리자 통계 ==========\n');

  // 방문자 통계 페이지로 이동
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await page.waitForTimeout(5000);

  const url = page.url();
  console.log(`현재 URL: ${url}`);

  if (url.includes('nid.naver.com') || url.includes('login')) {
    console.log('❌ 로그인 필요 — 브라우저에서 로그인해주세요');
    console.log('   프로필은 이미 있을 수 있으니 로그인 창에서 진행해주세요');
  } else {
    console.log('✅ 통계 페이지 접속 성공\n');
    
    // 전체 텍스트 추출 (통계 정보)
    const statText = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      return lines;
    });
    
    console.log('--- 통계 페이지 내용 (전체) ---');
    statText.forEach(l => console.log(`  ${l}`));
  }

  console.log('\n========== 분석 종료 ==========');
})();
