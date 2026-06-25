// 힉스필드 영상 다운로드 + Vrew에서 오디오 처리
const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

const VIDEO_URL = 'https://cdn.higgsfield.ai/kling_motion/bf40cb6a-4b82-4915-86aa-e3ef4aeaf318.mp4';
const VIDEO_PATH = 'C:\\Users\\paul\\.openclaw\\workspace\\higg_reels.mp4';

(async () => {
  // 1) 영상 다운로드
  console.log('1. 영상 다운로드 중...');
  const file = fs.createWriteStream(VIDEO_PATH);
  await new Promise((resolve, reject) => {
    https.get(VIDEO_URL, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
  const size = fs.statSync(VIDEO_PATH).size;
  console.log(`   ✅ 다운로드 완료! (${(size/1024/1024).toFixed(1)}MB)`);

  // 2) Vrew 탭 찾기
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let vrewTab = null;
  for (const p of ctx.pages()) {
    const url = p.url();
    if (url.includes('vrew') || url.includes('vrew.video')) {
      vrewTab = p;
      console.log('2. Vrew 탭 발견:', url.substring(0, 80));
      break;
    }
  }

  if (vrewTab) {
    await vrewTab.bringToFront();
    await vrewTab.waitForTimeout(2000);
    const body = await vrewTab.evaluate(() => document.body.innerText.substring(0, 800)).catch(() => '');
    console.log('Vrew 상태:', body);

    // 새 프로젝트 만들기 또는 영상 불러오기
    const allBtns = await vrewTab.$$('button, a, span, div');
    for (const btn of allBtns) {
      const txt = await btn.innerText().catch(() => '');
      if (txt.includes('새 영상') || txt.includes('New') || txt.includes('가져오기') || txt.includes('Import') || txt.includes('프로젝트')) {
        console.log('Vrew 버튼:', txt.trim().substring(0, 30));
      }
    }
  } else {
    console.log('2. Vrew 탭 없음 - 브라우저 탭 목록:');
    for (const p of ctx.pages()) {
      const u = p.url();
      if (u.includes('vrew') || u.includes('vrew.video')) console.log('   ', u.substring(0, 80));
    }
    
    // Vrew 사이트로 이동
    console.log('3. Vrew 접속 시도');
    const np = await ctx.newPage();
    await np.goto('https://vrew.video', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await np.waitForTimeout(3000);
    console.log('Vrew URL:', np.url());
    const body = await np.evaluate(() => document.body.innerText.substring(0, 500)).catch(() => '');
    console.log('Vrew:', body);
  }

  try { await b.close(); } catch(e) {}
  console.log('\n✅ 완료!');
})();
