// 에이컷 브랜드 포함 프롬프트 업데이트
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel').catch(() => {});
  await p.waitForTimeout(4000);

  const prompt = `Cinematic professional video of a Korean woman in her early 30s with natural makeup, neat business hairstyle, wearing a white silk blouse, standing in a bright modern office. On the desk next to her, a monitor screen clearly shows the website "aicut.co.kr" with AICUT logo displayed. A branded document with the text "AICUT 영상편집" is visible on the desk. She gestures toward the screen naturally and speaks to the camera confidently as if explaining the service. Soft natural lighting, warm color grading, shallow depth of field. Ultra-realistic, 4K quality, professional cinematography. Instagram Reels 9:16 vertical. AICUT brand integration.`;

  const ta = await p.$('textarea');
  if (ta) {
    await ta.evaluate((el, t) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      s.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      s.call(el, t);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, prompt);
    console.log('✅ 에이컷 브랜드 포함 프롬프트 업데이트!');
    console.log('');
    console.log('영상에 포함된 브랜딩:');
    console.log('  🖥️ 모니터에 aicut.co.kr 웹사이트');
    console.log('  🏢 AICUT 로고 표시');
    console.log('  📄 AICUT 영상편집 문서');
    console.log('  👩 여성이 화면 가리키며 설명하는 연출');
  }

  // Generate 클릭
  await p.evaluate(() => {
    const all = document.querySelectorAll('button, span, a, div');
    for (const el of all) {
      if (el.innerText && el.innerText.trim() === 'Generate') {
        el.click();
        return;
      }
    }
  });
  console.log('\n🎬 브랜드 포함 Generate 재실행!');
  console.log('브라우저에서 생성 결과 확인해보세요.');

  try { await b.close(); } catch (e) {}
})();
