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
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // 새로 열린 탭 찾기 (가장 마지막 페이지)
  const write = pages[pages.length - 1];
  console.log('현재 탭 URL:', write.url().substring(0, 80));

  const frameEl = await write.$('#mainFrame');
  if (!frameEl) { console.log('❌ No iframe'); process.exit(1); }
  const frame = await frameEl.contentFrame();
  if (!frame) { console.log('❌ Cannot access iframe'); process.exit(1); }

  // 1. 팝업 처리 - 모든 레이어 닫기
  console.log('🔍 팝업 확인 중...');
  const popupInfo = await frame.evaluate(() => {
    const popups = document.querySelectorAll('.se-popup');
    return Array.from(popups).map(p => ({
      cls: (p.className || '').substring(0, 100),
      display: getComputedStyle(p).display,
      visible: getComputedStyle(p).visibility,
      text: (p.innerText || '').substring(0, 100),
      confirmBtn: !!p.querySelector('.se-popup-button-confirm, .se-popup-confirm, .se-btn-primary, button:has-text("확인")'),
    }));
  });
  console.log('팝업들:', JSON.stringify(popupInfo, null, 2));

  // 확인 버튼 클릭으로 팝업 닫기
  for (const btn of ['se-popup-button-confirm', 'se-popup-confirm', '.se-btn-primary']) {
    const el = await frame.$(btn);
    if (el) {
      await el.click();
      console.log(`✅ 팝업 닫기: ${btn}`);
      await frame.waitForTimeout(1000);
    }
  }
  
  // dimd 레이어 제거
  await frame.evaluate(() => {
    document.querySelectorAll('.se-popup-dim').forEach(el => el.remove());
    document.querySelectorAll('.se-popup').forEach(el => el.style.display = 'none');
  });
  console.log('✅ dim/popup 제거');
  await frame.waitForTimeout(500);

  // 2. 이미지 업로드
  for (let i = 0; i < IMG_FILES.length; i++) {
    const imgPath = IMG_DIR + IMG_FILES[i];
    console.log(`\n📸 이미지 ${i+1}/5: ${IMG_FILES[i]}`);
    
    // 사진 버튼 찾기
    const btn = await frame.$('.se-image-toolbar-button');
    if (!btn) {
      console.log('  ⚠️ 사진 버튼 없음, file input 직접 시도');
      const fi = await frame.$('input[type="file"]');
      if (fi) { await fi.setInputFiles(imgPath); console.log('  ✅ 업로드됨'); }
      else { console.log('  ❌ file input 없음'); }
      await frame.waitForTimeout(2000);
      continue;
    }
    
    // force click (intercepted 방지)
    await btn.evaluate(el => el.click());
    console.log('  ✅ 사진 버튼 클릭');
    await frame.waitForTimeout(1500);
    
    // file input 찾기
    const fi = await frame.$('input[type="file"]');
    if (fi) {
      await fi.setInputFiles(imgPath);
      console.log('  ✅ 파일 선택됨, 업로드 대기중...');
      await frame.waitForTimeout(7000);
      
      // 팝업 닫기
      await frame.evaluate(() => {
        document.querySelectorAll('.se-popup-dim').forEach(el => el.remove());
        document.querySelectorAll('.se-popup').forEach(el => el.style.display = 'none');
      });
    }
    
    // canvas 클릭
    await frame.evaluate(() => {
      const c = document.querySelector('.se-canvas');
      if (c) c.click();
    });
    await frame.waitForTimeout(500);
  }

  // 3. 저장
  console.log('\n💾 저장 시도...');
  const saveBtn = await frame.$('button:has-text("저장"), span:has-text("저장")');
  if (saveBtn) {
    await saveBtn.click();
    console.log('✅ 저장 버튼 클릭');
  }
  
  await frame.waitForTimeout(3000);

  // 4. 최종 상태 확인
  const state = await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    const imgs = blocks.filter(b => b.type === 'image');
    const texts = blocks.filter(b => ['paragraph','heading2','heading3'].includes(b.type));
    return {
      title: ed.getDocumentTitle(),
      total: blocks.length,
      images: imgs.length,
      imageNames: imgs.map(b => (b.url||'').split('/').pop().substring(0,40)),
      texts: texts.length,
    };
  });
  
  console.log('\n✅ 최종 상태:', JSON.stringify(state, null, 2));
  console.log('\n🎉 블로그 작성 완료! (임시저장)');
  console.log('정이사님, 검토 후 "발행해"라고 말씀해주세요!');
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
