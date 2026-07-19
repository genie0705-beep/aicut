const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 관리 페이지로 이동
  let adminPage = pages.find(p => p.url().includes('admin.blog'));
  if (!adminPage) {
    adminPage = await b.contexts()[0].newPage();
    await adminPage.goto('https://admin.blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(5000);
  } else {
    await adminPage.bringToFront();
    await sleep(2000);
  }
  
  // 현재 URL 확인
  let url = await adminPage.evaluate(() => window.location.href);
  console.log('관리페이지 URL:', url.substring(0, 80));
  
  // 글 관리 페이지로 이동
  await adminPage.goto('https://admin.blog.naver.com/aicut/posts', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  
  const text = await adminPage.evaluate(() => document.body.innerText);
  const lines = text.split('\n').filter(l => l.trim());
  
  // 임시저장 관련 텍스트 찾기
  console.log('\n=== 임시저장 관련 ===');
  lines.forEach((l, i) => {
    if (l.includes('임시') || l.includes('저장') || l.includes('삭제') || l.includes('전체') || l.includes('글') || l.includes('관리')) {
      console.log(i + ': ' + l.substring(0, 80));
    }
  });
  
  console.log('\n=== 상단 메뉴 ===');
  lines.slice(0, 30).forEach((l, i) => console.log(i + ': ' + l.substring(0, 80)));
  
  await b.close();
})();
