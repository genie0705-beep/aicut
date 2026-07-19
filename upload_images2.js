const { chromium } = require('playwright');

const WRITE_INDEX = 4; // 새로 열린 탭 (index 4 = 두 번째 write 탭)
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
  const write = pages[WRITE_INDEX];
  console.log('타겟 탭:', write.url().substring(0, 80));

  const frameEl = await write.$('#mainFrame');
  if (!frameEl) { console.log('❌ No iframe'); process.exit(1); }
  const frame = await frameEl.contentFrame();
  if (!frame) { console.log('❌ Cannot access iframe'); process.exit(1); }

  // 현재 상태 확인
  const state = await frame.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      return { 
        title: ed.getDocumentTitle(), 
        blocks: ed.getDocumentData().document.blocks.length 
      };
    } catch(e) { return { error: e.message }; }
  });
  console.log('현재 상태:', JSON.stringify(state));

  // 팝업 닫기
  await frame.evaluate(() => {
    document.querySelectorAll('.se-popup-dim').forEach(el => el.remove());
    document.querySelectorAll('.se-popup').forEach(el => el.style.display = 'none');
  });
  await frame.waitForTimeout(500);

  // 이미지 업로드
  for (let i = 0; i < IMG_FILES.length; i++) {
    const imgPath = IMG_DIR + IMG_FILES[i];
    console.log(`\n📸 이미지 ${i+1}/5: ${IMG_FILES[i]}`);

    // 사진 버튼 찾기
    const btn = await frame.$('.se-image-toolbar-button');
    if (!btn) {
      console.log('  ⚠️ 사진 버튼 없음 → file input 직접');
      const fi = await frame.$('input[type="file"]');
      if (fi) { await fi.setInputFiles(imgPath); console.log('  ✅ 완료'); }
      else { console.log('  ❌ file input 없음'); }
      await frame.waitForTimeout(2000);
      continue;
    }
    
    // evaluate로 직접 click (intercept 우회)
    await frame.evaluate(() => {
      const btn = document.querySelector('.se-image-toolbar-button');
      if (btn) btn.click();
    });
    console.log('  ✅ 사진 버튼 클릭');
    await frame.waitForTimeout(1500);
    
    // file input에 직접 파일 설정
    const fi = await frame.$('input[type="file"]');
    if (fi) {
      await fi.setInputFiles(imgPath);
      console.log('  ✅ 파일 선택됨, 7초 대기...');
      await frame.waitForTimeout(7000);
    } else {
      console.log('  ⚠️ file input 없음, 파일선택 버튼 시도');
      const fileBtn = await frame.$('.se-btn:has-text("파일선택"), .se-btn:has-text("내 PC")');
      if (fileBtn) {
        await fileBtn.click();
        await frame.waitForTimeout(500);
        const fi2 = await frame.$('input[type="file"]');
        if (fi2) { await fi2.setInputFiles(imgPath); console.log('  ✅ 완료'); }
      }
    }
    
    // 팝업 정리
    await frame.evaluate(() => {
      document.querySelectorAll('.se-popup-dim').forEach(el => el.remove());
    });
    
    // canvas 클릭
    const canvas = await frame.$('.se-canvas');
    if (canvas) await canvas.click();
    await frame.waitForTimeout(500);
  }

  // 저장
  console.log('\n💾 저장 중...');
  const saveBtn = await frame.$('button:has-text("저장"), [class*="save"]');
  if (saveBtn) {
    await saveBtn.click();
    console.log('✅ 저장 클릭');
    await frame.waitForTimeout(3000);
  }

  // 최종 상태
  const finalState = await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    return {
      title: ed.getDocumentTitle(),
      total: blocks.length,
      images: blocks.filter(b => b.type === 'image').length,
    };
  });
  console.log('\n✅ 최종:', JSON.stringify(finalState));
  console.log('🎉 완료! 정이사님 검토 부탁드립니다!');
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
