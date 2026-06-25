const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 네이버 블로그 관리 페이지
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 페이지 전체 텍스트에서 "IR 피칭" 제목 찾기
  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasIR = bodyText.includes('IR 피칭');
  const hasStartup = bodyText.includes('스타트업');
  const hasAicut = bodyText.includes('에이컷');
  
  console.log('=== 블로그 관리 페이지 확인 ===');
  console.log('"IR 피칭" 포함:', hasIR ? '✅' : '❌');
  console.log('"스타트업" 포함:', hasStartup ? '✅' : '❌');
  
  if (hasIR) {
    console.log('\n✅ 서버에 포스팅 저장됨!');
  } else {
    console.log('\n❌ 저장 안 됨 (관리 페이지에서 검색 불가)');
  }
  
  // 저장 버튼을 다시 눌러보기
  console.log('\n--- PostWriteForm 열어서 재저장 시도 ---');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 복구 팝업
  const popup = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t.includes('이어서')) { btn.click(); return t; }
    }
    return '없음';
  });
  console.log('복구 팝업:', popup);
  
  await b.close();
})();
