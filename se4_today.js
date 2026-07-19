const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== 전체 자동화 시작 ===\n');

  // 1. 에디터 열기
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => { const b = document.querySelector('a[href*="Redirect=Write"]'); if(b) b.click(); });
  await page.waitForTimeout(5000);

  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }
  console.log('1. ✅ 에디터 열림');

  // 2. 제목
  await ef.evaluate(() => { SmartEditor._editors['blogpc001'].setDocumentTitle('7월 마지막 주, 날씨별 서울 주말 나들이 BEST 5'); });
  console.log('2. ✅ 제목 설정');

  // 3. 본문 입력
  const html = fs.readFileSync(path.join(__dirname, 'blog_content_20260718.html'), 'utf-8');
  const text = html.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
  await ef.evaluate((t) => {
    const ed = SmartEditor._editors['blogpc001'];
    ed._canvasScrollingService.focusToFirstComp();
    ed._editingService.writeTextWithSoftLineBreak(t);
  }, text);
  await ef.waitForTimeout(2000);
  console.log('3. ✅ 본문 입력');

  // 4. H태그 + 정렬 + 간격
  await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    let h2c = 0, h3c = 0;

    blocks.forEach((b, idx) => {
      if (!b || !b.text) return;
      const t = b.text.trim();
      if (t.match(/^(첫째|둘째|셋째|넷째|다섯째)/)) { blocks[idx].type = 'heading2'; h2c++; }
      else if (t.match(/^(서울숲|코엑스|북서울|양재천|잠실)/)) { blocks[idx].type = 'heading3'; h3c++; }
      else if (t.includes('영상으로 기록')) { blocks[idx].type = 'heading2'; h2c++; }
    });
    data.document.blocks = blocks;
    ed.setDocumentData(data);

    // Canvas 업데이트
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      canvas.innerHTML = blocks.map(b => {
        const tag = b.type === 'heading2' ? 'h2' : b.type === 'heading3' ? 'h3' : 'p';
        return `<${tag} style="text-align:center">${b.text}</${tag}>`;
      }).join('');
    }

    // 간격
    setTimeout(() => {
      const all = document.querySelectorAll('.se-canvas h2, .se-canvas h3, .se-canvas p');
      all.forEach(el => {
        const t = el.innerText.trim();
        el.style.textAlign = 'center';
        el.style.marginBottom = '10px'; el.style.marginTop = '4px';
        if (el.tagName === 'H2' || el.tagName === 'H3') { el.style.marginTop = '28px'; el.style.marginBottom = '14px'; }
        if (t.match(/[📍🚇🕘💰🅿️📞🎯]/)) { el.style.marginBottom = '5px'; el.style.marginTop = '3px'; }
        if (t === '---') { el.style.marginTop = '30px'; el.style.marginBottom = '30px'; }
        if (t.startsWith('#')) { el.style.marginTop = '30px'; }
        if (t.includes('@aicut') || t.includes('pf.kakao') || t.includes('aicut.co.kr')) { el.style.marginTop = '6px'; el.style.marginBottom = '3px'; }
      });
      const cv = document.querySelector('.se-canvas');
      if (cv) cv.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }, 500);
  });
  await ef.waitForTimeout(2000);
  console.log('4. ✅ H태그+정렬+간격 적용');

  // 5. 이미지 업로드
  console.log('5. 이미지 업로드...');
  const images = ['aicut_blog_main.png', 'aicut_blog_card1.png', 'aicut_blog_card2.png', 'aicut_blog_card3.png', 'aicut_blog_cta.png'];
  for (let i = 0; i < images.length; i++) {
    const imgPath = path.join(__dirname, images[i]);
    const btns = await ef.$$('button');
    let photoBtn = null;
    for (const btn of btns) {
      const txt = await btn.innerText();
      if (txt.startsWith('사진\n')) { const box = await btn.boundingBox(); if (box && box.x > 0) { photoBtn = btn; break; } }
    }
    if (!photoBtn) { console.log(`   ${i+1}. 사진 버튼 없음`); continue; }
    try {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        photoBtn.click()
      ]);
      await fc.setFiles([imgPath]);
      console.log(`   ${i+1}/5 ✅ ${images[i]}`);
      await page.waitForTimeout(5000);
    } catch(e) { console.log(`   ${i+1}/5 ❌ ${e.message}`); }
  }

  // 6. 저장
  console.log('\n6. 저장...');
  await ef.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });
  console.log('   저장 요청 완료 (10초 대기)');
  await page.waitForTimeout(10000);

  console.log('\n✅✅✅ 전체 완료!');
  console.log('브라우저(마지막 탭) 확인해주세요!');
})();
