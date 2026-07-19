const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('에디터 없음'); await b.close(); return; }

  // main, card2 이미지 업로드
  const files = ['aicut_blog_fp_main.png', 'aicut_blog_fp_card2.png'];
  
  for (const f of files) {
    const fullPath = path.join(WS, f);
    try {
      const [fc] = await Promise.all([
        wp.waitForEvent('filechooser', { timeout: 15000 }),
        wp.evaluate(() => document.querySelector('button.se-image-toolbar-button')?.click())
      ]);
      await fc.setFiles([fullPath]);
      await wp.waitForTimeout(2000);
      console.log('✅ ' + f + ' 업로드');
    } catch (e) {
      console.log('⚠️ ' + f + ' 실패');
    }
  }

  // alt 태그 재적용
  await wp.evaluate(() => {
    const altMap = {
      'main.png': '보험영업 사회초년생 숏폼 영상 편집 아웃소싱',
      'card2.png': '하반기 보험 영업 숏폼 영상 전략 영상편집'
    };
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || '';
      for (const [key, val] of Object.entries(altMap)) {
        if (src.includes(key.replace('.png','').substring(0,20))) {
          img.setAttribute('alt', val);
          if (img.naturalWidth !== 700) {
            img.removeAttribute('width'); img.removeAttribute('height');
            img.style.width = '100%'; img.style.height = 'auto';
            img.style.maxWidth = '100%'; img.style.display = 'block';
          }
          break;
        }
      }
    });
  });

  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);
  console.log('✅ 저장 완료');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
