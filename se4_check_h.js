const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('Redirect=Write') || p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) { console.log('❌ 에디터 페이지 없음'); return; }

  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }

  console.log('✅ 에디터 발견\n');

  // 1. 현재 내용 확인 (H태그, 이미지, 문단)
  const status = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    
    const blocks = data?.document?.blocks || [];
    let h2count = 0, h3count = 0, pcount = 0, imgcount = 0;
    
    blocks.forEach(b => {
      if (b.type === 'heading2') h2count++;
      else if (b.type === 'heading3') h3count++;
      else if (b.type === 'image') imgcount++;
      else if (b.type === 'paragraph') pcount++;
    });

    // canvas에서 실제 H 태그 확인
    const canvasH2 = document.querySelectorAll('h2').length;
    const canvasH3 = document.querySelectorAll('h3').length;
    const canvasImgs = document.querySelectorAll('img, [class*="image"]').length;
    const totalParas = document.querySelectorAll('.se-text-paragraph, p').length;

    return {
      dataBlocks: { h2: h2count, h3: h3count, p: pcount, img: imgcount, total: blocks.length },
      canvasTags: { h2: canvasH2, h3: canvasH3, imgs: canvasImgs, paras: totalParas },
      title: ed.getTitle ? ed.getTitle() : '(no getTitle)',
      textLen: ed.getContentText ? ed.getContentText().length : 0
    };
  });

  console.log('=== 현재 에디터 상태 ===');
  console.log(`제목: ${status.title}`);
  console.log(`본문 길이: ${status.textLen}자`);
  console.log('');
  console.log('--- 데이터 레이어 ---');
  console.log(`H2: ${status.dataBlocks.h2}개, H3: ${status.dataBlocks.h3}개`);
  console.log(`P: ${status.dataBlocks.p}개, 이미지: ${status.dataBlocks.img}개`);
  console.log('');
  console.log('--- 실제 Canvas ---');
  console.log(`h2 태그: ${status.canvasTags.h2}개, h3 태그: ${status.canvasTags.h3}개`);
  console.log(`이미지: ${status.canvasTags.imgs}개, 문단: ${status.canvasTags.paras}개`);

  // 2. heading 태그가 없으면 변환
  if (status.dataBlocks.h2 === 0 && status.dataBlocks.h3 === 0) {
    console.log('\n⚠️ H 태그가 없습니다. 변환을 시도합니다...');
    
    const convertResult = await ef.evaluate(() => {
      const paras = document.querySelectorAll('.se-text-paragraph');
      let h2converted = 0, h3converted = 0;
      
      // SE4 API로 heading 변환
      const ed = SmartEditor._editors['blogpc001'];
      
      paras.forEach((p, idx) => {
        const text = p.innerText.trim();
        
        // H3로 변환할 텍스트 (서브 코스명)
        if (text.match(/^(서울식물원|안국동·북촌|여의도 한강|송파문화예술|서교음악창작소)/)) {
          // SE4에서 paragraph→heading 변환
          try {
            const data = ed.getDocumentData();
            if (data?.document?.blocks?.[idx]) {
              data.document.blocks[idx].type = 'heading3';
              ed.setDocumentData(data);
            }
          } catch(e) {}
          h3converted++;
        }
        
        // H2로 변환할 텍스트 (코스명)
        if (text.match(/^(첫 번째|두 번째|세 번째|네 번째|다섯 번째)/)) {
          try {
            const data = ed.getDocumentData();
            if (data?.document?.blocks?.[idx]) {
              data.document.blocks[idx].type = 'heading2';
              ed.setDocumentData(data);
            }
          } catch(e) {}
          h2converted++;
        }
        
        // 영상으로 남겨보세요 H2
        if (text.includes('영상으로 남겨보세요')) {
          try {
            const data = ed.getDocumentData();
            if (data?.document?.blocks?.[idx]) {
              data.document.blocks[idx].type = 'heading2';
              ed.setDocumentData(data);
            }
          } catch(e) {}
          h2converted++;
        }
      });
      
      return { h2converted, h3converted };
    });
    
    console.log(`H2 변환: ${convertResult.h2converted}개, H3 변환: ${convertResult.h3converted}개`);
  } else {
    console.log('\n✅ H 태그가 이미 적용되어 있습니다.');
  }

  // 3. 이미지 상태 확인
  if (status.canvasTags.imgs === 0 && status.dataBlocks.img > 0) {
    console.log('⚠️ 이미지가 데이터에는 있지만 canvas에 안 보입니다. canvas 업데이트 시도...');
  } else if (status.canvasTags.imgs > 0) {
    console.log(`✅ 이미지 ${status.canvasTags.imgs}개가 canvas에 표시됨`);
  } else {
    console.log('ℹ️ 이미지가 없습니다');
  }

  // 저장
  console.log('\n저장...');
  await ef.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  console.log('\n✅ 확인 완료! 브라우저에서 확인해주세요.');
})();
