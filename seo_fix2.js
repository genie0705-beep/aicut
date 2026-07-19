const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  const logNo = '224349792018';
  console.log('=== 글 수정 모드 접근 ===\n');

  // 블로그 포스트 목록 → 수정 링크 찾기
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(3000);

  // Redirect=Modify 링크 찾기
  const modifyHref = await page.evaluate((no) => {
    const links = document.querySelectorAll('a');
    for (const a of links) {
      if (a.href && (a.href.includes('Modify') || a.href.includes('modify')) && a.href.includes(no)) {
        return a.href;
      }
    }
    return null;
  }, logNo);

  if (!modifyHref) {
    console.log('수정 링크 못 찾음. 모든 링크 검색:');
    const allHrefs = await page.evaluate((no) => {
      return Array.from(document.querySelectorAll('a'))
        .filter(a => a.href && a.href.includes(no))
        .map(a => a.href.substring(0, 100));
    }, logNo);
    console.log(allHrefs);
    
    // Redirect=Write를 통해 수정 모드로 열기 시도 (logNo 파라미터 포함)
    console.log('\nRedirect=Write+Modify 시도...');
    await page.evaluate(() => {
      const btn = document.querySelector('a[href*="Redirect=Write"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    
    // logNo= 파라미터로 수정 페이지 접근
    await page.goto(`https://blog.naver.com/PostWriteForm.naver?blogId=aicut&logNo=${logNo}`, {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await page.waitForTimeout(5000);
    
    console.log(`URL: ${page.url().substring(0, 80)}`);
  } else {
    console.log(`수정 링크: ${modifyHref.substring(0, 80)}`);
    await page.goto(modifyHref, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    console.log(`URL: ${page.url().substring(0, 80)}`);
  }

  // SmartEditor 찾기
  let ef = null;
  for (const f of page.frames()) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; }
    } catch(e) {}
  }

  if (!ef) {
    console.log('❌ SmartEditor 없음');
    return;
  }

  console.log('✅ SmartEditor 발견!\n');

  // 현재 상태
  const status = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    let h2=0, h3=0, img=0, p=0, imgNoAlt=0;
    blocks.forEach(b => {
      if (b.type === 'heading2') h2++;
      else if (b.type === 'heading3') h3++;
      else if (b.type === 'image') { img++; if (!b.alt) imgNoAlt++; }
      else if (b.type === 'paragraph') p++;
    });
    return { h2, h3, p, img, imgNoAlt, total: blocks.length, title: ed.getTitle() };
  });
  console.log(`현재 상태: ${JSON.stringify(status)}`);

  // 수정 실행
  console.log('\nSEO 보강 시작...');
  const result = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    let h2c=0, h3c=0, altSet=0;

    // 맵핑: 이미지 파일명 → alt 텍스트
    const altMap = {
      'main': '7월 주말 날씨별 서울 나들이 대표 이미지',
      'card1': '맑은 날 서울숲 성수동 나들이 코스',
      'card2': '비 오는 날 코엑스 별마당도서관',
      'card3': '날씨 무관 잠실 올인원 나들이 코스',
      'cta': '주말 나들이 영상 기록 문의',
      'map_1': '서울숲 위치 지도',
      'map_2': '코엑스 위치 지도',
      'map_3': '북서울꿈의숲 위치 지도',
      'map_4': '양재꽃시장 위치 지도',
      'map_5': '석촌호수 위치 지도',
      'place_1': '서울숲 잔디광장 전경',
      'place_2': '코엑스 별마당도서관 전경',
      'place_3': '북서울꿈의숲 돔전망대 전경',
      'place_4': '양재꽃시장 내부 전경',
      'place_5': '석촌호수 분수쇼 전경',
    };

    blocks.forEach((b, idx) => {
      if (!b || !b.text) return;
      const t = b.text.trim();

      // H2
      if (t.match(/^(첫째|둘째|셋째|넷째|다섯째)/)) {
        if (b.type !== 'heading2') { blocks[idx].type = 'heading2'; h2c++; }
      }
      // H3
      else if (t.match(/^(서울숲|코엑스|북서울|양재천|잠실)\s/) || t.match(/^(서울숲|코엑스|북서울|양재천|잠실)$/) || t.match(/^(서울숲|코엑스|북서울|양재천|잠실)—/)) {
        if (b.type !== 'heading3') { blocks[idx].type = 'heading3'; h3c++; }
      }
      // 영상 기록 H2
      else if (t.includes('영상으로 기록')) {
        if (b.type !== 'heading2') { blocks[idx].type = 'heading2'; h2c++; }
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

  console.log(`   H2: ${result.h2}개, H3: ${result.h3}개, alt: ${result.alt}개 설정`);

  // 저장
  console.log('\n저장...');
  await ef.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });
  await page.waitForTimeout(5000);

  console.log('\n✅ SEO 수정 완료! 브라우저 확인 후 재발행 필요시 발행 버튼 눌러주세요.');
})();
