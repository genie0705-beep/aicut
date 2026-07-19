const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];

  // 에디터 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm') || p.url().includes('Redirect=Write')) { page = p; break; }
  }
  if (!page) { console.log('에디터 없음'); return; }

  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('SmartEditor 없음'); return; }
  console.log('✅ 에디터 발견\n');

  // 지도 캡처용 페이지
  const mapPage = await ctx.newPage();
  await mapPage.setViewportSize({ width: 600, height: 450 });

  const places = [
    { name: '서울숲', query: '서울숲' },
    { name: '코엑스', query: '코엑스몰' },
    { name: '북서울꿈의숲', query: '북서울꿈의숲' },
    { name: '양재꽃시장', query: '양재꽃시장' },
    { name: '석촌호수', query: '석촌호수' },
  ];

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const outFile = `aicut_map_${i + 1}.png`;
    const outPath = path.join(__dirname, outFile);

    console.log(`${i + 1}/${places.length} ${p.name} 지도 캡처...`);

    try {
      // 네이버 지도 열기
      await mapPage.goto(
        `https://map.naver.com/v5/search/${encodeURIComponent(p.query)}`,
        { waitUntil: 'domcontentloaded', timeout: 15000 }
      );
      await mapPage.waitForTimeout(5000);

      // 지도 영역 스크린샷
      await mapPage.screenshot({
        path: outPath,
        clip: { x: 0, y: 0, width: 600, height: 450 }
      });
      console.log(`   ✅ ${outFile} 캡처 (${Math.round(fs.statSync(outPath).size / 1024)}KB)`);

      // SE4에 업로드
      const btns = await ef.$$('button');
      let photoBtn = null;
      for (const btn of btns) {
        const txt = await btn.innerText();
        if (txt.startsWith('사진\n')) {
          const box = await btn.boundingBox();
          if (box && box.x > 0) { photoBtn = btn; break; }
        }
      }

      if (!photoBtn) { console.log('   사진 버튼 없음'); continue; }

      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        photoBtn.click()
      ]);
      await fc.setFiles([outPath]);
      console.log(`   ✅ SE4 업로드 완료`);
      await page.waitForTimeout(5000);

    } catch (e) {
      console.log(`   ❌ 실패: ${e.message}`);
    }
  }

  await mapPage.close();

  // 저장
  console.log('\n저장...');
  await ef.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });
  await page.waitForTimeout(5000);

  console.log('\n✅ 지도 이미지 5장 추가 완료!');
  console.log('브라우저 확인해주세요.');
})();
