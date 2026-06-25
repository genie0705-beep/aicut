const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // 광고그룹 페이지 열기
  let page = pages.find(p => p.url().includes('ads.naver.com/manage'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://ads.naver.com/manage/ad-accounts/334739/all-campaigns', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(3000);
  }

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await sleep(5000);

  // 수정 버튼 스크롤 후 클릭
  await page.evaluate(() => window.scrollTo(0, 220));
  await sleep(1000);

  const editResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '수정') {
        const rect = btn.getBoundingClientRect();
        if (rect.top >= 0) {
          btn.click();
          return 'clicked at y=' + Math.round(rect.top);
        }
      }
    }
    // 직접 dispatchEvent 시도
    for (const btn of btns) {
      if (btn.innerText.trim() === '수정') {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return 'dispatchEvent clicked';
      }
    }
    return 'not found';
  });
  console.log('수정 버튼:', editResult);
  await sleep(3000);

  // 모달/에디터 확인
  const afterEdit = await page.evaluate(() => {
    const text = document.body.innerText;
    // "기본 입찰가" 근처 검사
    const idx = text.indexOf('기본 입찰가');
    if (idx >= 0) {
      return '기본 입찰가 위치: ' + text.substring(idx, idx + 50);
    }
    // 새로 나타난 요소 확인
    const visibleInputs = [];
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.offsetParent !== null) {
        visibleInputs.push({ type: el.type || el.tagName, value: el.value || '', placeholder: el.placeholder || '' });
      }
    });
    return { visibleEdits: visibleInputs.length, inputs: visibleInputs };
  });
  console.log('수정 후:', JSON.stringify(afterEdit, null, 2).substring(0, 500));

  // 기본 입찰가 input 직접 찾아서 값 변경 시도
  const bidChanged = await page.evaluate(() => {
    // "700원" 텍스트 노드 찾아서 input으로 변경
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL);
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeType === 1) {
        const text = node.innerText?.trim();
        if (text === '700원' && node.tagName !== 'INPUT') {
          const parent = node.closest('[class*="col"], [class*="Col"], div');
          if (parent) {
            // 기존 텍스트를 input으로 교체
            const input = document.createElement('input');
            input.type = 'text';
            input.value = '1500';
            input.style.width = '80px';
            input.style.textAlign = 'center';
            node.parentNode.replaceChild(input, node);
            return 'replaced with input: 1500';
          }
        }
      }
    }
    return 'not found or replaced';
  });
  console.log('입찰가 변경 시도:', bidChanged);
  await sleep(1000);

  // 저장 버튼 찾기
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = btn.innerText.trim();
      if (text === '저장' || text.includes('저장') || btn.className.includes('save')) {
        if (btn.offsetParent !== null) {
          btn.click();
          return 'save clicked: ' + text;
        }
      }
    }
    return 'save btn not visible';
  });
  console.log('저장:', saveResult);
  await sleep(2000);

  // 원래 페이지로 돌아와서 확인
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await sleep(5000);

  const verify = await page.evaluate(() => {
    const text = document.body.innerText;
    const idx = text.indexOf('기본 입찰가');
    if (idx >= 0) return text.substring(idx, idx + 30);
    return 'not found';
  });
  console.log('기본 입찰가 확인:', verify);

  await b.close();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
