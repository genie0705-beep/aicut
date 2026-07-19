const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  const result = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    
    // 본문 텍스트
    const fullText = se.getContentText();
    
    // 이미지 확인
    const imgs = document.querySelectorAll('.se-image-component img, .se-component img, .se-canvas-layer img');
    const imgInfo = Array.from(imgs).map((img, i) => ({
      i, w: img.naturalWidth, h: img.naturalHeight,
      alt: img.getAttribute('alt') || '(없음)',
      src: (img.src || '').substring(0, 60)
    }));

    // 문단
    const paras = document.querySelectorAll('.se-text-paragraph');
    
    // 키워드 등장 횟수
    const keywords = {
      '영상편집외주': (fullText.match(/영상편집외주/g) || []).length,
      '숏폼마케팅': (fullText.match(/숏폼 마케팅/g) || []).length,
      '보험마케팅': (fullText.match(/보험 마케팅/g) || []).length,
      'FP브랜딩': (fullText.match(/FP 브랜딩/g) || []).length,
      '하반기전략': (fullText.match(/하반기/g) || []).length,
      '숏폼': (fullText.match(/숏폼/g) || []).length,
      '영상편집': (fullText.match(/영상 편집/g) || []).length,
    };

    // 해시태그 체크
    const hashtagCount = (fullText.match(/#[가-힣a-zA-Z]+/g) || []).length;

    // CTA 체크
    const hasKakao = fullText.includes('pf.kakao.com');
    const hasEmail = fullText.includes('master@aicut.co.kr');
    const hasHome = fullText.includes('aicut.co.kr');

    // Strong 태그
    const strongCount = document.querySelectorAll('strong, b').length;

    // H2/H3
    const hCount = document.querySelectorAll('h2, h3').length;

    // 모바일 최적화 - 50자 초과 문단
    const longParas = Array.from(paras).filter(p => (p.textContent || '').length > 50);

    return {
      contentLen: fullText.length,
      paraCount: paras.length,
      imgCount: imgInfo.length,
      imgAlts: imgInfo,
      keywords,
      hashtagCount,
      cta: { kakao: hasKakao, email: hasEmail, home: hasHome },
      strongCount,
      hCount,
      longParasOver50: longParas.length,
      longParaTexts: longParas.slice(0,3).map(p => (p.textContent || '').substring(0, 60))
    };
  });

  console.log('=== SEO 체크리스트 ===');
  console.log(JSON.stringify(result, null, 2));

  // 평가
  const issues = [];
  if (result.keywords['영상편집외주'] < 1) issues.push('⚠️ "영상편집외주" 키워드 부족 (0회)');
  if (result.keywords['숏폼'] < 3) issues.push(`⚠️ "숏폼" 키워드 ${result.keywords['숏폼']}회 (권장: 3+)`);
  if (!result.cta.kakao) issues.push('❌ 카카오톡 CTA 없음');
  if (!result.cta.email) issues.push('❌ 이메일 CTA 없음');
  if (!result.cta.home) issues.push('❌ 홈페이지 CTA 없음');
  if (result.hashtagCount < 29) issues.push(`⚠️ 해시태그 ${result.hashtagCount}개 (권장: 30개)`);
  if (result.imgCount < 5) issues.push(`⚠️ 이미지 ${result.imgCount}장 (권장: 5장)`);
  const noAlt = result.imgAlts.filter(i => i.alt === '(없음)' || !i.alt);
  if (noAlt.length > 0) issues.push(`⚠️ alt 태그 없는 이미지 ${noAlt.length}개`);
  if (result.longParasOver50 > 5) issues.push(`⚠️ 50자 초과 문단 ${result.longParasOver50}개 (모바일 최적화 필요)`);

  console.log('\n=== 보완 필요 사항 ===');
  if (issues.length === 0) {
    console.log('✅ 모든 항목 통과!');
  } else {
    issues.forEach(i => console.log(i));
  }

  await b.close();
}
main().catch(e => console.error('❌', e.message));
