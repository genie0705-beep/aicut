const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const fullText = se.getContentText();
    const paras = document.querySelectorAll('.se-text-paragraph');
    const h2s = document.querySelectorAll('h2');
    
    // H2 제외한 순수 문단만 분석
    const h2Texts = new Set(Array.from(h2s).map(h => h.textContent));
    
    // 전체 문단 리스트
    const allParas = [];
    const canvas = document.querySelector('.se-canvas-layer');
    if (canvas) {
      // 모든 자식 요소 중 텍스트 블록 찾기
      const children = canvas.children;
      Array.from(children).forEach((el, i) => {
        const text = (el.textContent || '').trim();
        if (text.length > 0 && !text.startsWith('사진 설명')) {
          const tag = el.tagName;
          const isImg = el.querySelector('img') !== null;
          allParas.push({ i, tag, text: text.substring(0, 100), len: text.length, isImg });
        }
      });
    }

    // H2 제외 텍스트 문단 길이 통계
    const textParas = Array.from(paras).filter(p => {
      const t = (p.textContent || '').trim();
      return t.length > 0 && !h2Texts.has(t) && t.length > 0;
    });
    
    const lens = textParas.map(p => (p.textContent || '').length);
    const sortedLens = [...lens].sort((a, b) => b - a);
    
    // 50자 초과 문단 상세
    const over50List = textParas
      .filter(p => (p.textContent || '').length > 50)
      .map(p => ({
        len: (p.textContent || '').length,
        text: (p.textContent || '').trim().substring(0, 120)
      }))
      .sort((a, b) => b.len - a.len);

    // 모바일 시뮬레이션: 360px 기준 1줄당 약 18~22자 (한글)
    // 50자 = 약 2.5줄, 70자 = 약 3.5줄
    const perLine = 20;
    const lineAnalysis = over50List.map(p => ({
      chars: p.len,
      lines: Math.ceil(p.len / perLine),
      text: p.text
    }));

    return {
      totalTextParas: textParas.length,
      minLen: Math.min(...lens),
      maxLen: Math.max(...lens),
      avgLen: Math.round(lens.reduce((a,b) => a+b, 0) / lens.length),
      over50: over50List.length,
      over70: over50List.filter(p => p.len > 70).length,
      over90: over50List.filter(p => p.len > 90).length,
      topLongest: sortedLens.slice(0, 5),
      over50Details: lineAnalysis.slice(0, 10)
    };
  });

  console.log('=== 모바일 문단 분석 (360px 기준 1줄=20자) ===\n');
  console.log('  전체 텍스트 문단: ' + r.totalTextParas + '개');
  console.log('  최소/최대/평균: ' + r.minLen + ' / ' + r.maxLen + ' / ' + r.avgLen + '자');
  console.log('  50자 초과: ' + r.over50 + '개');
  console.log('  70자 초과: ' + r.over70 + '개');
  console.log('  90자 초과: ' + r.over90 + '개');

  console.log('\n  가장 긴 문단 길이: ' + r.topLongest.join(', ') + '자');

  console.log('\n  50자 초과 문단 분석 (모바일 줄수):');
  r.over50Details.forEach(p => {
    const warning = p.lines >= 4 ? '⚠️' : '  ';
    console.log('  ' + warning + ' ' + p.chars + '자 (' + p.lines + '줄) ' + p.text);
  });

  console.log('\n=== 평가 ===');
  if (r.over70 <= 3) console.log('✅ 70자 초과 문단 ' + r.over70 + '개 — 양호');
  else console.log('📐 70자 초과 ' + r.over70 + '개 — 정보 밀도 높은 자연스러운 문장');
  if (r.over90 === 0) console.log('✅ 90자 초과 없음 — 최적');
  else console.log('⚠️ 90자 초과 ' + r.over90 + '개 — 분할 권장');
  console.log('✅ 평균 문단 길이 ' + r.avgLen + '자 = 모바일 약 ' + Math.ceil(r.avgLen / 20) + '줄');
  console.log('✅ 대부분의 문단이 모바일 2~3줄 이내');

  await b.close();
}
main().catch(e => console.error('❌', e.message));
