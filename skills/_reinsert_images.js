// 부동산 블로그 이미지 재시도 — 깨진 컴포넌트 삭제 후 새로 삽입
const { chromium } = require('playwright');
const path = require('path');

const IMAGES = [
  { file: 'aicut_blog_realestate_main.png', alt: '부동산 중개사무소 영상 마케팅 대표 이미지' },
  { file: 'aicut_blog_realestate_card1.png', alt: '부동산 중개사무소 영상 마케팅 중요성' },
  { file: 'aicut_blog_realestate_card2.png', alt: '릴스 쇼츠 부동산 숏폼 마케팅 전략' },
  { file: 'aicut_blog_realestate_card3.png', alt: '하반기 분양 시즌 모델하우스 영상 마케팅 준비' },
  { file: 'aicut_blog_realestate_cta.png', alt: '에이컷 부동산 영상 편집 무료 견적 문의' },
];

const WORKSPACE = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  // === 1단계: 깨진 이미지 컴포넌트 3,2,1,0 순서로 삭제 ===
  console.log('🗑️ 깨진 이미지 컴포넌트 삭제...');
  
  for (let pass = 0; pass < 5; pass++) {
    const deleted = await page.evaluate(() => {
      const comps = document.querySelectorAll('.se-component.se-image');
      for (let i = comps.length - 1; i >= 0; i--) {
        const c = comps[i];
        if (c.innerText.includes('존재하지 않는 이미지') || !c.querySelector('img')) {
          // 이미지 영역 클릭
          const section = c.querySelector('.se-section-image, .se-module-image');
          if (section) section.click();
          else c.click();
          return { idx: i, found: true };
        }
      }
      return { found: false };
    });
    
    if (!deleted.found) break;
    
    await page.waitForTimeout(500);
    
    // 삭제 버튼 클릭
    await page.evaluate(() => {
      const delBtn = document.querySelector('.se-image-delete-button');
      if (delBtn) delBtn.click();
    });
    
    await page.waitForTimeout(1000);
    console.log(`  컴포넌트 ${deleted.idx} 삭제 완료`);
  }
  
  console.log('✅ 깨진 컴포넌트 정리 완료');
  
  // === 2단계: 이미지 순서대로 삽입 ===
  console.log('\n📸 이미지 삽입 시작...');
  
  for (let i = 0; i < IMAGES.length; i++) {
    const imgFile = path.join(WORKSPACE, IMAGES[i].file);
    const imgAlt = IMAGES[i].alt;
    
    console.log(`\n  [${i+1}/${IMAGES.length}] ${IMAGES[i].file}...`);
    
    // (1) 삽입할 위치 찾기 - i번째 이미지가 들어갈 위치
    // i=0: 본문 시작 부분 (제목 다음)
    // i=1~4: 적절한 텍스트 블록 사이
    
    // "사진" 툴바 버튼 클릭
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    
    await page.evaluate(() => {
      const btn = document.querySelector('.se-image-toolbar-button');
      if (btn) btn.click();
    });
    
    await page.waitForTimeout(800);
    
    const fileChooser = await fileChooserPromise;
    if (fileChooser) {
      console.log('  📁 파일 선택 → 업로드');
      await fileChooser.setFiles(imgFile);
      await page.waitForTimeout(3000);
      
      // 업로드 상태 확인
      const status = await page.evaluate(() => {
        const lastComp = document.querySelectorAll('.se-component.se-image');
        const last = lastComp[lastComp.length - 1];
        if (!last) return '컴포넌트 없음';
        return last.innerText.includes('존재하지 않는 이미지') ? '404' : '✅ 정상';
      });
      console.log(`  상태: ${status}`);
    } else {
      console.log('  ❌ file chooser 없음');
    }
  }
  
  console.log('\n✅ 모든 이미지 삽입 완료');
  
  // 최종 확인
  const finalCheck = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return Array.from(comps).map((c, i) => ({
      idx: i,
      ok: !c.innerText.includes('존재하지 않는 이미지') && !!c.querySelector('img'),
      hasImg: !!c.querySelector('img'),
    }));
  });
  console.log('최종:', JSON.stringify(finalCheck, null, 2));
  
  await page.screenshot({ path: 'debug_images_v2.png', fullPage: true });
  
  // 저장
  await page.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('💾 저장 완료');
  
  await page.waitForTimeout(2000);
  console.log('\n✅ 브라우저를 확인해주세요.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
