const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages()[6]; // ads.naver.com
  await new Promise(r => setTimeout(r, 1000));

  // 키워드 도구 페이지로 직접 이동
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/tool/keyword-planner', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  // 1. "일치 검색 사용하기" 링크 클릭
  const exactLink = await page.evaluate(() => {
    const all = document.querySelectorAll('a, span, button, div');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t.includes('일치 검색') || t.includes('키워드 다중 검색')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) {
          el.click();
          return { text: t.substring(0, 20), x: r.x, y: r.y };
        }
      }
    }
    // 두 번째 방법: "키워드" 탭/라디오 찾기
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '키워드' || t === '웹사이트') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) {
          el.click();
          return { text: t, x: r.x, y: r.y };
        }
      }
    }
    return null;
  });
  console.log('탭 클릭:', exactLink?.text || '없음');
  await new Promise(r => setTimeout(r, 2000));

  // 2. 입력 필드 찾기
  const inputInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, textarea');
    const results = [];
    inputs.forEach((inp, i) => {
      const r = inp.getBoundingClientRect();
      if (r.width > 0) {
        results.push({
          i,
          type: inp.type || 'text',
          placeholder: (inp.placeholder || '').substring(0, 30),
          id: inp.id || '',
          name: inp.name || '',
          cls: (inp.className || '').substring(0, 30),
          w: Math.round(r.width),
          x: Math.round(r.x),
          y: Math.round(r.y)
        });
      }
    });
    return results;
  });
  console.log('\n입력 필드들:');
  inputInfo.forEach(inp => console.log(` [${inp.i}] type=${inp.type} ph="${inp.placeholder}" w=${inp.w} x=${inp.x} y=${inp.y}`));

  // 3. 큰 입력 필드 찾아서 키워드 입력
  const targetInput = inputInfo.find(inp => inp.w > 200 && inp.placeholder && !inp.placeholder.includes('검색'));
  if (!targetInput) {
    console.log('적절한 입력 필드 못 찾음');
    // 모든 visible input 찍기
    const allVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).filter(i => i.offsetParent !== null).map(i => ({
        ph: i.placeholder,
        val: i.value.substring(0, 20),
        type: i.type,
        w: Math.round(i.getBoundingClientRect().width)
      }));
    });
    console.log('Visible inputs:', JSON.stringify(allVisible));
    await b.close();
    process.exit(0);
  }

  // 키워드 입력
  const kwList = '영상편집외주, 영상편집업체, 영상편집대행, 숏폼제작, 숏폼영상제작, 동영상편집, 릴스제작, 영상마케팅, 병원마케팅, 쇼핑몰영상편집, 부동산유튜브, 변호사유튜브, 세무사마케팅, 프랜차이즈영상, 온라인강의편집';

  await page.mouse.click(targetInput.x + 5, targetInput.y + 15);
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.type(kwList, { delay: 5 });
  console.log('\n키워드 입력 완료');
  await new Promise(r => setTimeout(r, 1000));

  // 4. "조회하기" 버튼
  const searchBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, [role="button"], a');
    for (const el of btns) {
      const t = (el.innerText || '').trim();
      if (t.includes('조회') || t === '조회하기') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) {
          el.click();
          return { text: t.substring(0, 10), x: r.x, y: r.y };
        }
      }
    }
    return null;
  });

  if (searchBtn) {
    console.log('조회 버튼:', searchBtn.text);
    await new Promise(r => setTimeout(r, 5000));
  }

  // 5. 결과 수집
  const resultText = await page.evaluate(() => {
    // 결과 테이블 찾기
    const table = document.querySelector('table, [role="table"]');
    if (table) return table.innerText;
    // 전체 텍스트에서 키워드+숫자 패턴 찾기
    const text = document.body.innerText;
    const lines = text.split('\n');
    const kwResults = [];
    let inResult = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('연관키워드') && line.includes('월간검색수')) inResult = true;
      if (inResult && line && line.length < 15 && !line.includes('PC') && !line.includes('모바일') && !line.includes('경쟁') && !line.includes('노출') && !line.includes('전체') && !line.includes('필터')) {
        kwResults.push(line);
      }
    }
    return kwResults.length > 0 ? kwResults.join('\n') : text.substring(0, 2000);
  });

  console.log('\n=== 키워드 검색 결과 ===');
  console.log(resultText.substring(0, 3000));

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
