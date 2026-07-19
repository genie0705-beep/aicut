const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/accounts/edit/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // disabled 속성 제거 후 값 변경
  const result = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    let target = null;
    
    for (const input of inputs) {
      if (input.getAttribute('placeholder') === '웹사이트') {
        target = input;
        break;
      }
    }
    
    if (!target) return 'input not found';
    
    // disabled 속성 제거
    target.disabled = false;
    target.readOnly = false;
    target.removeAttribute('disabled');
    target.removeAttribute('readonly');
    
    // React controlled input value setter 사용
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(target, 'https://aicut.co.kr?utm_source=instagram&utm_medium=social&utm_campaign=profile');
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    
    return { value: target.value, disabled: target.disabled, readOnly: target.readOnly };
  });
  
  console.log('변경 결과:', JSON.stringify(result));
  
  await page.waitForTimeout(1000);
  
  // 제출 버튼 찾기
  const submitResult = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.innerText.trim();
      if (text === '제출' || text === '보내기' || text === '저장' || text === 'Submit') {
        btn.click();
        return 'clicked: ' + text;
      }
    }
    
    // 혹시 '저장'이 span 안에?
    const spans = document.querySelectorAll('span, div[role=button]');
    for (const s of spans) {
      const text = s.innerText.trim();
      if ((text === '저장' || text === '제출') && s.offsetParent !== null) {
        s.click();
        return 'clicked span: ' + text;
      }
    }
    
    return 'no button found. buttons: ' + Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).join(', ');
  });
  
  console.log('제출:', submitResult);
  
  await page.waitForTimeout(3000);
  
  // 결과 확인
  const finalValue = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      if (input.getAttribute('placeholder') === '웹사이트') {
        return { value: input.value, disabled: input.disabled };
      }
    }
    return 'not found';
  });
  
  console.log('\\n최종 값:', JSON.stringify(finalValue));
  console.log('\\n✅ 결과:', finalValue.value === 'https://aicut.co.kr?utm_source=instagram&utm_medium=social&utm_campaign=profile' ? '저장 성공!' : '저장 실패 또는 제한');
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
