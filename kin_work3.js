const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  let kinPage = null;
  for (const p of pages) {
    if (p.url().includes('kin.naver.com')) { kinPage = p; break; }
  }
  if (!kinPage) {
    kinPage = await ctx.newPage();
    await kinPage.goto('https://kin.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }
  
  await kinPage.bringToFront();
  await kinPage.waitForTimeout(2000);
  
  // 답변 0개인 최신 질문 검색 - 영상편집/숏폼/릴스 관련
  const terms = ['영상편집 의뢰', '영상제작 맡길', '숏폼 제작', '릴스 편집', '영상 아웃소싱'];
  const term = terms[0];
  
  const input = await kinPage.$('input.search_input, input#nx_query, input[name=query]');
  if (input) {
    await input.evaluate((el, t) => {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      proto.set.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      proto.set.call(el, t);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, term);
    await kinPage.waitForTimeout(300);
    await kinPage.keyboard.press('Enter');
    await kinPage.waitForTimeout(4000);
  }
  
  console.log('URL:', kinPage.url().substring(0, 150));
  
  // 질문 목록 수집 (링크 + 제목)
  const questions = await kinPage.evaluate(() => {
    const items = [];
    // 검색 결과 링크들
    const links = document.querySelectorAll('a');
    links.forEach(a => {
      const url = a.href || '';
      const text = a.innerText || '';
      if (url.includes('kin.naver.com/qna/') && text.length > 10 && !text.includes('더보기') && !text.includes('검색결과')) {
        items.push({ url: url.substring(0, 120), title: text.substring(0, 80) });
      }
    });
    return items;
  });
  
  console.log('\n=== 질문 목록 ===');
  questions.forEach((q, i) => console.log(i + ': ' + q.title + ' | ' + q.url));
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 300)));
