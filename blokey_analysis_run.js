const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = null;
  for (const p of pages) {
    if (p.url().includes('blokey')) { page = p; break; }
  }
  if (!page) { console.log('no blokey tab'); await b.close(); return; }

  // 1. 계정/플랜 확인
  const planInfo = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const plans = text.match(/(Free|Pro|Premium|Enterprise|Basic|Standard)/g);
    const quotas = text.match(/\d+\/\d+/g);
    return { plan: plans ? [...new Set(plans)] : ['?'], quota: quotas ? quotas[0] : '?' };
  });
  console.log('1. 플랜:', JSON.stringify(planInfo));

  // 2. 실시간 트렌드
  console.log('\n2. 실시간 트렌드...');
  await page.goto('https://blokey.co.kr/trend', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  const trendText = await page.evaluate(() => {
    const text = document.body.innerText || '';
    // 트렌드 목록 추출
    const lines = text.split('\n').filter(l => l.trim().length > 0).slice(0, 50);
    return lines.join('\n');
  });
  console.log('트렌드:', trendText.slice(0, 1000));

  // 3. 황금키워드
  console.log('\n3. 황금키워드...');
  await page.goto('https://blokey.co.kr/golden-keyword', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  const goldenText = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const lines = text.split('\n').filter(l => l.trim().length > 0).slice(0, 60);
    return lines.join('\n');
  });
  console.log('황금키워드:', goldenText.slice(0, 1000));

  // 4. AICUT 브랜드 키워드 분석
  console.log('\n4. 키워드 분석...');
  const kws = [
    '에이컷', 'aicut', '영상편집외주', '영상편집아웃소싱',
    '숏폼마케팅', '영상마케팅', '영상편집업체', '숏폼제작',
    '영상편집대행', '릴스제작'
  ];

  const results = [];
  for (const kw of kws) {
    try {
      await page.goto('https://blokey.co.kr/keyword', { waitUntil: 'networkidle', timeout: 15000 });
      await sleep(1000);
      
      await page.evaluate((k) => {
        const inputs = document.querySelectorAll('input[type="text"]');
        for (const inp of inputs) {
          if (inp.offsetParent !== null) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (setter) { setter.call(inp, k); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }
          }
        }
      }, kw);
      await sleep(500);
      
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.innerText.includes('등급') || b.innerText.includes('분석')) { b.click(); return; }
        }
      });
      await sleep(3000);
      
      const r = await page.evaluate((k) => {
        const text = document.body.innerText || '';
        const g = text.match(/등급\s*([ABCDS])/);
        const s = text.match(/검색량[^]{0,50}([\d,~]+)/);
        const gi = text.match(/황금지수[^]{0,50}([\d.,]+)/);
        const c = text.match(/경쟁[^]{0,50}(높음|중간|낮음)/);
        const d = text.match(/문서수[^]{0,50}([\d,]+)/);
        return { kw: k, grade: g?.[1]||'?', searchVol: s?.[1]||'?', goldIdx: gi?.[1]||'?', comp: c?.[1]||'?', docs: d?.[1]||'?' };
      }, kw);
      results.push(r);
      console.log(`  [${r.grade}] ${r.kw} | 검색량:${r.searchVol} | 황금지수:${r.goldIdx} | 경쟁:${r.comp} | 문서:${r.docs}`);
    } catch(e) {
      console.log(`  ERR ${kw}: ${e.message}`);
    }
  }

  // 5. 연관 키워드 (aicut 기준)
  console.log('\n5. 연관키워드...');
  await page.goto('https://blokey.co.kr/keyword', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(1000);
  
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const inp of inputs) {
      if (inp.offsetParent !== null) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) { setter.call(inp, '영상편집외주'); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }
      }
    }
  });
  await sleep(500);
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText.includes('등급') || b.innerText.includes('분석')) { b.click(); return; }
    }
  });
  await sleep(4000);
  
  const related = await page.evaluate(() => {
    const text = document.body.innerText || '';
    return text.slice(0, 3000);
  });
  console.log('연관키워드 결과:', related.slice(0, 1000));

  await b.close();
  console.log('\n=== 완료 ===');
})();
