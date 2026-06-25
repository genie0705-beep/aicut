const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  
  console.log('=== 포스팅 저장 상태 확인 ===\n');
  
  // 임시저장 관리 페이지로 이동
  await page.goto('https://blog.naver.com/aicut/Manage', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 임시저장 탭 찾기
  const tabResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, span');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t.includes('임시저장') || t.includes('임시 저장')) {
        btn.click();
        return '임시저장 클릭: ' + t.substring(0, 15);
      }
    }
    // Try category tabs
    const tabs = document.querySelectorAll('[class*="tab"], [class*="Tab"], li');
    for (const tab of tabs) {
      const t = (tab.innerText || '').trim();
      if (t === '임시저장' || t === '임시 저장') {
        tab.click();
        return '탭 클릭: ' + t;
      }
    }
    return '임시저장 탭 못 찾음';
  });
  console.log(tabResult);
  await page.waitForTimeout(3000);
  
  // 임시저장 목록 확인
  const posts = await page.evaluate(() => {
    const items = document.querySelectorAll('[class*="post"], [class*="list"], li, tr');
    const results = [];
    items.forEach(item => {
      const t = (item.innerText || '').trim();
      if (t.length > 5 && t.length < 100) {
        results.push(t.substring(0, 60));
      }
    });
    return results.slice(0, 10);
  });
  console.log('게시물 샘플:', posts.slice(0, 5));
  
  // 전체 페이지 텍스트에서 IR 피칭 제목 찾기
  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasIR = bodyText.includes('IR 피칭');
  const hasStartup = bodyText.includes('스타트업');
  console.log('\n제목 검색:');
  console.log('  "IR 피칭" 포함:', hasIR ? '✅' : '❌');
  console.log('  "스타트업" 포함:', hasStartup ? '✅' : '❌');
  
  await page.screenshot({ path: path.join(W, 'blog_manage_check.png') });
  
  console.log('\n=== 확인 완료 ===');
  console.log('임시저장 목록에서 제목이 보이면 포스팅이 정상 저장된 것입니다.');
  
  await b.close();
})();
