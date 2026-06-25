// 힉스필드 - 전문가 퀄리티 설정
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel').catch(() => {});
  await p.waitForTimeout(4000);

  // 1) Visuals & Sound 클릭
  const allEls1 = await p.$$('button, a, span, div');
  for (const el of allEls1) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'Visuals & Sound') {
      await el.click({ force: true });
      await p.waitForTimeout(1000);
      console.log('✅ Visuals & Sound 열림');
      break;
    }
  }

  // 2) Realistic 스타일 선택 (최고 퀄리티)
  const allEls2 = await p.$$('button, a, span, div');
  for (const el of allEls2) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'Realistic') {
      const vis = await el.isVisible().catch(() => false);
      if (vis) {
        await el.click({ force: true });
        console.log('✅ Style: Realistic 선택');
        await p.waitForTimeout(500);
        break;
      }
    }
  }

  // 3) Craziness: Low (전문적인 톤)
  for (const el of await p.$$('button, a, span, div')) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'Low' || txt === '낮음') {
      const vis = await el.isVisible().catch(() => false);
      if (vis) {
        await el.click({ force: true });
        console.log('✅ Craziness: Low');
        await p.waitForTimeout(500);
        break;
      }
    }
  }

  // 4) Montage: No Cuts or Slow Paced (전문적인 편집)
  for (const el of await p.$$('button, a, span, div')) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'Slow Paced') {
      const vis = await el.isVisible().catch(() => false);
      if (vis) {
        await el.click({ force: true });
        console.log('✅ Montage: Slow Paced (전문적인 템포)');
        await p.waitForTimeout(500);
        break;
      }
    }
  }

  // 5) Sound 탭 확인
  for (const el of await p.$$('button, a, span, div')) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'Sound') {
      await el.click({ force: true });
      await p.waitForTimeout(1000);
      console.log('✅ Sound 탭 열림');
      break;
    }
  }

  // Sound 설정 확인
  const soundPanel = await p.evaluate(() => {
    const all = document.querySelectorAll('button, span, div');
    const results = [];
    for (const el of all) {
      const txt = (el.innerText || '').trim();
      if (txt && txt.length < 40 && (
        txt.includes('Voice') || txt.includes('Music') || txt.includes('Volume') ||
        txt.includes('Auto') || txt.includes('Korean') || txt.includes('Background')
      )) {
        results.push(txt);
      }
    }
    return [...new Set(results)].slice(0, 20);
  }).catch(() => []);

  console.log('Sound 옵션:', soundPanel);

  // 6) Save Settings 클릭
  for (const el of await p.$$('button, a, span, div')) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'Save Settings') {
      await el.click({ force: true });
      console.log('✅ 설정 저장');
      await p.waitForTimeout(500);
      break;
    }
  }

  // 7) 프롬프트 업데이트 (프로페셔널 퀄리티 강조)
  const proPrompt = 'Cinematic professional video of a Korean woman in her early 30s with natural makeup, neat business hairstyle, wearing a white silk blouse, standing in a high-end real estate office with floor-to-ceiling windows showing panoramic city view. She speaks to the camera naturally with confident hand gestures. Soft natural lighting, warm color grading, shallow depth of field, bokeh background. Ultra-realistic, 4K quality, professional cinematography, film-like texture. Instagram Reels 9:16 vertical.';

  const ta = await p.$('textarea');
  if (ta) {
    await ta.evaluate((el, t) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      setter.call(el, t);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, proPrompt);
    console.log('✅ 시네마틱 프롬프트 입력 (프로페셔널 퀄리티)');
  }

  console.log('\n🎬 전문가 퀄리티 설정 완료!');
  console.log('설정 내역:');
  console.log('  Style: Realistic');
  console.log('  Craziness: Low (전문적인 분위기)');
  console.log('  Montage: Slow Paced (차분한 편집)');
  console.log('  프롬프트: 시네마틱 + 4K + 필름 질감');

  try { await b.close(); } catch (e) {}
})();
