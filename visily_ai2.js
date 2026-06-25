const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('visily.ai')) { page = pages[i]; break; }
  }
  if (!page) { console.log('Visily not found'); await b.close(); return; }

  await page.bringToFront();
  await new Promise(r => setTimeout(r, 2000));

  for (let j = 0; j < 3; j++) {
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // Click Generate with AI
  await page.evaluate(() => {
    const els = document.querySelectorAll('span, div, button');
    for (const el of els) {
      if (el.innerText && el.innerText.trim() === 'Generate with AI' && el.offsetParent !== null) {
        el.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // Find the textarea and type the prompt
  await page.evaluate(() => {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      if (ta.offsetParent !== null) {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, '');
        ta.value = '기존 담당자(Manager) 테이블에 아래 컬럼 3개를 추가해줘: password_hash (VARCHAR(200)), auth_level (VARCHAR(20)), use_yn (CHAR(1)). 기존 스타일 그대로 유지해줘.';
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
  });
  console.log('Typed prompt');
  await new Promise(r => setTimeout(r, 1000));

  // Find and click submit/generate button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      const txt = b.innerText.trim();
      // Look for generate/submit/arrow button near the textarea
      if ((txt === 'Generate' || b.querySelector('svg')) && b.offsetParent !== null) {
        const rect = b.getBoundingClientRect();
        if (rect.y > 500) { // near the bottom of the page
          b.click();
          console.log('Clicked button:', txt);
          return;
        }
      }
    }
    // Try any button that looks like a submit
    for (const b of btns) {
      if (b.offsetParent !== null) {
        const rect = b.getBoundingClientRect();
        if (rect.x > 200 && rect.y > 500 && (b.querySelector('svg') || b.innerText.trim())) {
          b.click();
          console.log('Clicked bottom button');
          return;
        }
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Submitted');
  
  // Take screenshot to see result
  await page.screenshot({ path: 'visily_ai_result.png' });
  console.log('Screenshot saved');

  await b.close();
})().catch(e => console.log('ERR:', e.message));
