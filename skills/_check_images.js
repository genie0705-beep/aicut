// details 페이지 이미지 개수 확인
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/details/')) {
      page = p;
      break;
    }
  }
  if (!page) {
    console.log('❌ create/details/ 탭이 없습니다.');
    await b.disconnect();
    return;
  }
  
  console.log('확인 중:', page.url());
  
  // 이미지 개수 확인
  const check = await page.evaluate(() => {
    const result = {};
    
    // 1. 하단 filmstrip (썸네일 목록)
    const filmstrip = document.querySelector('[role="list"], [role="listbox"]');
    result.filmstripExists = !!filmstrip;
    result.filmstripItems = filmstrip ? filmstrip.children.length : 0;
    
    // 2. 이미지 슬라이더 dots/indicators
    const dots = document.querySelectorAll('[role="tab"], [role="radio"], [aria-label*="page"], [class*="dot"], [class*="indicator"]');
    result.dots = dots.length;
    
    // 3. 버튼 내 이미지 개수
    const imgButtons = document.querySelectorAll('button img');
    result.imgButtons = Array.from(imgButtons).filter(i => i.alt && !i.alt.includes('프로필')).length;
    
    // 4. "삭제" 버튼 개수 (이미지 1장당 1개)
    const delBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText === '삭제').length;
    result.deleteButtons = delBtns;
    
    // 5. 이미지 좌우 화살표 버튼 확인
    const arrows = Array.from(document.querySelectorAll('button')).filter(b => {
      const svg = b.querySelector('svg');
      if (!svg) return false;
      const label = svg.getAttribute('aria-label') || '';
      return label.includes('다음') || label.includes('이전') || label.includes('Next') || label.includes('Previous');
    });
    result.arrows = arrows.length;
    
    // 6. alt="업로드할 사진 미리 보기" 개수
    const previewImgs = document.querySelectorAll('img[alt="업로드할 사진 미리 보기"]');
    result.previewImages = previewImgs.length;
    
    // 7. 하단 썸네일 이미지 (작은 이미지들)
    const allImgs = document.querySelectorAll('img');
    const thumbnails = Array.from(allImgs).filter(img => {
      const rect = img.getBoundingClientRect();
      return rect.width < 100 && rect.height < 100 && img.alt;
    });
    result.thumbnails = thumbnails.length;
    result.thumbnailAlts = thumbnails.map(t => t.alt).slice(0, 10);
    
    // 8. 이미지 표시 영역이 2개 이상 있는지 (여러 장 indicator)
    const imageContainers = document.querySelectorAll('[style*="translateX"], [style*="transform"]');
    result.imageContainers = imageContainers.length;
    
    return result;
  });
  
  console.log('\n=== 이미지 개수 체크 결과 ===');
  Object.entries(check).forEach(([k, v]) => console.log(`  ${k}: ${JSON.stringify(v)}`));
  
  // 총평
  if (check.deleteButtons >= 5) {
    console.log('\n✅ 이미지 5장 정상 업로드 확인! (삭제 버튼 5개)');
  } else if (check.previewImages >= 5) {
    console.log('\n✅ 이미지 5장 정상 업로드 확인! (미리보기 이미지 5개)');
  } else if (check.filmstripItems >= 5) {
    console.log('\n✅ 이미지 5장 정상 업로드 확인! (썸네일 목록 5개)');
  } else {
    console.log(`\n⚠️ 확인 필요: 삭제 ${check.deleteButtons}개, filmstrip ${check.filmstripItems}개, preview ${check.previewImages}개`);
  }
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
