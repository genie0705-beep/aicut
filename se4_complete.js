const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('========== 블로그 포스팅 전체 자동화 ==========\n');

  // 1. 에디터 열기
  console.log('1/6. 에디터 열기...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => { const b = document.querySelector('a[href*="Redirect=Write"]'); if (b) b.click(); });
  await page.waitForTimeout(5000);

  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }
  console.log('   ✅ SmartEditor 발견');

  // 2. 제목
  console.log('2/6. 제목 설정...');
  await ef.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
  });
  console.log('   ✅ 제목 설정 완료');

  // 3. 본문 입력 (writeTextWithSoftLineBreak)
  console.log('3/6. 본문 입력...');
  const html = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
  const text = html.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
  
  await ef.evaluate((t) => {
    const ed = SmartEditor._editors['blogpc001'];
    // 먼저 writeTextWithSoftLineBreak로 텍스트 입력
    ed._canvasScrollingService.focusToFirstComp();
    ed._editingService.writeTextWithSoftLineBreak(t);
  }, text);
  await ef.waitForTimeout(2000);
  console.log('   ✅ 본문 입력 완료');

  // 4. 정렬 + 간격 + H태그 변환 (한 번에 처리)
  console.log('4/6. 정렬/간격/H태그 적용...');
  
  await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    
    // 한 번의 setDocumentData 호출로 모든 블록 타입 설정
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    let h2c = 0, h3c = 0;
    
    blocks.forEach((b, idx) => {
      if (!b || !b.text) return;
      const t = b.text.trim();
      
      // 코스 제목 → heading2
      if (t.match(/^(첫 번째|두 번째|세 번째|네 번째|다섯 번째)\s*코스/)) {
        blocks[idx].type = 'heading2';
        h2c++;
      }
      // 장소명 → heading3
      else if (t.match(/^(서울식물원|안국동·북촌|여의도 한강|송파문화예술|서교음악창작소)/)) {
        blocks[idx].type = 'heading3';
        h3c++;
      }
      // 영상 섹션 → heading2
      else if (t.includes('영상으로 남겨보세요') || t.includes('오늘의 즐거운 순간')) {
        blocks[idx].type = 'heading2';
        h2c++;
      }
    });
    
    data.document.blocks = blocks;
    ed.setDocumentData(data);
    
    // Canvas DOM 직접 업데이트 (H 태그 반영)
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      canvas.innerHTML = blocks.map(b => {
        const tag = b.type === 'heading2' ? 'h2' : b.type === 'heading3' ? 'h3' : 'p';
        return `<${tag} style="text-align:center">${b.text}</${tag}>`;
      }).join('');
    }
    
    // CSS 간격 적용
    setTimeout(() => {
      const allEls = document.querySelectorAll('.se-canvas h2, .se-canvas h3, .se-canvas p, .se-canvas .se-text-paragraph');
      allEls.forEach(el => {
        const t = el.innerText.trim();
        el.style.textAlign = 'center';
        el.style.marginBottom = '10px';
        el.style.marginTop = '4px';
        
        if (el.tagName === 'H2' || el.tagName === 'H3') {
          el.style.marginTop = '28px';
          el.style.marginBottom = '14px';
        }
        if (t.match(/[📍🚇🕘💰🅿️🎯🍽️💡🎵]/)) { el.style.marginBottom = '5px'; el.style.marginTop = '3px'; }
        if (t === '---') { el.style.marginTop = '35px'; el.style.marginBottom = '35px'; }
        if (t.startsWith('#')) { el.style.marginTop = '35px'; }
        if (t.includes('@aicut.co.kr') || t.includes('pf.kakao') || t.includes('aicut.co.kr')) { el.style.marginTop = '8px'; el.style.marginBottom = '4px'; }
      });
      
      const cv = document.querySelector('.se-canvas');
      if (cv) cv.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }, 500);
    
    return { h2: h2c, h3: h3c, total: blocks.length };
  });
  
  await ef.waitForTimeout(2000);
  console.log('   ✅ 정렬/간격/H태그 적용 완료');

  // 5. 이미지 업로드 (5장)
  console.log('5/6. 이미지 업로드...');
  const images = ['aicut_blog_main.png', 'aicut_blog_card1.png', 'aicut_blog_card2.png', 'aicut_blog_card3.png', 'aicut_blog_cta.png'];
  let uploaded = 0;

  for (let i = 0; i < images.length; i++) {
    const imgFile = images[i];
    const imgPath = path.join(__dirname, imgFile);

    // 사진 버튼 찾기 (visible 버튼)
    const btns = await ef.$$('button');
    let photoBtn = null;
    for (const btn of btns) {
      const text = await btn.innerText();
      if (text.startsWith('사진\n') || text === '사진') {
        const box = await btn.boundingBox();
        if (box && box.x > 0) { photoBtn = btn; break; }
      }
    }

    if (!photoBtn) { console.log(`   ${i+1}. 사진 버튼 없음`); continue; }

    try {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        photoBtn.click()
      ]);
      await fc.setFiles([imgPath]);
      console.log(`   ${i+1}/5 ✅ ${imgFile}`);
      uploaded++;
      await page.waitForTimeout(6000);
    } catch(e) {
      console.log(`   ${i+1}/5 ❌ ${imgFile}: ${e.message}`);
    }
  }
  console.log(`   총 ${uploaded}/5장 업로드 완료`);

  // 6. 저장
  console.log('\n6/6. 저장 중...');
  await ef.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  // 저장 완료 대기
  console.log('   저장 완료 대기 중...');
  await page.waitForTimeout(15000);

  // 저장 확인 (새 탭에서 열기)
  console.log('\n=== 저장 확인 ===');
  const confirmPage = await ctx.newPage();
  await confirmPage.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await confirmPage.waitForTimeout(3000);
  
  const confirmText = await confirmPage.evaluate(() => {
    const posts = document.querySelectorAll('.post-list .cont a, .blog-list a, [class*="post"] a');
    const urls = [];
    posts.forEach(a => {
      if (a.href && a.href.includes('logNo=')) urls.push({ text: a.innerText.trim().substring(0, 60), href: a.href.substring(0, 80) });
    });
    return urls.slice(0, 3);
  });
  
  if (confirmText.length > 0) {
    console.log(`✅ 저장된 글 확인됨:`);
    confirmText.forEach(p => console.log(`   - ${p.text}`));
  } else {
    console.log('⚠️ 저장 확인 실패 — 브라우저에서 직접 확인해주세요');
  }

  await confirmPage.close();

  console.log('\n========== 전체 완료 ==========');
  console.log('브라우저 확인 후 발행 부탁드립니다!');
})();
