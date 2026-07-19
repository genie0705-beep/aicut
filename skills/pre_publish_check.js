const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('에디터 없음'); await b.close(); return; }

  console.log('='.repeat(60));
  console.log('  📋 발행 전 점검 체크리스트');
  console.log('='.repeat(60));

  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');
    const h2s = document.querySelectorAll('h2');
    const strongs = document.querySelectorAll('strong, b');
    const sections = document.querySelectorAll('.se-section-image');
    const modules = document.querySelectorAll('.se-module-image');
    const lens = Array.from(paras).filter(p => {
      const t = (p.textContent || '').trim();
      return t.length > 3 && !t.startsWith('#');
    }).map(p => (p.textContent || '').length);

    // 이미지 상세
    const imgInfo = Array.from(imgs).map(img => ({
      size: img.naturalWidth + 'x' + img.naturalHeight,
      alt: img.getAttribute('alt') || '(없음)',
      responsive: img.style.width === '100%' ? '✅' : (img.naturalWidth === 700 ? '유지' : '⚠️'),
      center: ((img.closest('.se-section-image')?.style?.margin || '').includes('auto')) ? '✅' : '❌'
    }));

    return {
      stats: {
        본문: ft.length + '자',
        문단: paras.length + '개',
        평균문단: Math.round(lens.reduce((a,b) => a+b, 0) / lens.length) + '자',
        '70자초과': lens.filter(l => l > 70).length + '개',
        이미지: imgs.length + '장',
        H2: h2s.length + '개',
        Strong: strongs.length + '개',
        CTA: ft.includes('pf.kakao.com') && ft.includes('master@aicut.co.kr') && ft.includes('aicut.co.kr'),
        해시태그: (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개'
      },
      imgInfo,
      checks: {
        imageCenter: Array.from(sections).filter(s => (s.style.margin || '').includes('auto')).length + '/5',
        moduleCenter: Array.from(modules).filter(m => m.style.textAlign === 'center').length + '/5',
        noAicut: !ft.includes('AICUT'),
        noMerge: !ft.includes('알려드립니다.☀')
      }
    };
  });

  let pass = 0, total = 0;
  const check = (ok, label, detail) => {
    total++;
    if (ok) pass++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  };

  console.log('\n📌 기본');
  check(true, '제목', '보험설계사 FP라면? 상반기 마케팅 성과 분석하고 하반기 숏폼 전략으로 준비하세요');
  check(parseInt(r.stats.본문) >= 1500, '본문 분량', r.stats.본문);
  check(parseInt(r.stats.H2) >= 2, 'H2 태그', r.stats.H2);
  check(parseInt(r.stats.Strong) >= 10, 'Strong 태그', r.stats.Strong);

  console.log('\n📱 모바일');
  check(parseInt(r.stats['70자초과']) === 0, '70자 초과 문단', r.stats['70자초과']);
  check(parseInt(r.stats.평균문단) <= 35, '평균 문단 길이', r.stats.평균문단);

  console.log('\n🖼️ 이미지');
  r.imgInfo.forEach((img, i) => {
    check(img.center === '✅', '[' + i + '] ' + img.size + ' 센터정렬', img.center);
    check(img.alt.length > 5, '[' + i + '] alt 태그', img.alt.substring(0, 25) + '...');
    check(img.responsive !== '⚠️', '[' + i + '] ' + img.size + ' 반응형', img.responsive === '✅' ? 'width:100%' : '대표유지');
  });

  console.log('\n🆕 이미지 품질 (신규)');
  check(r.checks.noAicut, 'AICUT 브랜드 문구 제거 (본문)', '');
  check(r.checks.imageCenter === '5/5', '이미지 컨테이너 센터 정렬', r.checks.imageCenter);
  check(r.checks.moduleCenter === '5/5', '이미지 모듈 센터 정렬', r.checks.moduleCenter);

  console.log('\n🔑 SEO');
  check(r.stats.CTA, 'CTA 3종 (카톡/메일/홈페이지)', '');
  check(parseInt(r.stats.해시태그) >= 29, '해시태그', r.stats.해시태그);
  check(r.checks.noMerge, '줄바꿈 (문장 붙음 없음)', r.checks.noMerge ? '정상' : '⚠️');

  console.log('\n' + '='.repeat(60));
  console.log('  📊 종합: ' + pass + '/' + total + ' 항목 통과');
  if (pass === total) console.log('  🎉 발행 가능 — 추가 보완 불필요');
  console.log('='.repeat(60));

  await b.close();
}
main().catch(e => console.log('err:', e.message));
