const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 통계 상세 추출 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('admin.blog.naver.com')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await sleep(5000);
  }

  await page.bringToFront();
  await sleep(3000);

  // 1. 오늘 통계 - DOM 깊이 탐색
  console.log('━━━ A. 오늘/일간 통계 데이터 ━━━');
  
  const todayData = await page.evaluate(() => {
    const all = document.body.innerText;
    const result = { raw: all };

    // 모든 텍스트 노드 수집
    function walk(node, depth) {
      if (depth > 5) return;
      if (node.nodeType === 3) { // text node
        const t = node.textContent.trim();
        if (t && /[0-9]/.test(t) && t.length < 20) {
          if (!result.textNodes) result.textNodes = [];
          result.textNodes.push(t);
        }
      } else if (node.nodeType === 1) {
        for (let child of node.childNodes) walk(child, depth + 1);
      }
    }
    walk(document.body, 0);

    // 특정 셀렉터로 숫자 데이터 수집
    const allElements = document.querySelectorAll('*');
    const numericData = [];
    for (const el of allElements) {
      const t = el.textContent.trim();
      if (t && /^[0-9,]+$/.test(t) && t.length < 15) {
        numericData.push(t);
      }
    }
    result.numericElements = numericData.slice(0, 50);
    
    // strong, span, div 등에서 data 찾기
    const candidates = [];
    const selectors = 'strong, span, div, p, td, em, b';
    document.querySelectorAll(selectors).forEach(el => {
      const t = el.textContent.trim();
      if (t && t.length > 0 && t.length < 30 && /[0-9]/.test(t) && /[%]/.test(t)) {
        candidates.push(t);
      }
    });
    result.percentData = candidates.slice(0, 30);

    // className / id reveal
    const statElements = [];
    document.querySelectorAll('[class*="stat"], [class*="count"], [class*="num"], [class*="data"], [id*="stat"], [id*="count"], [id*="num"]').forEach(el => {
      statElements.push({
        tag: el.tagName,
        id: el.id,
        cls: el.className,
        text: el.textContent.trim().substring(0, 50)
      });
    });
    result.statElements = statElements.slice(0, 20);

    return result;
  });

  console.log('   숫자만 있는 요소들:', todayData.numericElements?.join(', ') || '없음');
  console.log('   % 데이터:', todayData.percentData?.join(', ') || '없음');
  if (todayData.statElements?.length) {
    console.log('   통계 요소들:');
    todayData.statElements.forEach(e => console.log(`     <${e.tag}> #${e.id} .${e.cls} → ${e.text}`));
  }

  // 2. innerHTML에서 데이터 영역 찾기
  console.log('\n━━━ B. 페이지 구조 분석 ━━━');
  const structure = await page.evaluate(() => {
    // 주요 컨테이너 찾기
    const containers = [];
    document.querySelectorAll('section, article, main, div[class*="container"], div[class*="content"], div[class*="wrap"]').forEach(el => {
      const t = el.textContent.trim().substring(0, 80);
      if (t.length > 5) containers.push({ tag: el.tagName, id: el.id, cls: el.className.substring(0, 60), text: t });
    });
    return containers.slice(0, 15);
  });
  console.log('   주요 컨테이너:');
  structure.forEach(s => console.log(`     <${s.tag}> .${s.cls} → ${s.text}`));

  // 3. iframe 확인
  console.log('\n━━━ C. iframe 탐색 ━━━');
  const iframes = await page.evaluate(() => 
    Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src.substring(0, 120),
      id: f.id,
      cls: f.className,
      width: f.width,
      height: f.height
    }))
  );
  console.log('   iframes:', iframes.length);
  iframes.forEach(f => console.log(`     ${f.id || '?'} src=${f.src.substring(0, 80)} ${f.width}x${f.height}`));

  // iframe 내부 데이터 추출
  for (const f of iframes) {
    if (f.src) {
      try {
        const frame = page.frame({ url: f.src });
        if (frame) {
          const ft = await frame.evaluate(() => document.body.innerText);
          if (ft && ft.length > 10) {
            console.log(`\n   [Frame: ${f.src.substring(0, 60)}]`);
            ft.split('\n').filter(l => l.trim()).slice(0, 25).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));
          }
        }
      } catch(e) {}
    }
  }

  // 4. 주간/월간 통계
  console.log('\n━━━ D. 주간/월간 통계 ━━━');
  const periodUrls = [
    { name: '주간', url: 'https://admin.blog.naver.com/aicut/stat/today?period=weekly' },  // might redirect to day tab
    { name: '월간', url: 'https://admin.blog.naver.com/aicut/stat/today?period=monthly' },
  ];
  
  for (const pu of periodUrls) {
    console.log(`   [${pu.name}] ${pu.url}`);
    await page.goto(pu.url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await sleep(3000);
    const loc = await page.evaluate('location.href');
    console.log(`   → ${loc.substring(0, 80)}`);
    const t = await page.evaluate(() => document.body.innerText);
    // 실제 데이터 영역은 iframe에 있을 수 있음
    const pageIframes = await page.evaluate(() => Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src.substring(0, 100) })));
    for (const pf of pageIframes) {
      if (pf.src) {
        try {
          const frame = page.frame({ url: pf.src });
          if (frame) {
            const ft = await frame.evaluate(() => document.body.innerText);
            if (ft && ft.length > 20) {
              console.log(`     [Frame data]`);
              ft.split('\n').filter(l => l.trim()).slice(0, 15).forEach((l, i) => console.log(`      ${i}: ${l.trim().substring(0, 100)}`));
            }
          }
        } catch(e) {}
      }
    }
  }

  // 5. 게시글 분석 페이지
  console.log('\n━━━ E. 게시글 분석 ━━━');
  // Try to navigate to post stats
  await page.goto('https://admin.blog.naver.com/aicut/stat/post', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(4000);
  
  const postFrames = await page.evaluate(() => 
    Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src.substring(0, 120), id: f.id }))
  );
  console.log('   iframes:', postFrames.length);
  for (const pf of postFrames) {
    if (pf.src) {
      try {
        const frame = page.frame({ url: pf.src });
        if (frame) {
          const ft = await frame.evaluate(() => document.body.innerText);
          if (ft && ft.length > 20) {
            console.log(`   [Frame data - ${pf.id || pf.src.substring(0, 40)}]`);
            ft.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));
          }
        }
      } catch(e) {}
    }
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
