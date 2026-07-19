const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  const result = await wp.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    let fixed = 0, skipped = 0;

    imgs.forEach((img, i) => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      
      // 대표 이미지(700x700)는 제외
      if (nw === 700 && nh === 700) {
        skipped++;
        return;
      }

      // 본문 카드 이미지 (600x338)만 수정
      if ((nw === 600 && nh === 338) || nh === 338) {
        // 1. 고정 width 속성 제거
        img.removeAttribute('width');
        img.removeAttribute('height');
        
        // 2. CSS로 100% 설정
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxWidth = '100%';
        img.style.display = 'block';
        
        // 3. 부모 컨테이너에도 max-width 전파
        const parent = img.parentElement;
        if (parent) {
          parent.style.width = '100%';
          parent.style.maxWidth = '100%';
        }
        
        // 4. 상위 component 컨테이너에도 적용
        const comp = img.closest('[class*="component"]');
        if (comp) {
          comp.style.width = '100%';
          comp.style.maxWidth = '100%';
          const content = comp.querySelector('.se-component-content');
          if (content) {
            content.style.width = '100%';
            content.style.maxWidth = '100%';
          }
        }
        
        // 5. SE4에 변경 알림
        const layer = document.querySelector('.se-canvas-layer');
        if (layer) layer.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
        
        fixed++;
      }
    });

    return { fixed, skipped };
  });

  console.log('✅ 모바일 최적화 완료');
  console.log('  수정된 이미지: ' + result.fixed + '장 (600×338 카드들)');
  console.log('  유지된 이미지: ' + result.skipped + '장 (700×700 대표)');

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1000);
  console.log('💾 저장 완료');

  // 재확인
  const verify = await wp.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map((img, i) => ({
      i,
      size: img.naturalWidth + 'x' + img.naturalHeight,
      style: img.getAttribute('style'),
      hasWidthAttr: img.hasAttribute('width'),
      hasHeightAttr: img.hasAttribute('height')
    }));
  });

  console.log('\n=== 최종 이미지 상태 ===');
  verify.forEach(v => console.log(`  [${v.i}] ${v.size} | style="${v.style || '(없음)'}" | widthAttr=${v.hasWidthAttr} heightAttr=${v.hasHeightAttr}`));

  await b.close();
}
main().catch(e => console.error('❌', e.message));
