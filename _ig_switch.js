const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let igPage = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com') && !p.url().includes('login')) {
      igPage = p;
      break;
    }
  }
  
  // 현재 피드에서 aicut.official로 계정 전환
  // 우측 상단 더보기 (점 3개 또는 프로필) 클릭
  await igPage.evaluate(() => {
    // 1. 사이드바 하단의 aicut.official 링크 찾기
    const all = document.querySelectorAll('a, span, div, [role=button]');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === 'aicut.official' && el.offsetParent !== null) {
        el.click();
        return 'clicked aicut.official sidebar';
      }
    }
    return 'not found';
  });
  
  await igPage.waitForTimeout(3000);
  const url = igPage.url();
  console.log('URL:', url.substring(0, 100));
  
  const text = await igPage.evaluate(() => document.body?.innerText?.substring(0, 300) || '');
  console.log('텍스트:', text ? text.substring(0, 200) : '(empty)');
  
  // aicut.official 페이지인지 확인
  const isAicut = text.includes('aicut.official') && (text.includes('게시물') || text.includes('팔로워'));
  console.log('\\naicut.official 페이지:', isAicut);
  
  if (isAicut) {
    console.log('✅ @aicut.official 계정 접근 성공!');
  }
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
