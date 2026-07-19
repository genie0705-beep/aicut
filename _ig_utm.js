const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // Instagram 프로필 편집 페이지 열기
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/accounts/edit/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Instagram URL:', url.substring(0, 100));
  
  // 로그인 페이지인지 확인
  if (url.includes('login')) {
    console.log('로그인 필요 - @aicut.official 계정');
    console.log('(자동 로그인 불가, 수동 처리 필요)');
    await page.close();
    process.exit(1);
  }
  
  // 프로필 편집 페이지 - 웹사이트 필드 찾기
  // 지금 URL에 UTM 파라미터 추가
  // Instagram에서 웹사이트 필드는 보통 input 요소
  const pageText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
  console.log('페이지 내용:', pageText);
  
  // 웹사이트 입력 필드 찾기
  const websiteField = await page.evaluate(() => {
    // 다양한 셀렉터로 웹사이트 입력 필드 찾기
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      const placeholder = input.getAttribute('placeholder') || '';
      const label = input.getAttribute('aria-label') || '';
      const name = input.getAttribute('name') || '';
      const id = input.getAttribute('id') || '';
      
      if (placeholder.includes('website') || placeholder.includes('site') || 
          label.includes('website') || label.includes('site') ||
          name.includes('website') || name.includes('url') ||
          id.includes('website') || id.includes('url')) {
        return { placeholder, label, name, id, value: input.value, tag: 'input' };
      }
    }
    
    // 혹시 다른 요소
    const allEls = document.querySelectorAll('[contenteditable=true], textarea, [role=textbox]');
    for (const el of allEls) {
      const ariaLabel = el.getAttribute('aria-label') || '';
      if (ariaLabel.includes('website') || ariaLabel.includes('site') || ariaLabel.includes('url')) {
        return { ariaLabel, text: el.textContent?.substring(0, 80), tag: el.tagName };
      }
    }
    
    return { found: false, inputCount: inputs.length, inputValues: Array.from(inputs).slice(0, 5).map(i => ({ placeholder: i.getAttribute('placeholder'), value: (i.value || '').substring(0, 50) })) };
  });
  
  console.log('\\n웹사이트 필드:', JSON.stringify(websiteField, null, 2));
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
