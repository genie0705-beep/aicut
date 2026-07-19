const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // GA4 admin/events 탭 찾기
  let page = pages.find(p => p.url().includes('admin/events'));
  if (!page) page = pages.find(p => p.url().includes('analytics.google.com'));
  
  if (!page) {
    console.log('GA4 페이지 없음');
    await b.close();
    return;
  }
  
  await page.bringToFront();
  await sleep(2000);
  
  // 1. generate_lead → 전환 마킹
  console.log('1. generate_lead → 전환 마킹');
  
  // 먼저 모달 닫기
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const icon = btn.querySelector('mat-icon');
      if (icon && (icon.innerText === 'close' || icon.textContent?.trim() === 'close')) {
        btn.click();
        return;
      }
    }
  });
  await sleep(2000);
  
  const glResult = await page.evaluate(() => {
    const rows = document.querySelectorAll('mat-row');
    for (const row of rows) {
      const span = row.querySelector('span.event-name');
      if (span && span.innerText.trim() === 'generate_lead') {
        const toggle = row.querySelector('button[aria-label*="주요 이벤트"]');
        if (toggle) { toggle.click(); return 'clicked'; }
        return 'no toggle';
      }
    }
    return 'not found';
  });
  console.log('   generate_lead:', glResult);
  await sleep(3000);
  
  // 2. cta_click 이벤트 등록
  console.log('2. cta_click 등록');
  
  // 이벤트 만들기 버튼
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, 4, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.trim() === '이벤트 만들기') {
        const parent = node.parentElement;
        (parent.closest('button') || parent).click();
        return;
      }
    }
  });
  await sleep(3000);
  
  // 코드로 만들기
  await page.evaluate(() => {
    const label = document.querySelector('label[for=mat-radio-1-input]');
    if (label) label.click();
  });
  await sleep(1500);
  
  // cta_click 입력
  await page.locator('#mat-input-1').fill('cta_click');
  await sleep(500);
  
  // 주요 이벤트 토글 ON
  await page.evaluate(() => {
    const switches = document.querySelectorAll('[role=dialog] .mdc-switch, .cdk-overlay-pane .mdc-switch');
    for (const sw of switches) {
      if (!sw.classList.contains('mdc-switch--selected')) {
        sw.click();
        return;
      }
    }
  });
  await sleep(1000);
  
  // 만들기
  await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role=dialog], .cdk-overlay-pane');
    for (const dlg of dialogs) {
      const btns = dlg.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.innerText.trim() === '만들기' && !btn.disabled) {
          btn.click();
          return;
        }
      }
    }
  });
  await sleep(5000);
  
  // 3. cta_click → 전환 마킹
  console.log('3. cta_click → 전환 마킹');
  const ctaResult = await page.evaluate(() => {
    const rows = document.querySelectorAll('mat-row');
    for (const row of rows) {
      const span = row.querySelector('span.event-name');
      if (span && span.innerText.trim() === 'cta_click') {
        const toggle = row.querySelector('button[aria-label*="주요 이벤트"]');
        if (toggle) { toggle.click(); return 'clicked'; }
        return 'no toggle';
      }
    }
    return 'not found';
  });
  console.log('   cta_click:', ctaResult);
  await sleep(3000);
  
  // 4. purchase도 전환 마킹 (이미 등록되어 있음)
  console.log('4. purchase → 전환 마킹');
  const purResult = await page.evaluate(() => {
    const rows = document.querySelectorAll('mat-row');
    for (const row of rows) {
      const span = row.querySelector('span.event-name');
      if (span && span.innerText.trim() === 'purchase') {
        const toggle = row.querySelector('button[aria-label*="주요 이벤트"]');
        if (toggle) { toggle.click(); return 'clicked'; }
        return 'no toggle';
      }
    }
    return 'not found';
  });
  console.log('   purchase:', purResult);
  await sleep(3000);
  
  // 최종 결과
  const text = await page.evaluate(() => document.body.innerText);
  const hasGL = text.includes('generate_lead');
  const hasCTA = text.includes('cta_click');
  const hasPur = text.includes('purchase');
  const majorIdx = text.indexOf('주요 이벤트');
  const majorSection = majorIdx >= 0 ? text.substring(majorIdx, majorIdx + 400) : '';
  
  console.log('\n=== 최종 결과 ===');
  console.log('generate_lead 등록:', hasGL ? '✅' : '❌');
  console.log('cta_click 등록:', hasCTA ? '✅' : '❌');
  console.log('purchase 존재:', hasPur ? '✅' : '❌');
  console.log('\n주요 이벤트 영역:');
  console.log(majorSection.substring(0, 300));
  
  await b.close();
})();
