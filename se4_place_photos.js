const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];

  // 에디터 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    const url = p.url();
    if (url.includes('PostWriteForm') || url.includes('Redirect=Write')) { page = p; break; }
  }

  if (!page) {
    console.log('에디터 없음 — 저장된 글 수정 모드로 열기');
    page = await ctx.newPage();
    page.on('dialog', async d => d.dismiss());
    await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => { const b = document.querySelector('a[href*="Redirect=Write"]'); if(b) b.click(); });
    await page.waitForTimeout(5000);
  }

  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }

  console.log('✅ 에디터 발견\n');

  // 각 장소별 실제 이미지 캡처를 위한 새 페이지
  const capturePage = await ctx.newPage();
  await capturePage.setViewportSize({ width: 800, height: 600 });

  // 캡처할 장소 목록
  const places = [
    { name: '서울숲', query: '서울숲 잔디광장', section: '첫째' },
    { name: '코엑스', query: '코엑스 별마당도서관', section: '둘째' },
    { name: '북서울꿈의숲', query: '북서울꿈의숲 돔전망대', section: '셋째' },
    { name: '양재꽃시장', query: '양재꽃시장', section: '넷째' },
    { name: '석촌호수', query: '석촌호수 분수쇼', section: '다섯째' },
  ];

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const outFile = `aicut_place_${i + 1}.png`;
    const outPath = path.join(__dirname, outFile);

    console.log(`${i + 1}/${places.length} ${place.name} 이미지 캡처...`);

    // 네이버 이미지 검색에서 첫 번째 결과 캡처
    try {
      await capturePage.goto(
        `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(place.query)}`,
        { waitUntil: 'domcontentloaded', timeout: 15000 }
      );
      await capturePage.waitForTimeout(3000);

      // 첫 번째 이미지가 로딩될 때까지 기다렸다가 캡처
      await capturePage.evaluate(async () => {
        const imgs = document.querySelectorAll('img[src*="naver"]');
        for (const img of imgs) {
          if (img.complete && img.naturalWidth > 100) {
            img.scrollIntoView();
            break;
          }
        }
      });
      await capturePage.waitForTimeout(2000);
      await capturePage.screenshot({ path: outPath, clip: { x: 200, y: 100, width: 500, height: 400 } });
      console.log(`   ✅ ${outFile} 캡처 완료 (${Math.round(fs.statSync(outPath).size / 1024)}KB)`);
    } catch (e) {
      console.log(`   ❌ 캡처 실패: ${e.message}`);
      continue;
    }

    // SE4 에디터에 이미지 업로드
    const btns = await ef.$$('button');
    let photoBtn = null;
    for (const btn of btns) {
      const txt = await btn.innerText();
      if (txt.startsWith('사진\n')) {
        const box = await btn.boundingBox();
        if (box && box.x > 0) { photoBtn = btn; break; }
      }
    }

    if (!photoBtn) { console.log('   사진 버튼 없음, 건너뜀'); continue; }

    try {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        photoBtn.click()
      ]);
      await fc.setFiles([outPath]);
      console.log(`   ✅ ${outFile} SE4 업로드 완료`);
      await page.waitForTimeout(5000);
    } catch (e) {
      console.log(`   ❌ 업로드 실패: ${e.message}`);
    }
  }

  await capturePage.close();

  // 저장
  console.log('\n저장...');
  await ef.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });
  await page.waitForTimeout(5000);

  console.log('\n✅ 장소 실제 이미지 5장 추가 완료!');
  console.log('브라우저 확인해주세요.');
})();
