const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // Instagram 프로필 편집 탭 찾기
  let editPage = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com/accounts/edit')) {
      editPage = p;
      break;
    }
  }
  
  if (!editPage) {
    console.log('Instagram 편집 페이지 없음');
    process.exit(1);
  }
  
  await editPage.bringToFront();
  
  // 웹사이트 input 필드 찾기
  const inputInfo = await editPage.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      if (input.getAttribute('placeholder') === '웹사이트') {
        return {
          found: true,
          currentValue: input.value,
          disabled: input.disabled,
          readOnly: input.readOnly
        };
      }
    }
    return { found: false };
  });
  
  console.log('입력 필드:', JSON.stringify(inputInfo));
  
  if (inputInfo.found && !inputInfo.disabled) {
    // React controlled input - value setter 사용
    await editPage.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (input.getAttribute('placeholder') === '웹사이트') {
          // React controlled input value 변경
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          nativeInputValueSetter.call(input, 'https://aicut.co.kr?utm_source=instagram&utm_medium=social&utm_campaign=profile');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }
    });
    
    console.log('✅ 웹사이트 값 변경 완료');
    
    // 변경 사항 확인
    const newValue = await editPage.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (input.getAttribute('placeholder') === '웹사이트') {
          return input.value;
        }
      }
      return 'not found';
    });
    
    console.log('변경된 값:', newValue);
    
    // 제출 버튼 찾기
    await editPage.waitForTimeout(1000);
    
    const submitBtn = await editPage.evaluate(() => {
      const buttons = document.querySelectorAll('button, div[role=button]');
      for (const btn of buttons) {
        const text = (btn.innerText || '').trim();
        if (text === '제출' || text === 'Submit' || text === '보내기' || text === '저장') {
          btn.click();
          return 'clicked: ' + text;
        }
      }
      return 'no submit button found';
    });
    
    console.log('제출 버튼:', submitBtn);
    await editPage.waitForTimeout(3000);
    
    // 성공 메시지 확인
    const result = await editPage.evaluate(() => {
      const toast = document.querySelector('[role=alert], [class*=toast], [class*=success]');
      return toast?.innerText?.substring(0, 100) || 'no toast';
    });
    
    console.log('결과:', result);
  } else {
    console.log('입력 필드를 찾을 수 없거나 비활성화됨');
    console.log('Instagram 웹 제한: 모바일 앱에서만 수정 가능 안내 있었음');
    console.log('\\n👉 정이사님, Instagram 앱에서 직접 변경 부탁드립니다!');
  }
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
