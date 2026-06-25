const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // 힉스필드 탭 찾기
  let p = null;
  for (const page of ctx.pages()) {
    if (page.url().includes('higgsfield')) { p = page; break; }
  }
  if (!p) {
    p = await ctx.newPage();
    await p.goto('https://higgsfield.ai/sora-trends/instagram-reel', {
      waitUntil: 'domcontentloaded', timeout: 20000
    }).catch(() => {});
  }
  await p.bringToFront();
  await p.waitForTimeout(4000);

  console.log('=== 현재 페이지 ===');
  console.log('URL:', p.url().substring(0, 100));
  
  const pageInfo = await p.evaluate(() => {
    const body = document.body.innerText.substring(0, 2000);
    // 입력 필드 찾기
    const inputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
    const inputInfo = Array.from(inputs).slice(0, 5).map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type') || '',
      placeholder: (el.getAttribute('placeholder') || '').substring(0, 40),
      id: el.id,
      visible: el.offsetParent !== null,
      valueLen: (el.value || el.innerText || '').length
    }));
    
    // 버튼 찾기
    const buttons = document.querySelectorAll('button, a, [role="button"]');
    const btnTexts = Array.from(buttons).slice(0, 15).map(b => (b.innerText || '').trim()).filter(t => t.length > 0 && t.length < 30);
    
    return { bodyPreview: body.substring(0, 800), inputInfo, btnTexts };
  });
  
  console.log('본문:', pageInfo.bodyPreview);
  console.log('\n입력창:', JSON.stringify(pageInfo.inputInfo, null, 2));
  console.log('\n버튼:', pageInfo.btnTexts.slice(0, 10));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
