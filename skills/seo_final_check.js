const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const paras = document.querySelectorAll('.se-text-paragraph');
    const h2s = document.querySelectorAll('h2');
    const strongs = document.querySelectorAll('strong, b');
    const imgs = document.querySelectorAll('img');
    const hashCount = (ft.match(/#[가-힣a-zA-Z]+/g) || []).length;
    const lens = Array.from(paras).map(p => (p.textContent || '').length);
    const avg = Math.round(lens.reduce((a,b) => a+b, 0) / (lens.length || 1));
    const over50 = lens.filter(l => l > 50).length;
    const over70 = lens.filter(l => l > 70).length;
    const kw = {
      '영상편집외주': (ft.match(/영상편집외주/g) || []).length,
      '숏폼': (ft.match(/숏폼/g) || []).length,
      '보험 마케팅': (ft.match(/보험 마케팅/g) || []).length,
      'FP 브랜딩': (ft.match(/FP 브랜딩/g) || []).length,
      '하반기': (ft.match(/하반기/g) || []).length,
    };
    const imgAlts = Array.from(imgs).map((img, i) => ({
      i, size: img.naturalWidth + 'x' + img.naturalHeight,
      alt: img.getAttribute('alt') || '(없음)',
      mobileStyle: (img.style.width === '100%') ? '반응형' : '고정'
    }));
    const cta = {
      kakao: ft.includes('pf.kakao.com'), email: ft.includes('master@aicut.co.kr'),
      home: ft.includes('aicut.co.kr')
    };
    const h2texts = Array.from(h2s).map(h => h.textContent);
    const centerOk = Array.from(paras).filter(p =>
      p.style.textAlign === 'center' || p.classList.contains('se-text-paragraph-align-center')
    ).length;
    const titleEl = document.querySelector('input[placeholder*="제목"]');
    return {
      title: titleEl ? titleEl.value : '(미확인)',
      contentLen: ft.length, paraCount: paras.length,
      avgLen: avg + '자', over50, over70,
      h2Count: h2s.length, h2texts,
      strongCount: strongs.length, imgCount: imgs.length,
      imgAlts, centerAligned: centerOk + '/' + paras.length,
      hashtagCount: hashCount, cta, keywords: kw
    };
  });

  console.log('=== SEO 체크리스트 ===\n');
  console.log('📌 기본:');
  console.log('  제목: ' + r.title);
  console.log('  본문: ' + r.contentLen + '자 / ' + r.paraCount + '문단');
  console.log('  평균문단길이: ' + r.avgLen + ' / 50자초과: ' + r.over50 + ' / 70자초과: ' + r.over70);
  console.log('  센터정렬: ' + r.centerAligned);
  console.log('\n📐 구조:');
  console.log('  H2: ' + r.h2Count + '개 → ' + r.h2texts.join(' | '));
  console.log('  Strong: ' + r.strongCount + '개');
  console.log('  이미지: ' + r.imgCount + '장');
  console.log('\n🏷️ 메타:');
  console.log('  해시태그: ' + r.hashtagCount + '개');
  console.log('  CTA: ' + (r.cta.kakao ? '✅' : '❌') + '카톡 ' + (r.cta.email ? '✅' : '❌') + '메일 ' + (r.cta.home ? '✅' : '❌') + '홈페이지');
  console.log('\n🔑 키워드:');
  Object.entries(r.keywords).forEach(([k, v]) => console.log('  ' + k + ': ' + v + '회' + (v >= 3 ? ' ✅' : ' ⚠️')));
  console.log('\n🖼️ 이미지 상세:');
  r.imgAlts.forEach(img => console.log('  [' + img.i + '] ' + img.size + ' alt="' + img.alt + '" ' + img.mobileStyle));

  // 평가표
  console.log('\n=== 항목별 평가 ===');
  const results = [];
  const add = (ok, msg) => { results.push({ ok, msg }); console.log((ok ? '✅' : '⚠️') + ' ' + msg); };

  add(r.contentLen >= 1500 && r.contentLen <= 3000, '본문 분량 ' + r.contentLen + '자 (1,500~3,000)');
  add(r.h2Count >= 2, 'H2 태그 ' + r.h2Count + '개 (2개↑)');
  add(r.strongCount >= 5, 'Strong 태그 ' + r.strongCount + '개 (5개↑)');
  add(r.imgCount >= 5, '이미지 ' + r.imgCount + '장 (5장)');
  add(r.hashtagCount >= 29, '해시태그 ' + r.hashtagCount + '개 (30개)');
  add(r.cta.kakao && r.cta.email && r.cta.home, 'CTA 3종 모두 포함');
  add(r.keywords['영상편집외주'] >= 3, '키워드 영상편집외주 ' + r.keywords['영상편집외주'] + '회');
  add(r.keywords['숏폼'] >= 5, '키워드 숏폼 ' + r.keywords['숏폼'] + '회');
  add(r.keywords['보험 마케팅'] >= 3, '키워드 보험마케팅 ' + r.keywords['보험 마케팅'] + '회');
  add(r.keywords['FP 브랜딩'] >= 3, '키워드 FP브랜딩 ' + r.keywords['FP 브랜딩'] + '회');
  add(r.keywords['하반기'] >= 3, '키워드 하반기 ' + r.keywords['하반기'] + '회');
  add(r.imgAlts.filter(i => i.alt && i.alt.length > 5).length >= 5, '이미지 alt 태그 모두 포함');
  add(r.imgAlts.filter(i => i.mobileStyle === '반응형').length >= 4, '모바일 반응형 이미지 ' + r.imgAlts.filter(i => i.mobileStyle === '반응형').length + '장');
  add(r.centerAligned.startsWith(r.paraCount + '/'), '전체 센터 정렬');
  add(r.over50 <= 15, '모바일 최적화 (50자 초과 ' + r.over50 + '개)');

  const passed = results.filter(r => r.ok).length;
  console.log('\n📊 종합: ' + passed + '/' + results.length + ' 항목 통과');

  await b.close();
}
main().catch(e => console.error('❌', e.message));
