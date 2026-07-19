const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== SE4 에디터 처음부터 다시 ===\n');

  // 1. 에디터 열기
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(3000);
  
  await page.evaluate(() => {
    const btn = document.querySelector('a[href*="Redirect=Write"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(5000);
  console.log('1. 에디터 열기 완료');

  // 2. SmartEditor iframe 찾기
  let editorFrame = null;
  for (const f of page.frames()) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
        editorFrame = f; break;
      }
    } catch(e) {}
  }
  if (!editorFrame) { console.log('❌ SmartEditor 없음'); return; }
  console.log('2. SmartEditor iframe 발견');

  // 3. 제목 설정
  await editorFrame.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
  });
  console.log('3. 제목 설정 완료');

  // 4. 본문 HTML 읽기
  const htmlContent = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
  const textOnly = htmlContent
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');
  
  // 5. 본문 입력 (writeTextWithSoftLineBreak)
  await editorFrame.evaluate((text) => {
    const ed = SmartEditor._editors['blogpc001'];
    ed._canvasScrollingService.focusToFirstComp();
    ed._editingService.writeTextWithSoftLineBreak(text);
  }, textOnly);
  await editorFrame.waitForTimeout(2000);
  console.log('4. 본문 입력 완료');

  // 6. 센터정렬 + 간격 조정
  const spacingResult = await editorFrame.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let sections = 0;

    paras.forEach(p => {
      const text = p.innerText.trim();
      
      // 센터정렬
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
      
      // 기본 간격
      p.style.marginBottom = '10px';
      p.style.marginTop = '4px';
      
      // 섹션 헤더 간격
      if (text.includes('코스') || text.includes('서울식물원') || text.includes('안국동') ||
          text.includes('여의도') || text.includes('송파') || text.includes('서교') ||
          text.includes('영상으로')) {
        p.style.marginTop = '28px';
        p.style.marginBottom = '14px';
        sections++;
      }
      
      // 정보 아이콘 라인
      if (text.match(/[📍🚇🕘💰🅿️🎯🍽️💡🎵]/)) {
        p.style.marginBottom = '5px';
        p.style.marginTop = '3px';
      }
      
      // 구분선
      if (text === '---') {
        p.style.marginTop = '35px';
        p.style.marginBottom = '35px';
      }
      
      // 해시태그
      if (text.startsWith('#')) {
        p.style.marginTop = '35px';
      }
      
      // CTA
      if (text.includes('@aicut.co.kr') || text.includes('pf.kakao') || text.includes('aicut.co.kr')) {
        p.style.marginTop = '8px';
        p.style.marginBottom = '4px';
      }
    });

    // SE4에 변경 알림
    const canvas = document.querySelector('.se-canvas');
    if (canvas) canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));

    return { total: paras.length, sections };
  });
  console.log(`5. 정렬/간격 조정 완료 — ${JSON.stringify(spacingResult)}`);

  // 7. 본문 길이 확인
  const textLen = await editorFrame.evaluate(() => {
    return SmartEditor._editors['blogpc001'].getContentText().length;
  });
  console.log(`6. 본문 길이: ${textLen}자`);

  // 8. 저장
  await editorFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') {
        btn.click();
        console.log('저장 클릭');
        return;
      }
    }
  });
  console.log('7. 저장 완료');

  // 9. 잠시 후 다시 에디터 열어서 저장 확인
  await page.waitForTimeout(3000);
  console.log('\n8. 저장 확인 중...');
  
  // 글쓰기 버튼 다시 클릭
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const btn = document.querySelector('a[href*="Redirect=Write"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(5000);

  // SmartEditor iframe 재확인
  let saved = false;
  for (const f of page.frames()) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
        const len = await f.evaluate(() => SmartEditor._editors['blogpc001'].getContentText().length);
        if (len > 0) { saved = true; console.log(`   ✅ 저장 확인됨! 본문 ${len}자`); }
        break;
      }
    } catch(e) {}
  }
  
  if (!saved) console.log('   ⚠️ 저장未확인, 직접 확인 필요');

  console.log('\n✅ 모든 작업 완료! 브라우저 확인 부탁드립니다.');
})();
