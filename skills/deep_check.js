const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  
  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const lines = ft.split('\n');
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');

    // 문제 탐지
    const issues = [];

    // 1. 연속된 빈 줄 (3개 이상)
    let emptyRun = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '') {
        emptyRun++;
        if (emptyRun >= 4) {
          issues.push('연속 빈줄 ' + emptyRun + '개 (라인 ' + (i - emptyRun + 1) + '~' + i + ')');
          emptyRun = 0;
        }
      } else {
        if (emptyRun >= 4) {
          issues.push('연속 빈줄 ' + emptyRun + '개 종료');
        }
        emptyRun = 0;
      }
    }

    // 2. 한 줄에 너무 많은 해시태그 (300자 이상인 경우)
    lines.forEach((line, i) => {
      if (line.length > 200 && line.startsWith('#')) {
        issues.push('해시태그 줄 ' + line.length + '자 (정상)');
      }
    });

    // 3. H2가 아닌데 60자 이상인 문단
    const h2Texts = new Set(Array.from(document.querySelectorAll('h2')).map(h => h.textContent));
    Array.from(paras).forEach(p => {
      const t = (p.textContent || '').trim();
      if (t.length > 60 && !h2Texts.has(t) && !t.startsWith('#')) {
        issues.push('60자↑ 일반문단: ' + t.substring(0, 60));
      }
    });

    // 4. 이미지 주변 구조
    const imgCount = imgs.length;
    
    // 5. 각 섹션이 제대로 분리되었는지
    const sections = ['☀️', '📋', '✅ 영상', '🎯'];
    const found = sections.filter(s => ft.includes(s));

    return {
      lines: lines.length,
      chars: ft.length,
      imgCount,
      issues: issues.slice(0, 15),
      foundSections: found,
      fullText: lines
    };
  });

  console.log('=== 상세 분석 ===');
  console.log('줄:', r.lines, '| 글자:', r.chars, '| 이미지:', r.imgCount);
  console.log('섹션 발견:', r.foundSections.join(', '));

  if (r.issues.length === 0) {
    console.log('\n✅ 발견된 문제 없음');
    console.log('=== 전체 텍스트 구조 ===');
    r.fullText.forEach((line, i) => {
      const marker = line.startsWith('☀') || line.startsWith('📋') || line.startsWith('✅ 영') || line.startsWith('🎯') ? '▶ ' : '  ';
      if (line !== '' || (i > 0 && r.fullText[i-1] !== '')) {
        console.log(marker + '[' + i + '] ' + line);
      }
    });
  } else {
    console.log('\n⚠️ 발견된 문제:');
    r.issues.forEach((issue, i) => console.log('  ' + (i+1) + '. ' + issue));
  }

  await b.close();
}
main().catch(e => console.error('❌', e.message));
