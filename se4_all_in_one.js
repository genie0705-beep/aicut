const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== 포스팅 전체 자동화 시작 ===\n');

  // 1. 에디터 열기
  console.log('1. 에디터 열기...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => { const btn = document.querySelector('a[href*="Redirect=Write"]'); if (btn) btn.click(); });
  await page.waitForTimeout(5000);

  // 2. SE4 iframe 찾기
  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }
  console.log('2. SmartEditor 발견');

  // 3. 제목 설정 (setDocumentTitle만 호출, getTitle 안 함)
  await ef.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
  });
  console.log('3. 제목 설정 완료');

  // 4. 본문 입력
  console.log('4. 본문 입력 중...');
  const html = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
  const text = html.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
  
  await ef.evaluate((t) => {
    const ed = SmartEditor._editors['blogpc001'];
    ed._canvasScrollingService.focusToFirstComp();
    ed._editingService.writeTextWithSoftLineBreak(t);
  }, text);
  await ef.waitForTimeout(1500);
  console.log('   본문 입력 완료');

  // 5. 정렬 + 간격
  console.log('5. 정렬 및 간격 조정...');
  await ef.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let h3count = 0;
    paras.forEach(p => {
      const t = p.innerText.trim();
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
      p.style.marginBottom = '10px';
      p.style.marginTop = '4px';
      
      // 섹션 헤더
      if (t.includes('코스') || t.includes('서울식물원') || t.includes('안국동') || t.includes('여의도') || t.includes('송파') || t.includes('서교') || t.includes('영상으로') || t.includes('첫 번째') || t.includes('두 번째') || t.includes('세 번째') || t.includes('네 번째') || t.includes('다섯 번째')) {
        p.style.marginTop = '28px';
        p.style.marginBottom = '14px';
        h3count++;
      }
      if (t.match(/[📍🚇🕘💰🅿️🎯🍽️💡🎵]/)) { p.style.marginBottom = '5px'; p.style.marginTop = '3px'; }
      if (t === '---') { p.style.marginTop = '35px'; p.style.marginBottom = '35px'; }
      if (t.startsWith('#')) { p.style.marginTop = '35px'; }
      if (t.includes('@aicut.co.kr') || t.includes('pf.kakao') || t.includes('aicut.co.kr')) { p.style.marginTop = '8px'; p.style.marginBottom = '4px'; }
    });
    const canvas = document.querySelector('.se-canvas');
    if (canvas) canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return { total: paras.length, sections: h3count };
  });
  console.log('   정렬/간격 완료');

  // 6. 이미지 업로드
  console.log('\n6. 이미지 업로드 (5장)...');
  const images = ['aicut_blog_main.png', 'aicut_blog_card1.png', 'aicut_blog_card2.png', 'aicut_blog_card3.png', 'aicut_blog_cta.png'];
  
  for (let i = 0; i < images.length; i++) {
    const imgPath = path.join(__dirname, images[i]);
    console.log(`   ${i+1}/${images.length} ${images[i]}...`);

    const btn = await ef.$('button:has-text("사진")');
    if (!btn) { console.log('      사진 버튼 없음'); continue; }

    try {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }),
        btn.click()
      ]);
      await fc.setFiles([imgPath]);
      console.log('      ✅ 업로드 완료');
      await page.waitForTimeout(5000);
    } catch(e) {
      console.log(`      ❌ ${e.message}`);
    }
  }

  // 7. 저장
  console.log('\n7. 저장...');
  await ef.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) { if (btn.innerText.trim() === '저장') { btn.click(); break; } }
  });

  console.log('\n✅✅✅ 모든 작업 완료!');
  console.log('브라우저 확인 후 발행 버튼만 누르시면 됩니다.');
})();
