const { chromium } = require('playwright');

const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
const IMG_FILES = [
  'aicut_blog_hospital_main.png',
  'aicut_blog_hospital_01.png',
  'aicut_blog_hospital_02.png',
  'aicut_blog_hospital_03.png',
  'aicut_blog_hospital_cta.png',
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const p = pages[0]; // 탭 0
  const fe = await p.$('#mainFrame');
  if (!fe) { console.log('❌ iframe 없음'); process.exit(1); }
  const f = await fe.contentFrame();

  // 1. 이미지 업로드 전에 텍스트를 보호하기 위해 canvas HTML 저장
  const canvasHTML = await f.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    return wrap ? wrap.innerHTML : '';
  });
  console.log('📝 현재 canvas 텍스트 HTML:', canvasHTML.length, 'chars');

  // 2. 이미지 업로드
  for (let i = 0; i < IMG_FILES.length; i++) {
    const file = IMG_FILES[i];
    console.log(`\n📸 이미지 ${i+1}/5: ${file}`);
    
    // 팝업 정리
    await f.evaluate(() => {
      document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove());
    });
    
    // 사진 버튼 클릭
    await f.evaluate(() => document.querySelector('.se-image-toolbar-button')?.click());
    await f.waitForTimeout(1500);
    
    // file input 찾기
    const fi = await f.$('input[type="file"]');
    if (fi) {
      await fi.setInputFiles(IMG_DIR + file);
      console.log('  ⏳ 업로드 대기 8초...');
      await f.waitForTimeout(8000);
    } else {
      console.log('  ❌ file input 못 찾음');
    }
    
    // 팝업 정리
    await f.evaluate(() => {
      document.querySelectorAll('.se-popup-dim').forEach(el => el.remove());
    });
  }
  
  console.log('\n✅ 이미지 업로드 완료');
  
  // 3. 이미지 업로드 후 canvas에 텍스트가 유지되었는지 확인
  const afterUpload = await f.evaluate(() => {
    const c = document.querySelector('.se-canvas');
    const wrap = c?.querySelector('.se-components-wrap');
    return {
      canvasTextLen: (c?.innerText || '').length,
      wrapChildren: wrap?.children.length || 0,
      imgs: c ? c.querySelectorAll('img').length : 0,
    };
  });
  console.log('업로드 후:', JSON.stringify(afterUpload));

  // 4. 만약 텍스트가 사라졌으면 다시 주입
  if (afterUpload.canvasTextLen < 500) {
    console.log('⚠️ 텍스트 사라짐 → 다시 주입');
    
    await f.evaluate((savedHTML) => {
      const canvas = document.querySelector('.se-canvas');
      if (!canvas) return;
      
      // 기존 wrap 찾기
      let wrap = canvas.querySelector('.se-components-wrap');
      if (!wrap) {
        wrap = document.createElement('article');
        wrap.className = 'se-components-wrap';
        // canvas의 첫 번째 자식으로 추가 (content-guide, selection 뒤?)
        canvas.prepend(wrap);
      }
      
      // 텍스트 HTML + 기존 이미지 보존
      // savedHTML에는 텍스트만 있고, 이미지 업로드가 추가한 이미지 components도 있음
      // 이미지 components는 유지하고 텍스트만 추가
      const existingChildren = Array.from(wrap.children);
      const imgs = existingChildren.filter(el => el.className.includes('se-image'));
      const texts = existingChildren.filter(el => !el.className.includes('se-image'));
      
      // 이미지만 유지하고 텍스트 제거
      imgs.forEach(el => el.remove()); // 잠시 제거
      texts.forEach(el => el.remove());
      
      // 텍스트 HTML 다시 주입
      const temp = document.createElement('div');
      temp.innerHTML = savedHTML;
      Array.from(temp.children).forEach(child => wrap.appendChild(child));
      
      // 이미지 다시 추가
      imgs.forEach(el => wrap.appendChild(el));
    }, canvasHTML);
    
    await f.waitForTimeout(1000);
  }
  
  // 5. 이미지 정렬
  await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    let count = 0;
    data.document.blocks.forEach(b => {
      if (b.type === 'image') { b.align = 'center'; count++; }
    });
    ed.setDocumentData(data);
    console.log('이미지 정렬:', count);
  });
  await f.waitForTimeout(500);

  // 6. 저장
  await f.evaluate(() => {
    window.scrollTo(0, 0);
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
    else {
      document.querySelectorAll('button').forEach(b => {
        if (b.innerText.includes('저장')) b.click();
      });
    }
  });
  console.log('💾 저장');
  await f.waitForTimeout(2000);

  // 7. 최종 확인
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    return {
      blocks: d.blocks?.length,
      chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
      imgComps: d.components?.filter(x => x.fileName).length,
      canvasImgs: c ? c.querySelectorAll('img').length : 0,
      canvasTextLen: (c?.innerText || '').length,
      canvasText: (c?.innerText || '').substring(0, 80),
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final, null, 2));
  
  if (final.canvasImgs >= 5 && final.canvasTextLen > 500) {
    console.log('\n✅✅✅ 텍스트 + 이미지 모두 캔버스에 정상 표시!');
  } else {
    console.log('\n⚠️ 일부 누락:', { imgs: final.canvasImgs, text: final.canvasTextLen });
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
