const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  const result = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const issues = [];
    const canvas = document.querySelector('.se-canvas-layer');

    // 1. 컴포넌트 순서
    let compOrder = [];
    if (canvas) {
      // 모든 최상위 자식 (텍스트/이미지/빈줄 div 등)
      const children = canvas.children;
      compOrder = Array.from(children).map(el => {
        const cls = el.className || '';
        const tag = el.tagName;
        const hasImg = !!el.querySelector('img');
        const text = (el.textContent || '').trim().substring(0, 40);
        
        if (hasImg) return '[이미지]';
        if (tag === 'DIV' && text.startsWith('사진 설명')) return '[이미지-캡션]';
        if (tag === 'DIV' && text.length === 0) return '[빈줄]';
        if (tag === 'H2') return '[H2] ' + text;
        if (text) return '[텍스트] ' + text;
        return '[' + tag + '] ' + cls.substring(0, 30);
      });
      
      // 연속 이미지 체크
      for (let i = 1; i < compOrder.length; i++) {
        if (compOrder[i].includes('[이미지]') && compOrder[i-1].includes('[이미지]')) {
          issues.push('⚠️ 이미지 2장 연속 배치됨 (인덱스 ' + (i-1) + ', ' + i + ')');
        }
      }
    }

    // 2. 이미지
    const imgs = document.querySelectorAll('img');
    imgs.forEach((img, i) => {
      if (img.naturalWidth === 0) issues.push('⚠️ 이미지[' + i + '] 로딩 실패');
      const alt = img.getAttribute('alt');
      if (!alt || alt.length < 5) issues.push('⚠️ 이미지[' + i + '] alt 부족: "' + alt + '"');
      const r = img.getBoundingClientRect();
      if (r.width < 50) issues.push('⚠️ 이미지[' + i + '] 너무 작음: ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });

    // 3. 정렬
    const paras = document.querySelectorAll('.se-text-paragraph');
    let centerOk = 0, centerNo = 0;
    paras.forEach(p => {
      if (p.style.textAlign === 'center' || p.classList.contains('se-text-paragraph-align-center')) {
        centerOk++;
      } else if ((p.textContent || '').trim().length > 5) {
        centerNo++;
      }
    });

    // 4. 최대 문단 길이
    const lens = Array.from(paras).map(p => (p.textContent || '').length);
    const maxLen = Math.max(0, ...lens);
    const avgLen = lens.length ? Math.round(lens.reduce((a,b) => a+b, 0) / lens.length) : 0;
    const over50 = lens.filter(l => l > 50).length;
    const over70 = lens.filter(l => l > 70).length;

    // 5. H2
    const h2s = document.querySelectorAll('h2');

    // 6. 제목
    const titleInput = document.querySelector('input[placeholder*="제목"]');
    const title = titleInput ? titleInput.value : '(미확인)';

    return {
      issues,
      componentOrder: compOrder,
      imgCount: imgs.length,
      imgSizes: Array.from(imgs).map(img => img.naturalWidth + 'x' + img.naturalHeight),
      paraCount: paras.length,
      centerAligned: centerOk,
      notAligned: centerNo,
      h2Count: h2s.length,
      avgParaLen: avgLen + '자',
      maxParaLen: maxLen + '자',
      over50: over50 + '개',
      over70: over70 + '개',
      title: title
    };
  });

  console.log('=== 에디터 시각 분석 ===\n');

  if (result.issues.length === 0) {
    console.log('✅ 시각적 문제 없음');
  } else {
    console.log('⚠️ 발견된 이슈:');
    result.issues.forEach(i => console.log('  ' + i));
  }

  console.log('\n=== 컴포넌트 배치 순서 (상위 20개) ===');
  result.componentOrder.slice(0, 20).forEach((c, i) => console.log('[' + i + '] ' + c));

  console.log('\n=== 통계 ===');
  console.log('  이미지: ' + result.imgCount + '장 (' + result.imgSizes.join(', ') + ')');
  console.log('  문단: ' + result.paraCount + '개');
  console.log('  센터정렬: ' + result.centerAligned + '/' + result.paraCount);
  console.log('  정렬누락(5자↑): ' + result.notAligned + '개');
  console.log('  H2: ' + result.h2Count + '개');
  console.log('  평균문단길이: ' + result.avgParaLen);
  console.log('  최대문단길이: ' + result.maxParaLen);
  console.log('  50자초과: ' + result.over50);
  console.log('  70자초과: ' + result.over70);
  console.log('  제목: "' + result.title + '"');

  await b.close();
}
main().catch(e => console.error('❌', e.message));
