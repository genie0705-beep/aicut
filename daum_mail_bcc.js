const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 다음메일 탭으로 이동
  const mailPage = ctx.pages().find(x => x.url().includes('mail.daum'));
  if (!mailPage) { console.log('no mail tab'); return; }
  
  await mailPage.bringToFront();
  await mailPage.waitForTimeout(2000);
  
  // 메일쓰기 페이지인지 확인
  const info = await mailPage.evaluate(() => ({
    url: window.location.href.substring(0, 100),
    title: document.title,
    textLen: document.body.innerText.length
  }));
  console.log('Mail page:', JSON.stringify(info));
  
  // Bcc(숨은참조) 필드 찾기
  const bccResult = await mailPage.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"], input[name], textarea');
    const results = [];
    inputs.forEach((el, i) => {
      results.push({
        idx: i,
        name: el.name || '',
        id: el.id || '',
        className: el.className.substring(0, 30),
        placeholder: el.placeholder || '',
        value: (el.value || '').substring(0, 30)
      });
    });
    return results;
  });
  console.log('Form fields:', JSON.stringify(bccResult, null, 2));
  
  // 숨은참조 영역 찾기
  const bodyText = await mailPage.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('Page text:', bodyText.replace(/\n/g, ' ').trim().substring(0, 300));
})();
