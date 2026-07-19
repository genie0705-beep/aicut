const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  const page = pages.find(p => p.url().includes('admin/events')) || pages.find(p => p.url().includes('analytics'));
  if (!page) { console.log('GA4 페이지 없음'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);
  
  // 모달 닫기
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(btn => {
      const icon = btn.querySelector('mat-icon');
      if (icon && (icon.innerText === 'close' || icon.textContent?.trim() === 'close')) btn.click();
    });
  });
  await sleep(2000);
  
  const text = await page.evaluate(() => document.body.innerText);
  
  // cta_click 이미 있으면 전환 마킹, 없으면 생성
  if (text.includes('cta_click')) {
    console.log('cta_click 이미 등록됨');
  } else {
    console.log('cta_click 등록 시작');
    
    // 이벤트 만들기 클릭
    await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, 4, null, false);
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim() === '이벤트 만들기') {
          (node.parentElement.closest('button') || node.parentElement).click();
          return;
        }
      }
    });
    await sleep(3000);
    
    // 코드로 만들기
    await page.evaluate(() => {
      document.querySelector('label[for=mat-radio-1-input]')?.click();
    });
    await sleep(2000);
    
    // 입력 필드에 값 설정
    await page.evaluate(() => {
      const inp = document.querySelector('#mat-input-1') || document.querySelector('input[placeholder*="이벤트"]');
      if (inp) {
        const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        proto.set.call(inp, 'cta_click');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return 'filled cta_click';
      }
      return 'input not found';
    });
    await sleep(1500);
    
    // 주요 이벤트 토글 ON
    await page.evaluate(() => {
      document.querySelectorAll('[role=dialog] .mdc-switch, .cdk-overlay-pane .mdc-switch').forEach(sw => {
        if (!sw.classList.contains('mdc-switch--selected')) sw.click();
      });
    });
    await sleep(1000);
    
    // 만들기 클릭
    await page.evaluate(() => {
      document.querySelectorAll('[role=dialog] button, .cdk-overlay-pane button').forEach(btn => {
        if (btn.innerText.trim() === '만들기' && !btn.disabled) btn.click();
      });
    });
    await sleep(5000);
  }
  
  // cta_click 전환 마킹
  console.log('전환 마킹 시작');
  await page.evaluate(() => {
    document.querySelectorAll('mat-row').forEach(row => {
      const span = row.querySelector('span.event-name');
      if (!span) return;
      const name = span.innerText.trim();
      if (['generate_lead', 'cta_click', 'purchase'].includes(name)) {
        const toggle = row.querySelector('button[aria-label*="주요"]');
        if (toggle) toggle.click();
      }
    });
  });
  await sleep(3000);
  
  // 최종 확인
  const final = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      hasGenerateLead: t.includes('generate_lead'),
      hasCtaClick: t.includes('cta_click'),
      hasPurchase: t.includes('purchase'),
      majorSection: t.indexOf('주요 이벤트') >= 0 ? t.substring(t.indexOf('주요 이벤트'), t.indexOf('주요 이벤트') + 300) : 'no section'
    };
  });
  
  console.log('\n=== 최종 결과 ===');
  console.log('generate_lead:', final.hasGenerateLead ? '✅' : '❌');
  console.log('cta_click:', final.hasCtaClick ? '✅' : '❌');
  console.log('purchase:', final.hasPurchase ? '✅' : '❌');
  console.log('\n주요 이벤트 영역:\n' + final.majorSection.substring(0, 300));
  
  await b.close();
})();
