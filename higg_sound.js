// 힉스필드 음성/사운드 옵션 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('higgsfield')) { p = pg; break; }
  }
  if (!p) { console.log('힉스필드 탭 없음'); process.exit(1); }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await p.waitForTimeout(4000);

  // Visuals & Sound 버튼 찾아서 클릭
  const allEls = await p.$$('button, a, span, div');
  for (const el of allEls) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'Visuals & Sound') {
      const vis = await el.isVisible().catch(() => false);
      if (vis) {
        console.log('→ Visuals & Sound 클릭');
        await el.click({ force: true });
        await p.waitForTimeout(2000);
        break;
      }
    }
  }

  // 패널 내용 확인
  const body = await p.evaluate(() => document.body.innerText.substring(0, 2500)).catch(() => '');
  console.log('패널 내용:', body);

  // Voice / Language / Audio 관련 텍스트 확인
  const fullText = await p.evaluate(() => document.body.innerText).catch(() => '');
  const voiceIdx = fullText.indexOf('Voice');
  const audioIdx = fullText.indexOf('Audio');
  const langIdx = fullText.indexOf('Language');
  const koreanIdx = fullText.indexOf('Korean');

  if (voiceIdx >= 0) console.log('\nVoice 근처:', fullText.substring(voiceIdx, voiceIdx + 200));
  if (audioIdx >= 0) console.log('Audio 근처:', fullText.substring(audioIdx, audioIdx + 200));
  if (langIdx >= 0) console.log('Language 근처:', fullText.substring(langIdx, langIdx + 200));
  if (koreanIdx >= 0) console.log('Korean 근처:', fullText.substring(koreanIdx, koreanIdx + 200));

  try { await b.close(); } catch(e) {}
})();
