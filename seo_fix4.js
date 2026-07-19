const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  const logNo = '224349792018';

  // PC 버전 게시글 페이지로 이동 (여기에 수정 버튼이 있음)
  console.log('1. 게시글 페이지 이동...');
  await page.goto(`https://blog.naver.com/PostView.naver?blogId=aicut&logNo=${logNo}`, {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(5000);

  // 수정 버튼 찾기
  const hasEditBtn = await page.evaluate((no) => {
    // 모든 링크 확인
    const links = document.querySelectorAll('a');
    for (const a of links) {
      if (a.href && a.href.includes(no)) {
        // 수정 관련 패턴
        if (a.href.includes('edit') || a.href.includes('Edit') || a.href.includes('modify') || a.href.includes('Modify')) {
          return a.href;
        }
      }
    }
    // suggestConvert 함수 찾기
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const onclick = el.getAttribute('onclick') || '';
      if (onclick.includes('suggestConvert') && onclick.includes(no)) {
        return onclick;
      }
    }
    return null;
  }, logNo);

  if (hasEditBtn) {
    console.log(`2. 수정 버튼/함수 발견: ${hasEditBtn.substring(0, 80)}`);
    
    if (hasEditBtn.startsWith('javascript:') || hasEditBtn.includes('suggestConvert')) {
      // JavaScript 함수 실행
      const funcMatch = hasEditBtn.match(/suggestConvert\(([^)]+)\)/);
      if (funcMatch) {
        const args = funcMatch[1];
        // 새 탭에서 열릴 수 있으므로 popup 이벤트 대기
        const [popup] = await Promise.all([
          ctx.waitForEvent('page', { timeout: 15000 }).catch(() => null),
          page.evaluate((args) => {
            // suggestConvert 함수는 blog 객체에 있을 수 있음
            if (typeof suggestConvert === 'function') {
              suggestConvert(...args.split(',').map(s => s.trim()));
            } else if (window.blog && typeof window.blog.suggestConvert === 'function') {
              window.blog.suggestConvert(...args.split(',').map(s => s.trim()));
            }
          }, args)
        ]);
        
        if (popup) {
          await popup.waitForLoadState('domcontentloaded', { timeout: 15000 });
          await popup.waitForTimeout(5000);
          console.log(`   팝업 URL: ${popup.url().substring(0, 80)}`);
          
          // 이 팝업에서 SmartEditor 찾기
          let ef = null;
          for (const f of popup.frames()) {
            try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
          }
          
          if (ef) {
            console.log('✅ SmartEditor 발견 (팝업)\n');
            await fixSEO(ef, popup);
          }
        } else {
          console.log('   팝업이 열리지 않음');
        }
      }
    } else {
      // URL 직접 이동
      await page.goto(hasEditBtn, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
      
      let ef = null;
      for (const f of page.frames()) {
        try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
      }
      if (ef) { console.log('✅ SmartEditor 발견\n'); await fixSEO(ef, page); }
    }
  } else {
    console.log('❌ 수정 버튼 못 찾음');
    // 대안: 블로그 관리 페이지에서 시도
    console.log('\n   블로그 관리 페이지 시도...');
    await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await page.waitForTimeout(3000);
    
    // 목록에서 해당 글의 수정 링크 찾기 (더 복잡한 선택자)
    const editUrl = await page.evaluate((no) => {
      const all = document.querySelectorAll('a, span, div, button');
      for (const el of all) {
        const onclick = el.getAttribute('onclick') || '';
        const href = el.getAttribute('href') || '';
        if ((onclick.includes('suggestConvert') && onclick.includes(no)) ||
            (href.includes('Modify') && href.includes(no))) {
          return onclick || href;
        }
      }
      return null;
    }, logNo);
    
    if (editUrl) console.log(`   발견: ${editUrl.substring(0, 80)}`);
    else console.log('   SuggestConvert도 못 찾음');
  }

  async function fixSEO(ef, p) {
    // 현재 상태 확인
    const before = await ef.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const blocks = data?.document?.blocks || [];
      let h2=0, h3=0, img=0, imgNoAlt=0;
      blocks.forEach(b => {
        if (b.type === 'heading2') h2++;
        else if (b.type === 'heading3') h3++;
        else if (b.type === 'image') { img++; if (!b.alt) imgNoAlt++; }
      });
      return { h2, h3, img, imgNoAlt, total: blocks.length };
    });
    console.log(`수정 전: H2=${before.h2} H3=${before.h3} 이미지=${before.img} alt없음=${before.imgNoAlt}`);

    if (before.total === 0) {
      console.log('⚠️ 블록 없음 — 현재 페이지는 에디터가 아닐 수 있음');
      return;
    }

    // SEO 보강
    const result = await ef.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const blocks = data?.document?.blocks || [];
      let h2c=0, h3c=0, altSet=0;

      const altMap = {
        'main': '7월 주말 날씨별 서울 나들이 BEST 5',
        'card1': '서울숲 성수동 나들이',
        'card2': '코엑스 별마당도서관 비오는날',
        'card3': '잠실 올림픽공원 날씨무관',
        'cta': '주말 영상 기록 에이컷',
        'map_1': '서울숲 위치 지도',
        'map_2': '코엑스 위치 지도',
        'map_3': '북서울꿈의숲 위치 지도',
        'map_4': '양재꽃시장 위치 지도',
        'map_5': '석촌호수 위치 지도',
        'place_1': '서울숲 잔디광장',
        'place_2': '코엑스 별마당도서관',
        'place_3': '북서울꿈의숲 돔전망대',
        'place_4': '양재꽃시장',
        'place_5': '석촌호수 분수쇼',
      };

      blocks.forEach((b, idx) => {
        if (!b || !b.text) return;
        const t = b.text.trim();

        if (t.match(/^(첫째|둘째|셋째|넷째|다섯째)/) || t.includes('영상으로 기록') || t.includes('주말 나들이,')) {
          if (b.type !== 'heading2') { blocks[idx].type = 'heading2'; h2c++; }
        }
        else if (t.match(/^(서울숲|코엑스|북서울|양재천|잠실)\s|^서울숲 —|^코엑스 —|^북서울꿈의숲 —|^양재천 —|^잠실 —/)) {
          if (b.type !== 'heading3') { blocks[idx].type = 'heading3'; h3c++; }
        }

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

    console.log(`보강: H2=${result.h2} H3=${result.h3} alt=${result.alt}`);

    // 저장
    console.log('\n저장...');
    await ef.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.innerText.trim() === '저장') { btn.click(); break; }
      }
    });
    await p.waitForTimeout(5000);
    console.log('✅ SEO 보강 완료!');
  }

  console.log('\n✅ 작업 완료 — 브라우저 확인해주세요');
})();
