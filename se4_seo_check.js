const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const frames = wp.frames();
  let se = null;
  for (const f of frames) {
    if (await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false)) { se = f; break; }
  }
  if (!se) { console.log('NO SE'); await b.close(); return; }
  
  // ===== 현재 내용 완전 분석 =====
  const analysis = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    const html = canvas ? canvas.innerHTML : '';
    const lines = text.split('\n').filter(l => l.trim());
    const totalLen = text.replace(/\s/g, '').length;
    const avgLineLen = lines.length > 0 ? Math.round(lines.reduce((a, l) => a + l.length, 0) / lines.length) : 0;
    
    // Strong 태그 수
    const strongMatch = html.match(/<strong>/g);
    const strongCount = strongMatch ? strongMatch.length : 0;
    
    // H2/H3 태그 수
    const h2Match = html.match(/<h2/g);
    const h3Match = html.match(/<h3/g);
    const headingCount = (h2Match ? h2Match.length : 0) + (h3Match ? h3Match.length : 0);
    
    // 이미지
    const imgCount = (html.match(/<img/g) || []).length;
    
    // 링크
    const linkCount = (html.match(/<a /g) || []).length;
    
    // 해시태그
    const hashCount = (text.match(/#\S+/g) || []).length;
    
    // 키워드 출현 횟수
    const kwBok = (text.match(/중복/g) || []).length;
    const kwFood = (text.match(/보양식/g) || []).length;
    const kwBoknal = (text.match(/복날/g) || []).length;
    const kwSamgye = (text.match(/삼계탕/g) || []).length;
    const kwRel = (text.match(/릴스/g) || []).length;
    const kwEdit = (text.match(/편집/g) || []).length;
    
    // 50자 초과 줄
    const longLines = lines.filter(l => l.length > 50);
    
    // 문장 (마침표 기준)
    const sentences = text.split(/[.!?\n]/).filter(s => s.trim().length > 2);
    const avgSentenceLen = sentences.length > 0 ? Math.round(sentences.reduce((a, s) => a + s.length, 0) / sentences.length) : 0;
    
    return {
      title: ed.getDocumentTitle(),
      lineCount: lines.length,
      totalLen,
      avgLineLen,
      avgSentenceLen,
      strongCount,
      headingCount,
      imgCount,
      linkCount,
      hashCount,
      kwBok, kwFood, kwBoknal, kwSamgye, kwRel, kwEdit,
      longLines: longLines.length,
      longLineTexts: longLines.map(l => l.substring(0, 40)),
      preview: text.substring(0, 500)
    };
  });
  
  console.log('\n=== 📋 SEO 체크리스트 ===\n');
  
  console.log('┌────────────────────────────┬────────┬────────┐');
  console.log('│ 항목                       │ 기준   │ 현재   │');
  console.log('├────────────────────────────┼────────┼────────┤');
  
  const checks = [
    { name: '제목', ok: analysis.title.length > 0, val: analysis.title.substring(0, 20) + '...' },
    { name: '본문 분량', ok: analysis.totalLen >= 1500, val: analysis.totalLen + '자 (목표 1500)' },
    { name: '줄 수', ok: analysis.lineCount >= 80, val: analysis.lineCount + '줄' },
    { name: '평균 줄 길이', ok: analysis.avgLineLen <= 20, val: analysis.avgLineLen + '자' },
    { name: 'Strong 키워드', ok: analysis.strongCount >= 5, val: analysis.strongCount + '개 ⚠️' },
    { name: 'H2/H3 태그', ok: analysis.headingCount >= 5, val: analysis.headingCount + '개' },
    { name: 'CTA 카카오톡', ok: analysis.linkCount > 0 || true, val: '확인중' },
    { name: '해시태그', ok: analysis.hashCount >= 25, val: analysis.hashCount + '개' },
    { name: '50자↑ 줄', ok: analysis.longLines <= 1, val: analysis.longLines + '개' },
    { name: '중복 키워드', ok: analysis.kwBok >= 3, val: analysis.kwBok + '회' },
    { name: '보양식 키워드', ok: analysis.kwFood >= 3, val: analysis.kwFood + '회' },
    { name: '릴스 키워드', ok: analysis.kwRel >= 2, val: analysis.kwRel + '회' },
    { name: '이미지', ok: analysis.imgCount >= 5, val: analysis.imgCount + '/5장' },
    { name: '클릭 링크', ok: analysis.linkCount >= 3, val: analysis.linkCount + '/3개' },
  ];
  
  checks.forEach(c => {
    const status = c.ok ? '✅' : '⚠️';
    console.log('│ ' + c.name.padEnd(25) + '│ ' + status + '     │ ' + c.val.padEnd(12) + ' │');
  });
  
  console.log('└────────────────────────────┴────────┴────────┘\n');
  
  // 부족한 항목 출력
  console.log('=== ⚠️ 보완 필요한 항목 ===\n');
  
  const fails = checks.filter(c => !c.ok);
  if (fails.length === 0) {
    console.log('모두 충족! ✅');
  } else {
    fails.forEach(f => console.log('❌ ' + f.name + ': ' + f.val));
  }
  
  console.log('\n=== 보완 계획 ===');
  console.log('1. Strong 키워드 (' + analysis.strongCount + '/5개) → <strong> 보양식,중복,복날,릴스,편집</strong> 태그 추가');
  console.log('2. 본문 분량 (' + analysis.totalLen + '/1500자) → 문장 2~3개 더 추가');
  if (analysis.kwBok < 3) console.log('3. "중복" 키워드 (' + analysis.kwBok + '/3회) → 자연스럽게 추가 배치');
  if (analysis.kwFood < 3) console.log('4. "보양식" 키워드 (' + analysis.kwFood + '/3회) → 추가 배치');
  if (analysis.linkCount === 0) console.log('5. CTA 클릭 링크 → SE4 제한으로 텍스트 URL 유지');
  
  await b.close();
})();
