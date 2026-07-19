const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('에디터 없음'); await b.close(); return; }

  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const lines = ft.split('\n');
    const paras = document.querySelectorAll('.se-text-paragraph');
    const imgs = document.querySelectorAll('img');
    const h2s = document.querySelectorAll('h2');
    const strongs = document.querySelectorAll('strong, b');
    const titleEl = document.querySelector('input[placeholder*="제목"]');

    // 문단 통계
    const textParas = Array.from(paras).filter(p => {
      const t = (p.textContent || '').trim();
      return t.length > 3 && !t.startsWith('#');
    });
    const lens = textParas.map(p => (p.textContent || '').length);
    const avg = lens.length ? Math.round(lens.reduce((a,b) => a+b, 0) / lens.length) : 0;
    const over50 = lens.filter(l => l > 50).length;
    const over70 = lens.filter(l => l > 70).length;
    const maxLen = lens.length ? Math.max(...lens) : 0;

    // 이미지
    const imgInfo = Array.from(imgs).map((img, i) => ({
      i, size: img.naturalWidth + 'x' + img.naturalHeight,
      alt: img.getAttribute('alt') || '(없음)',
      responsive: img.style.width === '100%' ? '✅' : (img.naturalWidth === 700 ? '대표유지' : '⚠️ 고정')
    }));

    // 키워드
    const kw = {
      '영상편집외주': (ft.match(/영상편집외주/g) || []).length,
      '숏폼': (ft.match(/숏폼/g) || []).length,
      'FP 브랜딩': (ft.match(/FP 브랜딩/g) || []).length,
      '하반기': (ft.match(/하반기/g) || []).length,
    };

    // CTA / 해시태그
    const ctaOk = ft.includes('pf.kakao.com') && ft.includes('master@aicut.co.kr') && ft.includes('aicut.co.kr');
    const hashCount = (ft.match(/#[가-힣a-zA-Z]+/g) || []).length;

    // 줄바꿈 검증
    const hasMerge = ft.includes('알려드립니다.☀') || ft.includes('되었습니다.📋') || ft.includes('됩니다.🎯');
    const emptyLineOk = lines.filter(l => l === '').length > 10; // 빈 줄이 10개 이상이면 줄바꿈 정상

    // 정렬
    const centerOk = Array.from(paras).filter(p => p.style.textAlign === 'center').length;

    return {
      // 기본
      title: titleEl ? titleEl.value : '(미확인)',
      contentLen: ft.length + '자',
      lines: lines.length + '줄',
      paras: paras.length + '개',
      imgs: imgs.length + '장',
      h2: h2s.length + '개',
      strong: strongs.length + '개',

      // 이미지 상세
      imgDetails: imgInfo,

      // 문단
      avgLen: avg + '자',
      maxLen: maxLen + '자',
      over50: over50 + '개',
      over70: over70 + '개',

      // SEO
      keywords: kw,
      hashtag: hashCount + '개',
      cta: ctaOk ? '✅ 3종 완료' : '⚠️ 누락',

      // 구조
      centerAligned: centerOk + '/' + paras.length,
      lineBreakOk: !hasMerge && emptyLineOk,

      // H2 텍스트
      h2Texts: Array.from(h2s).map(h => h.textContent)
    };
  });

  // === 출력 ===
  console.log('='.repeat(50));
  console.log('  📋 최종 상태 체크리스트');
  console.log('='.repeat(50));

  const checks = [];
  
  // 1. 제목
  console.log('\n📌 기본 정보');
  console.log('  제목:', r.title);
  checks.push({ item: '제목 설정', ok: !!r.title && r.title.length > 10 });
  
  console.log('  본문:', r.contentLen + ' / ' + r.lines + ' / ' + r.paras);
  console.log('  이미지:', r.imgs + ' / H2:', r.h2 + ' / Strong:', r.strong);
  checks.push({ item: '본문 분량 1,500자↑', ok: parseInt(r.contentLen) >= 1500 });
  checks.push({ item: 'H2 2개↑', ok: parseInt(r.h2) >= 2 });
  checks.push({ item: 'Strong 5개↑', ok: parseInt(r.strong) >= 5 });
  checks.push({ item: '이미지 5장', ok: parseInt(r.imgs) >= 5 });

  // 2. 모바일
  console.log('\n📱 모바일 최적화');
  console.log('  평균문단:', r.avgLen + ' / 최대:', r.maxLen);
  console.log('  50자초과:', r.over50 + ' / 70자초과:', r.over70);
  checks.push({ item: '70자 초과 0개', ok: parseInt(r.over70) === 0 });
  checks.push({ item: '평균 문단 2~3줄(35자↓)', ok: parseInt(r.avgLen) <= 35 });

  // 이미지
  console.log('\n🖼️ 이미지 상태');
  r.imgDetails.forEach(img => {
    console.log('  [' + img.i + '] ' + img.size + ' alt="' + img.alt + '" ' + img.responsive);
  });
  const imgAltOk = r.imgDetails.filter(i => i.alt && i.alt.length > 5).length;
  const imgRespOk = r.imgDetails.filter(i => i.responsive === '✅').length;
  checks.push({ item: '이미지 alt 태그 모두 있음', ok: imgAltOk >= 5 });
  checks.push({ item: '본문 이미지 반응형(대표제외)', ok: imgRespOk >= 4 });

  // 3. SEO
  console.log('\n🔑 키워드');
  Object.entries(r.keywords).forEach(([k, v]) => {
    console.log('  ' + k + ': ' + v + '회');
  });
  console.log('  해시태그:', r.hashtag);
  console.log('  CTA:', r.cta);
  checks.push({ item: '영상편집외주 3회↑', ok: r.keywords['영상편집외주'] >= 3 });
  checks.push({ item: '숏폼 5회↑', ok: r.keywords['숏폼'] >= 5 });
  checks.push({ item: 'FP 브랜딩 3회↑', ok: r.keywords['FP 브랜딩'] >= 3 });
  checks.push({ item: '하반기 3회↑', ok: r.keywords['하반기'] >= 3 });
  checks.push({ item: '해시태그 30개', ok: parseInt(r.hashtag) >= 29 });
  checks.push({ item: 'CTA 3종', ok: r.cta.includes('✅') });

  // 4. 구조
  console.log('\n📐 구조');
  console.log('  센터정렬:', r.centerAligned);
  console.log('  줄바꿈:', r.lineBreakOk ? '✅ 정상' : '⚠️ 문제');
  console.log('  H2 목록:', r.h2Texts.join(' | '));
  checks.push({ item: '전체 센터 정렬', ok: r.centerAligned.startsWith(r.paras.split('/')[0] + '/') });
  checks.push({ item: '줄바꿈(문장 붙음 없음)', ok: r.lineBreakOk });

  // === 종합 ===
  const total = checks.length;
  const passed = checks.filter(c => c.ok).length;
  const failed = checks.filter(c => !c.ok);

  console.log('\n' + '='.repeat(50));
  console.log('  📊 종합: ' + passed + '/' + total + ' 항목 통과');
  if (failed.length === 0) {
    console.log('  ✅ 모든 항목 통과 — 추가 보완 불필요');
  } else {
    console.log('  ⚠️ 미통과 항목:');
    failed.forEach(f => console.log('    - ' + f.item));
  }
  console.log('='.repeat(50));

  await b.close();
}
main().catch(e => console.error('❌', e.message));
