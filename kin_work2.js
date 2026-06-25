const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  let kinPage = null;
  for (const p of pages) {
    if (p.url().includes('kin.naver.com') && p.url().includes('list.naver')) {
      kinPage = p;
      break;
    }
  }
  if (!kinPage) {
    kinPage = await ctx.newPage();
    await kinPage.goto('https://kin.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }
  
  await kinPage.bringToFront();
  await kinPage.waitForTimeout(2000);
  
  // 최신순 + 숏폼/릴스 관련 질문 검색
  const terms = ['숏폼 영상', '인스타 릴스', '영상편집 초보', '유튜브 편집', '영상제작 의뢰'];
  const term = terms[0];
  
  const input = await kinPage.$('input.search_input, input#nx_query, input[name=query]');
  if (input) {
    await input.click();
    await kinPage.waitForTimeout(300);
    // clear + fill
    await kinPage.evaluate((t) => {
      const inp = document.querySelector('input.search_input, input#nx_query, input[name=query]');
      if (inp) {
        const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        proto.set.call(inp, '');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        proto.set.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, term);
    await kinPage.waitForTimeout(500);
    // 엔터
    await kinPage.keyboard.press('Enter');
    await kinPage.waitForTimeout(5000);
  }
  
  console.log('URL:', kinPage.url().substring(0, 150));
  
  // 최신순 정렬 클릭
  const sortBtns = await kinPage.evaluate(() => {
    const anchors = document.querySelectorAll('a');
    const results = [];
    anchors.forEach((a, i) => {
      if (a.innerText && a.innerText.trim() === '최신순') results.push(i);
    });
    return results;
  });
  console.log('최신순 버튼 인덱스:', sortBtns);
  if (sortBtns.length > 0) {
    const anchors = await kinPage.$$('a');
    await anchors[sortBtns[0]].click();
    await kinPage.waitForTimeout(3000);
    console.log('최신순 정렬 완료');
  }
  
  const body = await kinPage.evaluate(() => document.body.innerText.substring(0, 8000));
  console.log(body);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 300)));
