const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 통계 데이터 수집 ===\n');

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

  // 통계 iframe에서 모든 텍스트 + HTML 구조 추출
  const statFrame = page.frames().find(f => f.url().includes('blog.stat.naver.com'));
  if (!statFrame) {
    console.log('통계 프레임 없음');
    b.close();
    return;
  }

  console.log('✅ 통계 프레임 발견:', statFrame.url().substring(0, 100));

  // 1. 모든 innerText
  console.log('\n━━━ A. 전체 텍스트 ━━━');
  const text = await statFrame.evaluate(() => document.body.innerText);
  text.split('\n').filter(l => l.trim()).forEach((l, i) => console.log(`  ${i}: ${l.trim()}`));

  // 2. innerHTML에서 숫자 데이터 추출 (차트 데이터 등)
  console.log('\n━━━ B. 숫자/데이터 요소 ━━━');
  const numbers = await statFrame.evaluate(() => {
    const result = {};
    
    // 모든 visible text nodes that are purely numeric
    const all = document.body.getElementsByTagName('*');
    const numElements = [];
    for (const el of all) {
      const text = el.textContent.trim();
      if (/^[0-9,]+$/.test(text) && text.length < 20) {
        numElements.push({ tag: el.tagName, text, cls: el.className, id: el.id });
      }
    }
    result.numbers = numElements;

    // 주간/월간 데이터 버튼 등
    const buttons = [];
    document.querySelectorAll('button, a, span[class*="period"], [class*="tab"]').forEach(el => {
      const t = el.textContent.trim();
      if (t && (t.includes('주간') || t.includes('월간') || t.includes('일간') || /^[0-9]+$/.test(t) || t.includes('조회') || t.includes('방문'))) {
        buttons.push({ tag: el.tagName, text: t, cls: el.className.substring(0, 40), id: el.id });
      }
    });
    result.buttons = buttons.slice(0, 20);

    return result;
  });

  console.log('  순수 숫자 요소:', numbers.numbers?.slice(0, 20).map(n => `${n.tag} ${n.text} (${n.cls})`).join(', ') || '없음');
  console.log('  주요 버튼/탭:');
  numbers.buttons?.forEach(b => console.log(`    <${b.tag}> ${b.text} | class=${b.cls}`));

  // 3. 주간 통계로 전환
  console.log('\n━━━ C. 주간 통계 ━━━');
  // Try clicking on a period button or navigating
  // 주간 통계는 다른 URL에 있을 수 있음
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(2000);
  
  // 일간/주간/월간 탭 클릭 시도
  const statFrame2 = page.frames().find(f => f.url().includes('blog.stat.naver.com'));
  if (statFrame2) {
    // Try to find and click "주간" or "월간" button
    const clicked = await statFrame2.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, span[class*="period"], [class*="tab"]');
      for (const btn of buttons) {
        if (btn.textContent.trim() === '주간' || btn.textContent.trim() === '월간' || btn.textContent.includes('주간') || btn.textContent.includes('월간')) {
          btn.click();
          return btn.textContent.trim();
        }
      }
      return null;
    });
    console.log('   클릭:', clicked || '주간/월간 버튼 없음');
    await sleep(3000);

    // 다시 데이터 추출
    const ft = await statFrame2.evaluate(() => document.body.innerText);
    console.log('   [After click]');
    ft.split('\n').filter(l => l.trim()).forEach((l, i) => console.log(`    ${i}: ${l.trim()}`));
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
