// 힉스필드 영상 다운로드
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  if (!p) { console.log('힉스필드 탭 없음'); process.exit(1); }

  // 현재 힉스필드 페이지 상태 확인
  await p.bringToFront();
  await p.waitForTimeout(2000);
  console.log('URL:', p.url());

  // 다운로드 버튼 찾기 또는 영상 요소 확인
  const body = await p.evaluate(() => document.body.innerText.substring(0, 2000)).catch(() => '');
  console.log('페이지 상태:', body);

  // 다운로드 버튼/링크 찾기
  const btns = await p.$$('button, a, span, div');
  for (const btn of btns) {
    const txt = await btn.innerText().catch(() => '');
    if (txt.includes('Download') || txt.includes('download') || txt.includes('다운로드')) {
      console.log('다운로드 버튼:', txt.trim());
    }
  }

  // video 태그 찾기
  const videos = await p.$$('video');
  console.log(`video 태그: ${videos.length}개`);
  if (videos.length > 0) {
    const src = await videos[0].getAttribute('src').catch(() => '');
    console.log('video src:', src?.substring(0, 100));
  }

  try { await b.close(); } catch (e) {}
})();
