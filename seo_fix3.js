const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  const logNo = '224349792018';

  // 글 수정 모드로 열기
  await page.goto(`https://blog.naver.com/PostWriteForm.naver?blogId=aicut&logNo=${logNo}`, {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(5000);

  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }

  console.log('✅ 수정 모드 진입\n');

  // 현재 블록 상태 확인 (getTitle 없이)
  const before = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    let h2=0, h3=0, img=0, imgNoAlt=0, p=0;
    blocks.forEach(b => {
      if (b.type === 'heading2') h2++;
      else if (b.type === 'heading3') h3++;
      else if (b.type === 'image') { img++; if (!b.alt) imgNoAlt++; }
      else if (b.type === 'paragraph') p++;
    });
    return { h2, h3, p, img, imgNoAlt, total: blocks.length };
  });
  console.log(`수정 전: ${JSON.stringify(before)}`);

  // SEO 보강
  console.log('\nSEO 보강 중...');
  const result = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    let h2c=0, h3c=0, altSet=0;

    const altMap = {
      'main': '7월 주말 날씨별 서울 나들이 BEST 5 대표 이미지',
      'card1': '맑은 날 서울숲 성수동 데이트 코스 카드',
      'card2': '비 오는 날 코엑스 별마당도서관 카드',
      'card3': '날씨 무관 잠실 올림픽공원 카드',
      'cta': '주말 나들이 영상 기록 문의 에이컷',
      'map_1': '서울숲 위치 네이버 지도',
      'map_2': '코엑스몰 위치 네이버 지도',
      'map_3': '북서울꿈의숲 위치 네이버 지도',
      'map_4': '양재꽃시장 위치 네이버 지도',
      'map_5': '석촌호수 위치 네이버 지도',
      'place_1': '서울숲 잔디광장 전경',
      'place_2': '코엑스 별마당도서관 내부',
      'place_3': '북서울꿈의숲 돔전망대 뷰',
      'place_4': '양재꽃시장 꽃가게 내부',
      'place_5': '석촌호수 야경 분수쇼',
    };

    blocks.forEach((b, idx) => {
      if (!b || !b.text) return;
      const t = b.text.trim();

      // H2 변환
      if (t.match(/^(첫째|둘째|셋째|넷째|다섯째)/) ||
          (t.includes('영상으로 기록') || t.includes('주말 나들이,'))) {
        if (b.type !== 'heading2') { blocks[idx].type = 'heading2'; h2c++; }
      }
      // H3 변환 (장소명 + 설명)
      else if (
        t.match(/^(서울숲|코엑스|북서울|양재천|잠실)\s/) ||
        t.match(/^(서울숲|코엑스|북서울|양재천|잠실)$/) ||
        t.startsWith('서울숲 —') || t.startsWith('코엑스 —') || t.startsWith('북서울꿈의숲 —') || t.startsWith('양재천 —') || t.startsWith('잠실 —')
      ) {
        if (b.type !== 'heading3') { blocks[idx].type = 'heading3'; h3c++; }
      }

      // 이미지 alt
      if (b.type === 'image') {
        const src = b.imageUrl || b.src || '';
        let altText = '';
        for (const [key, val] of Object.entries(altMap)) {
          if (src.includes(key)) { altText = val; break; }
        }
        if (!altText) altText = '서울 주말 나들이 추천 장소';
        blocks[idx].alt = altText;
        altSet++;
      }
    });

    data.document.blocks = blocks;
    ed.setDocumentData(data);

    return { h2: h2c, h3: h3c, alt: altSet };
  });

  console.log(`   H2: ${result.h2}개 추가, H3: ${result.h3}개 추가, alt: ${result.alt}개 설정`);

  // 저장
  console.log('\n저장 중...');
  await ef.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });
  await page.waitForTimeout(5000);

  console.log('\n✅ SEO 보강 완료!');
  console.log('브라우저 확인 후 재발행 필요시 발행 버튼 눌러주세요.');
})();
