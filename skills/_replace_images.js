// 부동산 블로그 이미지 교체 — 기존 이미지 컴포넌트에 실제 파일 업로드
const { chromium } = require('playwright');
const path = require('path');

const IMAGE_FILES = [
  { order: 1, file: 'aicut_blog_realestate_main.png', alt: '부동산 중개사무소 영상 마케팅 대표 이미지' },
  { order: 2, file: 'aicut_blog_realestate_card1.png', alt: '부동산 중개사무소 영상 마케팅 중요성' },
  { order: 3, file: 'aicut_blog_realestate_card2.png', alt: '릴스 쇼츠 부동산 숏폼 마케팅 전략' },
  { order: 4, file: 'aicut_blog_realestate_card3.png', alt: '하반기 분양 시즌 모델하우스 영상 마케팅 준비' },
  { order: 5, file: 'aicut_blog_realestate_cta.png', alt: '에이컷 부동산 영상 편집 무료 견적 문의' },
];

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // postwrite 탭 찾기
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
  
  console.log('현재 URL:', page.url());
  
  // 이미지 컴포넌트 개수 확인
  const imgComps = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return Array.from(comps).map(c => ({
      id: c.id,
      has404: c.innerText.includes('존재하지 않는 이미지'),
      text: (c.innerText || '').slice(0,50),
    }));
  });
  console.log('이미지 컴포넌트:', imgComps.length, '개');
  
  if (imgComps.length === 0) {
    console.log('❌ 이미지 컴포넌트가 없습니다.');
    await b.close();
    process.exit(1);
  }
  
  // 각 이미지 컴포넌트 교체
  for (let i = 0; i < Math.min(IMAGE_FILES.length, imgComps.length); i++) {
    const imgFile = path.join(WORKSPACE, IMAGE_FILES[i].file);
    const imgAlt = IMAGE_FILES[i].alt;
    
    console.log(`\n📸 이미지 ${i+1}/${IMAGE_FILES.length}: ${IMAGE_FILES[i].file}`);
    
    // file chooser 이벤트 설정 (click 전에 준비)
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    
    // 이미지 컴포넌트 클릭 → 사진 교체 버튼 표시
    const clicked = await page.evaluate((idx) => {
      const comps = document.querySelectorAll('.se-component.se-image');
      if (!comps[idx]) return '컴포넌트 없음';
      
      // 이미지 컴포넌트 내 클릭 가능한 영역 찾기
      const sections = comps[idx].querySelectorAll('.se-section-image, .se-module-image, .se-image-status-404');
      for (const el of sections) {
        if (el) {
          el.click();
          return '클릭됨';
        }
      }
      // fallback: 전체 영역 클릭
      comps[idx].click();
      return '전체 클릭';
    }, i);
    console.log(`  컴포넌트 ${i+1}: ${clicked}`);
    
    await page.waitForTimeout(300);
    
    // 교체 버튼 찾기
    const replaceClicked = await page.evaluate((idx) => {
      // property toolbar에서 교체 버튼 찾기
      const btn = document.querySelector('.se-image-replacement-toolbar-button');
      if (btn) {
        // file chooser 트리거를 위해 input 찾기
        // SE4 이미지 교체 버튼 주변에 숨겨진 file input이 있을 수 있음
        btn.click();
        return '교체 버튼 클릭';
      }
      
      // 다른 방식: 이미지 컴포넌트의 파일 input 찾기
      const comps = document.querySelectorAll('.se-component.se-image');
      const comp = comps[idx];
      if (!comp) return '컴포넌트 없음';
      
      // 삭제 버튼 찾기
      const delBtn = comp.querySelector('.se-image-delete-button');
      if (delBtn) {
        delBtn.click();
        return '삭제 버튼 클릭';
      }
      
      return '교체/삭제 버튼 없음';
    }, i);
    console.log(`  교체 버튼: ${replaceClicked}`);
    
    await page.waitForTimeout(500);
    
    // file chooser 처리
    const fileChooser = await fileChooserPromise;
    if (fileChooser) {
      console.log(`  📁 파일 선택 다이얼로그 감지됨 → ${imgFile}`);
      await fileChooser.setFiles(imgFile);
      console.log('  ✅ 파일 업로드 완료');
    } else {
      console.log('  ❌ 파일 선택 다이얼로그 없음, 다른 방식 시도');
      
      // 파일 input이 있는지 확인
      const fileInput = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="file"]');
        // 숨겨진 input 중 visible인 것
        for (const inp of inputs) {
          if (inp.offsetParent !== null || inp.style.display !== 'none') {
            return { id: inp.id, accept: inp.getAttribute('accept') };
          }
        }
        // hidden input도 확인
        for (const inp of inputs) {
          return { id: inp.id, accept: inp.getAttribute('accept'), hidden: true };
        }
        return null;
      });
      console.log('  파일 input:', JSON.stringify(fileInput));
      
      if (fileInput) {
        // 선택자로 input 찾아서 파일 설정
        const inputHandle = await page.$('input[type="file"]');
        if (inputHandle) {
          await inputHandle.setInputFiles(imgFile);
          console.log('  ✅ input.setInputFiles 완료');
        }
      }
    }
    
    await page.waitForTimeout(2000);
    
    // 확인: 이미지가 업로드되었는지 404 상태 확인
    const status = await page.evaluate((idx) => {
      const comps = document.querySelectorAll('.se-component.se-image');
      if (!comps[idx]) return '컴포넌트 없음';
      const has404 = comps[idx].innerText.includes('존재하지 않는 이미지');
      return has404 ? '여전히 404' : '✅ 이미지 정상';
    }, i);
    console.log(`  상태: ${status}`);
  }
  
  console.log('\n✅ 이미지 교체 시도 완료');
  
  // 최종 상태
  const finalState = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return Array.from(comps).map((c, i) => ({
      idx: i,
      has404: c.innerText.includes('존재하지 않는 이미지'),
      hasImg: !!c.querySelector('img'),
    }));
  });
  console.log('최종 이미지 상태:', JSON.stringify(finalState, null, 2));
  
  await page.screenshot({ path: 'debug_images_final.png', fullPage: true });
  console.log('✅ 스크린샷: debug_images_final.png');
  
  // 저장
  const saveBtn = await page.$('.save_btn__bzc5B');
  if (saveBtn) {
    await saveBtn.click();
    console.log('💾 저장 버튼 클릭');
  }
  
  await page.waitForTimeout(3000);
  console.log('\n✅ 완료! 브라우저 확인 바랍니다.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌ 오류:', e.message));
