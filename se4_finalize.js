const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const IMG_FILES = [
  'aicut_blog_insurance02.png',
  'aicut_blog_insurance03.png',
  'aicut_blog_insurance04.png',
  'aicut_blog_insurance05.png'
];

const IMG_ALT = [
  '보험설계사 무더위 마케팅 고민',
  '보험설계사 숏폼 콘텐츠 전략',
  '하반기 마케팅 숏폼 시작',
  '숏폼 편집 아웃소싱 에이컷 상담'
];

const BASE_PATH = 'C:\\Users\\paul\\.openclaw\\workspace\\';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const page = pages.find(p => p.url().includes('Redirect=Write'));
  if (!page) { console.log('NO PAGE'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);
  
  // SmartEditor 프레임 찾기
  const allFrames = page.frames();
  let seFrame = null;
  for (const f of allFrames) {
    const has = await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false);
    if (has) { seFrame = f; break; }
  }
  if (!seFrame) { console.log('NO SE FRAME'); await b.close(); return; }
  
  console.log('✅ SmartEditor 프레임 발견');
  
  // ===== 1. 이미지 4장 업로드 =====
  console.log('\n📸 이미지 업로드 시작...');
  
  for (let i = 0; i < IMG_FILES.length; i++) {
    console.log(`   ${i+2}/5: ${IMG_FILES[i]} 업로드 중...`);
    
    // 사진 추가 버튼 클릭
    await seFrame.evaluate(() => {
      const btn = document.querySelector('.se-image-toolbar-button') ||
                  document.querySelector('[data-tool=picture]') ||
                  document.querySelector('.se-toolbar-button._image');
      if (btn) btn.click();
    });
    await sleep(3000);
    
    // file input 찾기
    const fileInput = await seFrame.$('input[type=file].se-image-file-input, input[type=file]');
    if (fileInput) {
      await fileInput.setInputFiles(BASE_PATH + IMG_FILES[i]);
      console.log(`      업로드 대기 중...`);
      await sleep(8000);
    } else {
      console.log('      ❌ file input 없음, 직접 찾기');
      // 부모 페이지에서 file input 찾기
      const pfInput = await page.$('input[type=file]');
      if (pfInput) {
        await pfInput.setInputFiles(BASE_PATH + IMG_FILES[i]);
        await sleep(8000);
      }
    }
  }
  console.log('✅ 이미지 업로드 완료');
  await sleep(3000);
  
  // ===== 2. 이미지 센터 정렬 =====
  console.log('\n🖼️ 이미지 센터 정렬 중...');
  
  await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    
    // 이미지 컴포넌트 찾아서 align 변경
    function setCenterAlign(items) {
      for (const item of items) {
        if (item.type === 'image' || item.type === 'se_image' || item.componentType === 'image') {
          item.align = 'center';
          item.textAlign = 'center';
          item.style = item.style || {};
          item.style.textAlign = 'center';
          item.style.display = 'block';
          item.style.margin = '0 auto';
        }
        if (item.children) setCenterAlign(item.children);
        if (item.blocks) setCenterAlign(item.blocks);
        if (item.content) {
          if (Array.isArray(item.content)) setCenterAlign(item.content);
          else if (typeof item.content === 'object') setCenterAlign([item.content]);
        }
      }
    }
    
    if (data.blocks) setCenterAlign(data.blocks);
    if (data.children) setCenterAlign(data.children);
    if (data.content) {
      if (Array.isArray(data.content)) setCenterAlign(data.content);
    }
    
    ed.setDocumentData(data);
  });
  await sleep(2000);
  console.log('✅ 이미지 정렬 완료');
  
  // ===== 3. CTA 링크 처리 =====
  console.log('\n🔗 CTA 링크 처리 중...');
  
  await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    
    // URL 텍스트 찾아서 뒤에 빈 paragraph 추가
    function addEmptyParaAfterUrl(blocks) {
      if (!blocks) return;
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.type === 'text' || block.type === 'paragraph' || block.componentType === 'text') {
          const text = (block.text || block.content || '').toString();
          if (text.includes('pf.kakao.com') || text.includes('aicut.co.kr') || text.includes('master@')) {
            // URL 뒤에 빈 paragraph 삽입
            const emptyPara = { type: 'paragraph', text: '', componentType: 'text', style: { textAlign: 'center' } };
            blocks.splice(i + 1, 0, emptyPara);
            i++; // 하나 건너뛰기
          }
        }
        if (block.children) addEmptyParaAfterUrl(block.children);
        if (block.blocks) addEmptyParaAfterUrl(block.blocks);
        if (block.content) {
          if (Array.isArray(block.content)) addEmptyParaAfterUrl(block.content);
        }
      }
    }
    
    if (data.blocks) addEmptyParaAfterUrl(data.blocks);
    if (data.children) addEmptyParaAfterUrl(data.children);
    if (data.content) {
      if (Array.isArray(data.content)) addEmptyParaAfterUrl(data.content);
    }
    
    ed.setDocumentData(data);
  });
  await sleep(2000);
  console.log('✅ CTA 링크 처리 완료');
  
  // ===== 4. 저장 =====
  console.log('\n💾 최종 저장 중...');
  
  await seFrame.evaluate(() => {
    const btns = document.querySelectorAll('button, a, [role=button]');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') {
        btn.click();
        return;
      }
    }
  });
  await sleep(5000);
  console.log('✅ 최종 저장 완료!');
  
  // ===== 5. 결과 확인 =====
  const title = await seFrame.evaluate(() => SmartEditor._editors['blogpc001'].getDocumentTitle());
  const contentLen = await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    return JSON.stringify(data).length;
  });
  
  console.log(`\n=== 📋 저장 확인 ===`);
  console.log(`제목: ${title.substring(0, 50)}...`);
  console.log(`데이터 크기: ${Math.round(contentLen/1024)}KB`);
  console.log(`\n✅ 모든 작업 완료! 발행 전입니다.`);
  
  await b.close();
})();
