const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

const FILES = [
  'aicut_blog_fp_main.png',
  'aicut_blog_fp_card1.png',
  'aicut_blog_fp_card2.png',
  'aicut_blog_fp_card3.png',
  'aicut_blog_fp_cta.png'
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 현재 이미지 상태 확인
  const before = await wp.evaluate(() => document.querySelectorAll('img').length);
  console.log('업로드 전 이미지 수:', before);

  for (const f of FILES) {
    const fullPath = path.join(WS, f);
    console.log(`\n📤 업로드: ${f}`);

    // filechooser 이벤트 리스너 설정
    const fcPromise = wp.waitForEvent('filechooser', { timeout: 10000 });
    
    // 사진 버튼 클릭
    await wp.locator('.se-document-toolbar-basic-button').filter({ hasText: '사진' }).first().click();
    await wp.waitForTimeout(500);

    const fc = await fcPromise;
    await fc.setFiles([fullPath]);
    await wp.waitForTimeout(3000);

    const imgCount = await wp.evaluate(() => document.querySelectorAll('img').length);
    console.log(`  ✅ 업로드 완료 (전체 이미지: ${imgCount}개)`);
  }

  // 최종 확인
  const finalImgs = await wp.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map((img, i) => ({
      i, src: (img.src || '').substring(0, 120),
      w: img.naturalWidth, h: img.naturalHeight
    }));
  });
  console.log('\n=== 최종 이미지 목록 ===');
  finalImgs.forEach(img => console.log(`[${img.i}] ${img.w}x${img.h} ${img.src}`));

  await wp.screenshot({ path: path.join(WS, '_se_all_images.png') });
  console.log('\n✅ 스크린샷 저장');

  await b.close();
}
main().catch(e => console.error('❌', e.message));
