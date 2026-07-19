const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  // Instagram 편집 페이지 다시 열기
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/accounts/edit/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('URL:', url.substring(0, 100));
  
  if (url.includes('login')) {
    console.log('로그인 필요');
    process.exit(1);
  }
  
  // 웹사이트 input 필드 찾기
  const inputInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      if (input.getAttribute('placeholder') === '웹사이트') {
        return {
          found: true,
          value: input.value,
          disabled: input.disabled,
          readOnly: input.readOnly,
          hasWarning: document.body.innerText.includes('모바일에서만')
        };
      }
    }
    return { found: false };
  });
  
  console.log('입력 필드:', JSON.stringify(inputInfo));
  
  if (inputInfo.found && !inputInfo.disabled) {
    // React controlled input value 변경
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (input.getAttribute('placeholder') === '웹사이트') {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'https://aicut.co.kr?utm_source=instagram&utm_medium=social&utm_campaign=profile');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }
    });
    console.log('✅ 값 변경됨');
    
    await page.waitForTimeout(500);
    
    // 제출 버튼 찾기
    const submitResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.innerText.trim();
        if (text === '제출' || text === '저장' || text === '보내기') {
          btn.click();
          return 'clicked ' + text;
        }
      }
      return 'no submit btn';
    });
    console.log('제출:', submitResult);
    
    await page.waitForTimeout(3000);
    
    // 확인
    const currentValue = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (input.getAttribute('placeholder') === '웹사이트') {
          return input.value;
        }
      }
      return '?';
    });
    console.log('최종 값:', currentValue);
    
    const successMsg = await page.evaluate(() => {
      return document.body.innerText.includes('저장됨') || document.body.innerText.includes('변경됨');
    });
    console.log('저장 성공 메시지:', successMsg);
    
  } else {
    console.log('입력 필드 비활성화 또는 없음');
    console.log('Instagram 웹 제한 확인됨');
  }
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
