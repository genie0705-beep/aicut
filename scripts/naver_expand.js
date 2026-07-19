const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(2000);

  // expand_more 버튼들 클릭해서 사이드바 메뉴 펼치기
  const expandResult = await saPage.evaluate(() => {
    const results = [];
    const expandIcons = document.querySelectorAll('[class*=expand_more], [class*=expand]');
    expandIcons.forEach((el, idx) => {
      results.push({ idx, text: el.innerText?.trim(), class: el.className?.substring(0, 60) });
      el.click();
    });
    return results;
  });
  console.log('expand_more 클릭 결과:', JSON.stringify(expandResult, null, 2));
  await saPage.waitForTimeout(2000);

  // 펼쳐진 메뉴에서 "자세히 보기" 또는 하위 링크 클릭
  const subLinks = await saPage.evaluate(() => {
    const links = [];
    document.querySelectorAll('a').forEach(a => {
      if (a.href && !a.href.includes('#') && a.href.includes('console/site')) {
        links.push(a.href);
      }
    });
    return [...new Set(links)];
  });
  console.log('\n=== console/site 링크 ===');
  subLinks.forEach(l => console.log(l));

  // 펼쳐진 후 전체 텍스트
  const text = await saPage.evaluate(() => document.body.innerText);
  console.log('\n=== 펼쳐진 페이지 텍스트 ===');
  // 노출/클릭, 수집, 진단 관련 데이터 찾기
  const lines = text.split('\n').filter(l => l.trim());
  const relevant = lines.filter(l => 
    l.includes('노출') || l.includes('클릭') || l.includes('수집') || 
    l.includes('색인') || l.includes('진단') || l.includes('페이지') ||
    l.includes('차트') || l.includes('리포트') || l.includes('통계')
  );
  console.log(JSON.stringify(relevant, null, 2));

  await browser.close();
})();
