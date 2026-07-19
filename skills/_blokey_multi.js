// blokey — 여러 키워드 분석 (무료 범위 내)
const { chromium } = require('playwright');

const KEYWORDS = [
  '영상편집아웃소싱',
  '숏폼제작의뢰',
  '병원영상마케팅',
  '부동산숏폼마케팅',
  '보험마케팅영상',
  '프랜차이즈마케팅',
];

async function analyze(page, keyword) {
  // 키워드 분석 페이지
  await page.goto('https://blokey.co.kr/keyword', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  
  // 키워드 입력
  await page.evaluate((kw) => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const inp of inputs) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(inp, kw);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, keyword);
  await page.waitForTimeout(500);
  
  // 조회 버튼
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText.includes('등급') || b.innerText.includes('조회')) { b.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  // 결과 추출
  const result = await page.evaluate((kw) => {
    const text = document.body.innerText || '';
    
    // 등급 찾기
    const gradeMatch = text.match(/등급\s*([ABCDS])/);
    const searchMatch = text.match(/검색량\s*규모\s*([\d,~]+)/);
    const goldMatch = text.match(/황금지수\s*범위\s*([<>\d.]+)/);
    const compMatch = text.match(/경쟁\s*강도\s*(높음|중간|낮음)/);
    
    return {
      keyword: kw,
      grade: gradeMatch ? gradeMatch[1] : '?',
      searchVolume: searchMatch ? searchMatch[1] : '?',
      goldIndex: goldMatch ? goldMatch[1] : '?',
      competition: compMatch ? compMatch[1] : '?',
    };
  }, keyword);
  
  return result;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blokey')) { page = p; break; }
  }
  if (!page) { console.log('blokey 없음'); await b.disconnect(); return; }
  
  console.log('=== 키워드 분석 결과 ===');
  console.log('키워드 | 등급 | 검색량 | 황금지수 | 경쟁');
  console.log('-'.repeat(60));
  
  const results = [];
  for (const kw of KEYWORDS) {
    try {
      const r = await analyze(page, kw);
      console.log(`${r.keyword} | ${r.grade} | ${r.searchVolume} | ${r.goldIndex} | ${r.competition}`);
      results.push(r);
    } catch(e) {
      console.log(`${kw} | ❌ 오류`);
    }
    // 무료 플랜 시간당 10회 제한 고려
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n\n=== 분석 완료 ===');
  console.log('추천 키워드 (등급↑ + 경쟁↓):');
  results
    .filter(r => r.grade !== '?')
    .sort((a, b) => (a.grade > b.grade ? 1 : -1))
    .forEach(r => console.log(`  [${r.grade}] ${r.keyword} — 검색량:${r.searchVolume} / 경쟁:${r.competition}`));
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
