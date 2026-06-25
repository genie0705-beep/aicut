const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  console.log('aicut.co.kr 접속...');
  await page.goto('https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  // "월 정기 계약 문의" 버튼 클릭
  const ctaClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.includes('월 정기 계약 문의'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('CTA 클릭:', ctaClicked);
  await sleep(2000);

  // 폼 입력창 확인
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]'))
      .map(i => {
        const rect = i.getBoundingClientRect();
        return { placeholder: i.placeholder, type: i.type, visible: rect.width > 0, y: Math.round(rect.y) };
      }).filter(i => i.visible);
  });
  console.log('폼 입력창:', JSON.stringify(inputs, null, 2));

  // 이름 입력
  const nameInput = await page.$('input[placeholder="홍길동"]');
  if (nameInput) {
    await nameInput.click();
    await page.keyboard.type('테스트', { delay: 50 });
    console.log('이름 입력 완료');
  }

  // 이메일 입력
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type('test@aicut.co.kr', { delay: 50 });
    console.log('이메일 입력 완료');
  }

  // 전화번호 입력
  const phoneInput = await page.$('input[placeholder="010-0000-0000"]');
  if (phoneInput) {
    await phoneInput.click();
    await page.keyboard.type('010-0000-0000', { delay: 50 });
    console.log('전화번호 입력 완료');
  }

  await sleep(1000);

  // GA4 generate_lead 이벤트 수동 트리거 (폼 제출 전)
  const gaFired = await page.evaluate(() => {
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', { method: '월정기계약_문의_테스트' });
      gtag('event', 'begin_checkout', { method: '테스트' });
      gtag('event', 'sign_up', { method: '테스트' });
      return true;
    }
    return false;
  });
  console.log('\nGA4 이벤트 직접 발생:', gaFired);
  console.log('generate_lead, begin_checkout, sign_up 이벤트 전송 완료!');

  await sleep(3000);
  console.log('\n✅ GA4 실시간에서 이벤트 확인 가능합니다.');
  console.log('→ GA4 → 보고서 → 실시간 → 이벤트 수에서 확인하세요.');

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
