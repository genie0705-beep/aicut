const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  let p = null;
  for (const page of ctx.pages()) {
    if (page.url().includes('higgsfield')) { p = page; break; }
  }
  if (!p) { console.log('no tab'); await b.close(); return; }
  await p.bringToFront();
  await p.waitForTimeout(2000);

  // 기존 프롬프트 약간 업데이트 (AICUT 연계)
  const updatedPrompt = `Cinematic close-up shot of a professional Korean woman in her early 30s with natural dewy makeup, neatly styled dark brown hair, wearing a crisp white silk blouse. She is seated in a softly lit modern office space. On the desk next to her, a monitor displays a sleek website with the text "AICUT" visible. She looks at the camera with confident warm eye contact, gesturing naturally toward the screen as if explaining the service. The background has soft blurred office elements with shallow depth of field. Lighting is soft natural window light from the left with warm color tones. Skin texture is realistic with natural details. Cinematic color grading. Ultra realistic, 4K resolution, professional film look. Instagram Reels 9:16 vertical aspect ratio.`;

  // 텍스트에리어에 프롬프트 업데이트
  await p.evaluate((prompt) => {
    const ta = document.querySelector('textarea');
    if (ta) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(ta, '');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      nativeSetter.call(ta, prompt);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, updatedPrompt);
  
  await p.waitForTimeout(1000);
  console.log('✅ 프롬프트 업데이트 완료');
  
  // Check the current length
  const contentLen = await p.evaluate(() => {
    const ta = document.querySelector('textarea');
    return ta ? ta.value.length : 0;
  });
  console.log('프롬프트 길이:', contentLen, '자');

  // "29를 생성하세요" 버튼 클릭
  const clicked = await p.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.innerText.trim();
      if (text.includes('생성하세요') || text === 'Generate' || text.includes('Create')) {
        btn.click();
        return 'clicked: ' + text;
      }
    }
    return 'no generate button found';
  });
  
  console.log('생성 버튼:', clicked);
  
  await p.waitForTimeout(3000);
  
  // 생성 상태 확인
  const status = await p.evaluate(() => {
    const body = document.body.innerText;
    // Check for progress/loading indicators
    if (body.includes('생성 중') || body.includes('Generating') || body.includes('Processing')) {
      return '⏳ 생성 중...';
    }
    if (body.includes('완료') || body.includes('Done') || body.includes('Complete')) {
      return '✅ 생성 완료!';
    }
    return body.substring(body.length - 300, body.length);
  });
  
  console.log('생성 상태:', status.substring(0, 200));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
