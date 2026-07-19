const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  const result = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let splitCount = 0;

    paras.forEach(p => {
      const text = (p.textContent || '').trim();
      if (text.length <= 80) return; // 80자 이하는 통과
      if (text.startsWith('#')) return; // 해시태그 줄은 제외

      // . 또는 — 기준으로 분할 (2문장 이상일 때만)
      const sentences = text.split(/(?<=[다요].)/g)
        .map(s => s.trim())
        .filter(s => s.length > 5);

      if (sentences.length >= 2) {
        // 첫 번째 문장은 기존 p에 유지
        p.textContent = sentences[0];
        p.style.textAlign = 'center';
        
        // 나머지는 새 p로 추가
        const parent = p.parentNode;
        for (let i = 1; i < sentences.length; i++) {
          const np = document.createElement('p');
          np.textContent = sentences[i];
          np.style.textAlign = 'center';
          np.className = p.className;
          parent.insertBefore(np, p.nextSibling);
          splitCount++;
        }
      }
    });

    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return splitCount;
  });
  console.log('1. ' + result + '개 문단 분할 완료');

  await wp.waitForTimeout(500);
  
  // Strong 재적용 (새 문단에 키워드 굵게)
  await wp.evaluate(() => {
    const kws = ['영상편집외주', '숏폼 마케팅', '숏폼', '보험 마케팅', 'FP 브랜딩', '하반기'];
    const paras = document.querySelectorAll('.se-text-paragraph');
    paras.forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => {
        const re = new RegExp('(?![^<]*>)(' + kw + ')', 'g');
        html = html.replace(re, '<strong>$1</strong>');
      });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  console.log('2. Strong 재적용 완료');

  // 최종 검증
  const final = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const paras = document.querySelectorAll('.se-text-paragraph, h2');
    const h2Texts = new Set(Array.from(document.querySelectorAll('h2')).map(h => h.textContent));
    const textParas = Array.from(paras).filter(p => {
      const t = (p.textContent || '').trim();
      return t.length > 0 && !h2Texts.has(t) && !t.startsWith('#');
    });
    const lens = textParas.map(p => (p.textContent || '').length);
    const over70 = lens.filter(l => l > 70).length;
    const over90 = lens.filter(l => l > 90).length;
    const over100 = lens.filter(l => l > 100).length;
    const maxLen = Math.max(0, ...lens);
    const avg = Math.round(lens.reduce((a,b) => a+b, 0) / (lens.length || 1));

    // 오버 70 상세
    const over70texts = textParas
      .filter(p => (p.textContent || '').length > 70)
      .map(p => ({ len: (p.textContent || '').length, text: (p.textContent || '').trim().substring(0, 80) }))
      .sort((a, b) => b.len - a.len);

    return {
      totalParas: paras.length,
      textParasCount: textParas.length,
      avgLen: avg + '자',
      maxLen: maxLen + '자',
      over70: over70 + '개',
      over90: over90 + '개',
      over100: over100 + '개',
      over70Details: over70texts
    };
  });

  console.log('\n=== 최종 모바일 문단 분석 ===');
  console.log('  전체 문단: ' + final.totalParas + '개');
  console.log('  텍스트 문단: ' + final.textParasCount + '개');
  console.log('  평균 길이: ' + final.avgLen);
  console.log('  최대 길이: ' + final.maxLen);
  console.log('  70자 초과: ' + final.over70);
  console.log('  90자 초과: ' + final.over90);
  console.log('  100자 초과: ' + final.over100);
  
  if (final.over70Details.length > 0) {
    console.log('\n  70자 초과 문단:');
    final.over70Details.forEach(p => console.log('  [' + p.len + '자] ' + p.text));
  }

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(800);
  console.log('\n💾 저장 완료');

  await b.close();
}
main().catch(e => console.error('❌', e.message));
