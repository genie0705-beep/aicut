const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages()[6]; // ads.naver.com
  await new Promise(r => setTimeout(r, 1000));

  // "키워드 도구" 링크 정확히 찾아서 클릭
  const kwBtn = await page.evaluate(() => {
    const all = document.querySelectorAll('a, span, div, button');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '키워드 도구') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) {
          el.click();
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
    }
    return null;
  });

  if (!kwBtn) {
    console.log('키워드 도구 링크 못 찾음');
    await b.close();
    process.exit(0);
  }

  console.log('키워드 도구 클릭:', kwBtn.x, kwBtn.y);
  await new Promise(r => setTimeout(r, 5000));

  const kwUrl = page.url();
  console.log('이동 후 URL:', kwUrl.substring(0, 100));

  // 키워드 검색 입력창 찾기
  const kwSearch = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
    for (const inp of inputs) {
      const ph = inp.placeholder || '';
      const val = inp.value || '';
      const r = inp.getBoundingClientRect();
      if ((ph.includes('키워드') || ph.includes('검색') || ph.includes('입력')) && r.width > 100) {
        return { ph, x: r.x + r.width/2, y: r.y + r.height/2, w: r.width };
      }
    }
    // 첫 번째 큰 input
    for (const inp of inputs) {
      const r = inp.getBoundingClientRect();
      if (r.width > 150) return { ph: inp.placeholder || '', x: r.x + r.width/2, y: r.y + r.height/2, w: r.width };
    }
    return null;
  });

  if (kwSearch) {
    console.log('키워드 검색창:', kwSearch.ph);
    
    // 키워드 리스트 입력
    const keywords = [
      '영상편집외주', '영상편집업체', '영상편집대행', '숏폼제작', '숏폼영상제작',
      '동영상편집', '릴스제작', '인스타 릴스 편집', '영상마케팅',
      '병원마케팅', '쇼핑몰 영상편집', '부동산 유튜브',
      '변호사 유튜브', '세무사 마케팅', '프랜차이즈 영상',
      '온라인강의 편집', '교육 영상편집'
    ];

    // 첫 번째 키워드 입력
    await page.mouse.click(kwSearch.x, kwSearch.y);
    await new Promise(r => setTimeout(r, 500));
    await page.keyboard.type(keywords.join('\n'), { delay: 10 });
    await new Promise(r => setTimeout(r, 1000));

    // 조회 버튼 찾기
    const searchBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, [role="button"], a');
      for (const el of btns) {
        const t = (el.innerText || '').trim();
        if (t.includes('조회') || t.includes('검색') || t.includes('확인')) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.x > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });

    if (searchBtn) {
      console.log('조회 버튼:', searchBtn.x, searchBtn.y);
      await page.mouse.click(searchBtn.x, searchBtn.y);
      await new Promise(r => setTimeout(r, 5000));
    }

    // 결과 수집
    const results = await page.evaluate(() => {
      const tables = document.querySelectorAll('table, [role="table"], .table, [class*="table"]');
      const text = document.body.innerText;
      // 키워드별 검색량 추출
      const lines = text.split('\n');
      const kwData = [];
      for (let i = 0; i < lines.length; i++) {
        // 숫자+콤마 패턴 (검색량)
        if (lines[i].match(/^[\d,]+$/) && lines[i].length > 3) {
          const kw = lines[i-1] || '';
          if (kw.length > 1 && kw.length < 20) {
            kwData.push({ keyword: kw, volume: lines[i] });
          }
        }
      }
      return kwData.length > 0 ? kwData : text.substring(0, 2000);
    });

    console.log('\n=== 키워드 검색 결과 ===');
    if (Array.isArray(results)) {
      results.forEach(r => console.log(` ${r.keyword}: ${r.volume}`));
    } else {
      console.log(results);
    }
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
