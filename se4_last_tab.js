const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // 마지막 탭 찾기
  const lastPage = pages[pages.length - 1];
  const url = lastPage.url();
  console.log(`마지막 탭 URL: ${url.substring(0, 100)}`);
  console.log(`전체 탭 수: ${pages.length}`);

  if (!url.includes('Redirect=Write') && !url.includes('PostWriteForm')) {
    console.log('❌ 마지막 탭이 에디터 페이지가 아닙니다');
    console.log('에디터 탭을 찾습니다...');
    
    for (let i = pages.length - 1; i >= 0; i--) {
      const pu = pages[i].url();
      if (pu.includes('PostWriteForm') || pu.includes('Redirect=Write')) {
        console.log(`✅ 탭 ${i}에서 에디터 발견: ${pu.substring(0, 80)}`);
        
        const ef = await findEditor(pages[i]);
        if (ef) {
          await checkAndSave(pages[i], ef);
        }
        break;
      }
    }
  } else {
    console.log('✅ 마지막 탭 = 에디터 페이지');
    const ef = await findEditor(lastPage);
    if (ef) {
      await checkAndSave(lastPage, ef);
    }
  }

  async function findEditor(page) {
    for (const f of page.frames()) {
      try {
        if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) return f;
      } catch(e) {}
    }
    return null;
  }

  async function checkAndSave(page, ef) {
    const status = await ef.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const textLen = ed.getContentText ? ed.getContentText().length : -1;
      const title = ed.getTitle ? ed.getTitle() : '';
      const canvasText = document.querySelector('.se-canvas')?.innerText?.substring(0, 80) || '';
      const paras = document.querySelectorAll('.se-text-paragraph, p, h2, h3').length;
      const imgs = document.querySelectorAll('img, [class*="se-image"]').length;
      return { textLen, title: title.substring(0, 30), canvas: canvasText, elements: paras, images: imgs };
    });

    console.log(`\n에디터 상태:`);
    console.log(`   제목: ${status.title}`);
    console.log(`   본문 길이: ${status.textLen}자`);
    console.log(`   요소 수: ${status.elements}개`);
    console.log(`   이미지: ${status.images}개`);
    console.log(`   캔버스: ${status.canvas}`);

    if (status.textLen > 0 || status.elements > 10) {
      // 내용이 있으면 저장 버튼 다시 클릭
      console.log('\n내용 있음 → 저장 버튼 클릭...');
      await ef.evaluate(() => {
        for (const btn of document.querySelectorAll('button')) {
          if (btn.innerText.trim() === '저장') { btn.click(); console.log('저장'); break; }
        }
      });
      console.log('✅ 저장 버튼 클릭 완료');
      console.log('15초간 저장 완료 대기...');
      await new Promise(r => setTimeout(r, 15000));
      console.log('✅ 저장 대기 완료');
    } else {
      console.log('\n⚠️ 내용이 없습니다. 재작성 필요');
    }
  }

  console.log('\n✅ 완료 — 브라우저 확인해주세요');
})();
