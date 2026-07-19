const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];

  // 블로그 포스트 목록 열기
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('1. 저장된 글 확인...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(3000);

  // 가장 최근 글의 상세 페이지로 이동해서 수정 링크 찾기
  const posts = await page.evaluate(() => {
    const items = document.querySelectorAll('.post-list .cont, .blog-list .cont, [class*="post"]');
    const result = [];
    items.forEach((item, i) => {
      const links = item.querySelectorAll('a');
      links.forEach(a => {
        const href = a.href || '';
        if (href.includes('logNo=')) {
          result.push({ index: i, text: a.innerText.trim().substring(0, 50), href });
        }
      });
    });
    return result.slice(0, 5);
  });

  console.log(`   게시물: ${JSON.stringify(posts)}`);

  // Redirect=Write로 에디터 열기 (수정 모드가 아닌 새 글, 저장된 글이 있으면 자동 로드?)
  // 사실 저장 후 Redirect=Write는 새 글쓰기입니다.
  // 저장된 글을 수정하려면 해당 글의 수정 링크를 찾아야 함
  // "저장된 글이 없으면" 다시 처음부터 시작해야 함
  
  // 일단 Redirect=Write로 에디터 열기
  await page.evaluate(() => {
    const btn = document.querySelector('a[href*="Redirect=Write"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(5000);
  console.log(`   에디터 URL: ${page.url()}`);

  // iframe 찾기
  let editorFrame = null;
  for (const f of page.frames()) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
        editorFrame = f;
        break;
      }
    } catch(e) {}
  }

  if (!editorFrame) {
    console.log('❌ SmartEditor 없음');
    return;
  }

  // 현재 내용 확인
  const contentCheck = await editorFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const len = ed.getContentText().length;
    const title = ed.getTitle();
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    return { title, textLength: len, paraCount: paras };
  });
  console.log(`   에디터 상태: ${JSON.stringify(contentCheck)}`);

  if (contentCheck.textLength === 0) {
    console.log('⚠️ 저장된 글이 없습니다. 새 글을 처음부터 작성해야 합니다.');
    
    // 여기서 본문 재입력 (이전 코드 재사용)
    const fs = require('fs');
    const htmlContent = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
    const textOnly = htmlContent
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .join('\n');

    await editorFrame.evaluate((text) => {
      const ed = SmartEditor._editors['blogpc001'];
      ed._canvasScrollingService.focusToFirstComp();
      ed._editingService.writeTextWithSoftLineBreak(text);
    }, textOnly);
    await editorFrame.waitForTimeout(2000);

    // 정렬+간격
    await editorFrame.evaluate(() => {
      const paras = document.querySelectorAll('.se-text-paragraph');
      paras.forEach(p => {
        p.classList.add('se-text-paragraph-align-center');
        p.style.textAlign = 'center';
        p.style.marginBottom = '10px';
        p.style.marginTop = '4px';
        const t = p.innerText.trim();
        if (t.includes('코스') || t.includes('서울식물원') || t.includes('안국동') || t.includes('여의도') || t.includes('송파') || t.includes('서교') || t.includes('영상으로')) { p.style.marginTop = '28px'; p.style.marginBottom = '14px'; }
        if (t.match(/[📍🚇🕘💰🅿️🎯🍽️💡🎵]/)) { p.style.marginBottom = '5px'; p.style.marginTop = '3px'; }
        if (t === '---') { p.style.marginTop = '35px'; p.style.marginBottom = '35px'; }
        if (t.startsWith('#')) { p.style.marginTop = '35px'; }
        if (t.includes('@aicut.co.kr') || t.includes('pf.kakao') || t.includes('aicut.co.kr')) { p.style.marginTop = '8px'; p.style.marginBottom = '4px'; }
      });
      const canvas = document.querySelector('.se-canvas');
      if (canvas) canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    });
    console.log('   본문 재입력+정렬 완료');
    
    // 제목
    await editorFrame.evaluate(() => {
      SmartEditor._editors['blogpc001'].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
    });
    console.log('   제목 설정 완료');
  }

  // 이미지 삽입 (글-이미지 교차)
  console.log('\n2. 이미지 본문 사이에 삽입...');

  const imageFiles = [
    { file: 'aicut_blog_main.png', afterSection: 5 },      // 도입부 직후 (5번째 문단쯤)
    { file: 'aicut_blog_card1.png', afterSection: 30 },     // 서울식물원 섹션 직후
    { file: 'aicut_blog_card2.png', afterSection: 65 },     // 북촌 섹션 직후
    { file: 'aicut_blog_card3.png', afterSection: 105 },    // 한강 섹션 직후
    { file: 'aicut_blog_cta.png', afterSection: 160 }       // CTA 섹션 직전
  ];

  // 방법: 사진 버튼 클릭 → filechooser로 파일 업로드
  // SE4는 현재 커서 위치에 이미지를 삽입함
  
  for (let i = 0; i < imageFiles.length; i++) {
    const imgPath = path.join(__dirname, imageFiles[i].file);
    const targetIndex = imageFiles[i].afterSection;
    
    console.log(`   ${i+1}. ${imageFiles[i].file} (문단 ${targetIndex} 부근)...`);

    // 해당 위치 근처로 커서 이동
    await editorFrame.evaluate((idx) => {
      const paras = document.querySelectorAll('.se-text-paragraph');
      if (paras[idx] && paras[idx].firstChild) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(paras[idx].firstChild, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        paras[idx].scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    }, targetIndex);
    await editorFrame.waitForTimeout(500);
    
    // 사진 버튼 클릭
    const photoBtn = await editorFrame.$('button:has-text("사진")');
    if (!photoBtn) {
      console.log('      사진 버튼 없음');
      continue;
    }

    try {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }),
        photoBtn.click()
      ]);
      await fileChooser.setFiles([imgPath]);
      console.log(`      ✅ 업로드 완료`);
      await page.waitForTimeout(6000);
    } catch(e) {
      console.log(`      ❌ 실패: ${e.message}`);
    }
  }

  // 저장
  console.log('\n3. 저장...');
  await editorFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  console.log('\n✅ 이미지 삽입 완료! 브라우저 확인 부탁드립니다.');
})();
