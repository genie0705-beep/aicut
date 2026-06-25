const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 이미지 5장 스펙
const CARDS = [
  {
    no: 1,
    name: 'realestate_01_summary',
    desc: 'KPI Summary 카드 (다크 네이비)',
    searchKeyword: '비즈니스 카드 다크'
  },
  {
    no: 2,
    name: 'realestate_02_problem',
    desc: 'Problem 카드 (아이보리)',
    searchKeyword: '비즈니스 카드 심플'
  },
  {
    no: 3,
    name: 'realestate_03_reason',
    desc: 'Reason 카드 (다크 네이비)',
    searchKeyword: '비즈니스 카드 다크'
  },
  {
    no: 4,
    name: 'realestate_04_result',
    desc: 'Result Before/After 카드 (아이보리)',
    searchKeyword: '비즈니스 카드 심플'
  },
  {
    no: 5,
    name: 'realestate_05_cta',
    desc: 'CTA 카드 (다크 네이비)',
    searchKeyword: '비즈니스 카드 다크'
  }
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com'));
  
  if (!page) {
    console.log('미리캔버스 탭 없음');
    await b.close();
    return;
  }

  console.log('미리캔버스 탭:', page.url());
  
  // 현재 페이지 상태 확인
  await sleep(2000);
  const title = await page.title();
  console.log('페이지 제목:', title);
  
  // 새 디자인 만들기 버튼 또는 템플릿 선택
  const snapshot = await page.evaluate(() => {
    return {
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t).slice(0, 20),
      links: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href })).filter(a => a.text).slice(0, 15)
    };
  });
  console.log('버튼들:', JSON.stringify(snapshot.buttons));
  
  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 2000));
