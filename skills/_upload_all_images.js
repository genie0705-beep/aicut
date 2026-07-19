// 📸 SE4 이미지 업로드 — 3개 블로그 모두 처리
const { chromium } = require('playwright');
const path = require('path');
const WS = __dirname + '/..';

// 주제별 이미지 매핑 (len으로 구분)
const IMAGE_SETS = [
  { len: 1965, prefix: 'aicut_blog_july', label: '하반기 영상 마케팅' },
  { len: 1683, prefix: 'aicut_blog_ps', label: '성형외과' },
  { len: 1688, prefix: 'aicut_blog_dent', label: '치과' },
];

async function uploadImages(page, prefix, label) {
  console.log(`\n=== 📤 ${label} 이미지 업로드 ===`);
  
  await page.bringToFront();
  
  // 이미지 파일 목록
  const files = ['main', 'card1', 'card2', 'card3', 'cta'].map(s => `${prefix}_${s}.png`);
  
  for (const f of files) {
    const fullPath = path.join(WS, f);
    console.log(`  📤 ${f}...`);
    
    try {
      // filechooser 대기
      const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 });
      
      // 사진 버튼 찾기 (여러 선택자 시도)
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent.includes('사진') || btn.textContent.includes('photo') || 
              btn.getAttribute('title')?.includes('사진') || btn.className.includes('photo')) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      
      if (!clicked) {
        // fallback: toolbar 버튼
        await page.locator('.se-document-toolbar-basic-button').filter({ hasText: '사진' }).first().click();
      }
      await page.waitForTimeout(800);
      
      const fc = await fcPromise;
      await fc.setFiles([fullPath]);
      await page.waitForTimeout(3000); // 업로드 대기
      
      console.log(`    ✅ 완료`);
    } catch (e) {
      console.log(`    ⚠️ 실패: ${e.message}`);
    }
  }
  
  // 저장
  await page.evaluate(() => {
    const btn = document.querySelector('button.btn_submit');
    if (btn) btn.click();
  });
  console.log(`  💾 저장 완료`);
  await page.waitForTimeout(1500);
}

async function main() {
  console.log('📸 SE4 이미지 업로드 시작\n');
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // SE4 페이지 필터링
  const sePages = pages.filter(p => p.url().includes('PostWriteForm'));
  console.log('SE4 페이지 수:', sePages.length);
  
  for (const sp of sePages) {
    // 현재 글 길이 확인
    const len = await sp.evaluate(() => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        return se.getContentText().length;
      } catch(e) { return 0; }
    });
    
    // 매칭되는 이미지 세트 찾기
    const match = IMAGE_SETS.find(s => s.len === len);
    if (match) {
      await uploadImages(sp, match.prefix, match.label);
    } else {
      console.log(`❌ 매칭 안됨 (len: ${len})`);
    }
  }
  
  // 이미지 업로드 후 최종 상태 체크 (첫 번째 SE4 페이지)
  if (sePages.length > 0) {
    await sePages[0].bringToFront();
    await sePages[0].waitForTimeout(2000);
    const imgCount = await sePages[0].evaluate(() => document.querySelectorAll('img').length);
    console.log(`\n📊 첫 번째 글 최종 이미지 수: ${imgCount}개`);
    await sePages[0].screenshot({ path: path.join(WS, '_se_final_all.png'), fullPage: true });
  }
  
  console.log('\n✅ 전체 이미지 업로드 완료!');
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
