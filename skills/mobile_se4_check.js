const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  // PC 화면 버튼 클릭 (모바일 뷰로 전환)
  const btn = wp.locator('button.se-util-button.__mode-button');
  if (await btn.isVisible()) {
    await btn.click();
    await wp.waitForTimeout(2000);
    console.log('✅ 모바일 뷰 모드로 전환');
  } else {
    console.log('❌ PC 화면 버튼 없음');
    await b.close();
    return;
  }

  // 모바일 뷰에서 렌더링 확인
  const r = await wp.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const canvas = document.querySelector('.se-canvas');
    const paras = document.querySelectorAll('.se-text-paragraph');
    const imgs = document.querySelectorAll('img');
    const h2s = document.querySelectorAll('h2');

    // 이미지 렌더링
    const imgStats = Array.from(imgs).map((img, i) => {
      const r = img.getBoundingClientRect();
      return {
        i,
        size: img.naturalWidth + 'x' + img.naturalHeight,
        rendered: Math.round(r.width) + 'x' + Math.round(r.height),
        inView: r.right <= vw + 2 && r.left >= -2,
        hasStyle: (img.getAttribute('style') || '').includes('width: 100%') ? '반응형' : '고정'
      };
    });

    // 텍스트 문단
    const textParas = Array.from(paras).filter(p => {
      const t = (p.textContent || '').trim();
      return t.length > 0 && !t.startsWith('#');
    });
    const lens = textParas.map(p => (p.textContent || '').length);
    const over50 = lens.filter(l => l > 50).length;
    const over60 = lens.filter(l => l > 60).length;
    const over70 = lens.filter(l => l > 70).length;
    const avgLen = Math.round(lens.reduce((a,b) => a+b, 0) / lens.length);
    const maxLen = lens.length ? Math.max(...lens) : 0;

    // H2확인
    const h2texts = Array.from(h2s).map(h => h.textContent);

    return {
      viewport: vw + 'x' + vh,
      contentLen: textParas.length,
      avgLen: avgLen + '자',
      maxLen: maxLen + '자',
      over50, over60, over70,
      canvasWidth: canvas ? Math.round(canvas.getBoundingClientRect().width) + 'px' : '없음',
      imgCount: imgs.length,
      imgOk: imgStats.filter(i => i.inView).length,
      imgStats,
      h2s: h2texts
    };
  });

  console.log('=== 📱 SE4 모바일 뷰 모드 체크 ===\n');
  console.log('뷰포트: ' + r.viewport);
  console.log('캔버스 너비: ' + r.canvasWidth);
  console.log('\n텍스트:');
  console.log('  문단: ' + r.contentLen + '개');
  console.log('  평균: ' + r.avgLen + ' / 최대: ' + r.maxLen);
  console.log('  50자↑: ' + r.over50 + ' / 60자↑: ' + r.over60 + ' / 70자↑: ' + r.over70);
  console.log('\n이미지:');
  r.imgStats.forEach(img => {
    const ok = img.inView ? '✅' : '❌';
    console.log('  ' + ok + ' [' + img.i + '] ' + img.size + ' → ' + img.rendered + ' ' + img.hasStyle);
  });
  console.log('\nH2:');
  r.h2s.forEach(h => console.log('  ✅ ' + h));

  await wp.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\_mobile_se4_view.png' });
  console.log('\n📸 모바일 뷰 스크린샷 저장');

  // 원래 PC 화면으로 복구
  await btn.click();
  await wp.waitForTimeout(500);
  console.log('✅ PC 화면으로 복구');

  await b.close();
}
main().catch(e => console.error('❌', e.message));
