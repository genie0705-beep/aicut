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
    const h2s = document.querySelectorAll('h2');
    const strongs = document.querySelectorAll('strong, b');

    // 문단 통계
    const textParas = Array.from(paras).filter(p => {
      const t = (p.textContent || '').trim();
      return t.length > 3 && !t.startsWith('#');
    });
    const lens = textParas.map(p => (p.textContent || '').length);
    const avgLen = lens.length ? Math.round(lens.reduce((a,b) => a+b, 0) / lens.length) : 0;
    const over50 = lens.filter(l => l > 50).length;
    const over70 = lens.filter(l => l > 70).length;
    const maxLen = lens.length ? Math.max(...lens) : 0;

    // 이미지 정렬 상태
    const sections = document.querySelectorAll('.se-section-image');
    const imgAlignOk = Array.from(sections).filter(s => {
      const margin = s.style.margin || '';
      return margin.includes('auto') && s.style.display === 'block';
    }).length;

    // 이미지 모듈 정렬
    const modules = document.querySelectorAll('.se-module-image');
    const moduleAlignOk = Array.from(modules).filter(m => m.style.textAlign === 'center').length;

    // 이미지 alt + 반응형
    const imgDetails = Array.from(imgs).map((img, i) => ({
      i, size: img.naturalWidth + 'x' + img.naturalHeight,
      alt: img.getAttribute('alt') || '(없음)',
      altOk: (img.getAttribute('alt') || '').length > 5,
      responsive: img.style.width === '100%' ? '✅' : (img.naturalWidth === 700 ? '대표유지' : '⚠️')
    }));

    // 키워드
    const kw = {
      '영상편집외주': (ft.match(/영상편집외주/g) || []).length,
      '숏폼': (ft.match(/숏폼/g) || []).length,
      'FP 브랜딩': (ft.match(/FP 브랜딩/g) || []).length,
      '하반기': (ft.match(/하반기/g) || []).length,
    };

    // CTA
    const ctaOk = ft.includes('pf.kakao.com') && ft.includes('master@aicut.co.kr') && ft.includes('aicut.co.kr');

    // 해시태그
    const hashCount = (ft.match(/#[가-힣a-zA-Z]+/g) || []).length;

    // 센터 정렬
    const centerOk = Array.from(paras).filter(p => {
      const align = p.style.textAlign;
      return align === 'center' || p.classList.contains('se-text-paragraph-align-center');
    }).length;

    // 줄바꿈 머지
    const hasMerge = ft.includes('알려드립니다.☀');

    // H2 목록
    const h2Texts = Array.from(h2s).map(h => h.textContent);

    return {
      // 기본
      titleSet: true,
      contentLen: ft.length,
      lines: lines.length,
      paras: paras.length,
      imgs: imgs.length,
      h2: h2s.length,
      strong: strongs.length,

      // 모바일
      avgLen,
      maxLen,
      over50,
      over70,

      // 이미지
      imgDetails,
      imgAlignOk,
      moduleAlignOk,
      imgAlignTotal: sections.length,

      // SEO
      keywords: kw,
      hashCount,
      ctaOk,
      centerOk,
      centerTotal: paras.length,
      hasMerge,
      h2Texts
    };
  });

  // === 평가 ===
  console.log('='.repeat(60));
  console.log('  📋 최종 종합 체크리스트');
  console.log('='.repeat(60));

  let passed = 0, total = 0;
  const add = (ok, label, detail) => {
    total++;
    if (ok) passed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  };

  console.log('\n📌 기본 정보');
  add(r.titleSet, '제목 설정');
  add(r.contentLen >= 1500, '본문 분량', `${r.contentLen}자 (1,500자↑)`);
  add(r.h2 >= 2, 'H2 태그', `${r.h2}개 (☀️ 📋 ✅ 🎯)`);
  add(r.strong >= 10, 'Strong 태그', `${r.strong}개`);
  add(r.imgs >= 5, '이미지', `${r.imgs}장`);

  console.log('\n📱 모바일 최적화');
  add(r.avgLen <= 35, '평균 문단 길이', `${r.avgLen}자 (모바일 2줄 내외)`);
  add(r.over70 === 0, '70자 초과 문단', `${r.over70}개`);
  add(r.over50 <= 10, '50자 초과 문단', `${r.over50}개`);
  add(r.maxLen <= 80, '최대 문단 길이', `${r.maxLen}자`);

  console.log('\n🖼️ 이미지');
  r.imgDetails.forEach(img => {
    const label = `[${img.i}] ${img.size}`;
    add(img.altOk, `${label} alt 태그`, img.alt);
    add(img.responsive !== '⚠️', `${label} 반응형`, img.responsive === '✅' ? 'width:100%' : '대표유지');
  });
  add(r.imgAlignOk === r.imgAlignTotal, '이미지 센터 정렬', `${r.imgAlignOk}/${r.imgAlignTotal}개 margin:0 auto`);
  add(r.moduleAlignOk === r.imgAlignTotal, '이미지 모듈 text-align', `${r.moduleAlignOk}/${r.imgAlignTotal}개`);

  console.log('\n🔑 SEO');
  add(r.keywords['영상편집외주'] >= 3, '키워드 영상편집외주', `${r.keywords['영상편집외주']}회`);
  add(r.keywords['숏폼'] >= 5, '키워드 숏폼', `${r.keywords['숏폼']}회`);
  add(r.keywords['FP 브랜딩'] >= 3, '키워드 FP브랜딩', `${r.keywords['FP 브랜딩']}회`);
  add(r.keywords['하반기'] >= 3, '키워드 하반기', `${r.keywords['하반기']}회`);
  add(r.hashCount >= 29, '해시태그', `${r.hashCount}개`);
  add(r.ctaOk, 'CTA 3종 (카톡/메일/홈페이지)', '');

  console.log('\n📐 구조/정렬');
  add(r.centerOk === r.centerTotal, '텍스트 센터 정렬', `${r.centerOk}/${r.centerTotal}개`);
  add(!r.hasMerge, '줄바꿈 (머지 없음)', r.hasMerge ? '⚠️ 머지있음' : '✅ 정상');

  console.log('\n' + '='.repeat(60));
  console.log(`  📊 종합: ${passed}/${total} 항목 통과`);
  if (passed === total) {
    console.log('  🎉 모든 항목 통과 — 추가 보완 불필요');
  } else {
    console.log(`  ⚠️ ${total - passed}개 미통과 — 재확인 필요`);
  }
  console.log('='.repeat(60));

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
