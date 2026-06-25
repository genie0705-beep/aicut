const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  const POST_TEXT = `병원 마케팅, 릴스로 시작하세요 🏥

성형외과·치과·피부과, 릴스 하나로 예약 문의가 달라집니다.

✔ 원장님이 촬영만 하면 편집은 끝
✔ 의료법 저촉 없는 검수 완료
✔ 주 3회, 월 12편 정기 납품 가능

영상 편집 때문에 고민이라면?
에이컷이 해결합니다 🤝

#병원마케팅 #성형외과마케팅 #치과마케팅 #영상편집 #숏폼마케팅 #에이컷`;

  await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // Click the composer area
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label*="텍스트"]');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Now check what appeared
  const afterClick = await page.evaluate(() => {
    const r = [];
    document.querySelectorAll('[contenteditable]').forEach(el => {
      r.push({
        tag: el.tagName,
        text: (el.innerText || '').substring(0, 30),
        placeholder: el.getAttribute('aria-placeholder') || ''
      });
    });
    document.querySelectorAll('[role="textbox"]').forEach(el => {
      r.push({
        tag: el.tagName,
        text: (el.innerText || '').substring(0, 30)
      });
    });
    return r;
  });
  console.log('After click:', JSON.stringify(afterClick));

  if (afterClick.length === 0) {
    console.log('No editable area found after click, trying to type at the clicked element');
    // Just use press sequentially
  }

  // Type at focused element
  await page.keyboard.type(POST_TEXT, { delay: 10 });
  await new Promise(r => setTimeout(r, 1000));

  // Click 게시
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const postBtn = btns.find(b => b.innerText?.trim() === '게시');
    if (postBtn) postBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  console.log('✅ 게시 완료');

  await b.close();
})().catch(e => console.log('ERR:', e.message));
