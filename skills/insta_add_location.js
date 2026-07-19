const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ig = b.contexts()[0].pages().find(p => p.url().includes('instagram.com') && !p.url().includes('accounts'));
  if (!ig) { console.log('인스타 없음'); await b.close(); return; }

  // 3개 게시물에 위치=서울 추가
  for (let i = 0; i < 3; i++) {
    console.log(`\n[${i+1}/3] 게시물 ${i+1}번 위치 추가...`);

    await ig.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(3000);

    // 게시물 클릭
    const clicked = await ig.evaluate((idx) => {
      const links = document.querySelectorAll('a[href*="/p/"]');
      if (links[idx]) { links[idx].click(); return true; }
      return false;
    }, i);
    if (!clicked) { console.log('  게시물 못찾음'); continue; }
    await sleep(3000);

    // ⋮ 더보기
    await ig.evaluate(() => {
      document.querySelectorAll('svg').forEach(svg => {
        const aria = svg.getAttribute('aria-label') || '';
        if (aria.includes('더 보기') || aria.includes('more')) {
          svg.closest('[role="button"], button')?.click();
        }
      });
    });
    await sleep(2000);

    // 수정
    await ig.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button, [role="button"], span, div')).find(e => e.innerText?.trim() === '수정' || e.innerText?.trim() === 'Edit');
      if (el) el.click();
    });
    await sleep(3000);

    // 위치 추가 버튼 찾기
    const locAdded = await ig.evaluate(() => {
      // 위치 추가 버튼
      const span = Array.from(document.querySelectorAll('span, div, button')).find(el => {
        const t = el.innerText?.trim();
        return t === '위치 추가' || t === 'Add location' || t === '위치';
      });
      if (span) { span.click(); return 'clicked'; }
      // 더 넓게 찾기
      const all = Array.from(document.querySelectorAll('span, div, button, [role="button"]')).filter(el => {
        const t = el.innerText?.trim();
        return t && (t.includes('위치') || t.includes('location'));
      });
      return all.length > 0 ? 'found location text' : 'no location';
    });
    console.log('  위치:', locAdded);
    await sleep(2000);

    if (locAdded === 'clicked') {
      // 위치 검색창에 '서울' 입력
      const searchInput = await ig.$('input[placeholder*="검색"], input[placeholder*="search"], input[type="text"]');
      if (searchInput) {
        await searchInput.click();
        await sleep(300);
        await ig.keyboard.type('서울', { delay: 50 });
        await sleep(2000);

        // 첫 번째 검색 결과 선택
        await ig.evaluate(() => {
          const items = document.querySelectorAll('[role="option"], [role="button"], div[style*="cursor"]');
          for (const item of items) {
            const t = item.innerText?.trim();
            if (t && t.includes('서울')) { item.click(); return; }
          }
        });
        await sleep(1500);
        console.log('  위치 선택 완료');
      }
    }

    // 완료 버튼
    await ig.evaluate(() => {
      document.querySelectorAll('button, [role="button"]').forEach(btn => {
        const t = btn.innerText?.trim();
        if (t === '완료' || t === 'Done') { btn.click(); }
      });
      // 체크 아이콘
      document.querySelectorAll('svg').forEach(svg => {
        const aria = svg.getAttribute('aria-label') || '';
        if (aria.includes('확인') || aria.includes('check') || aria.includes('done')) {
          svg.closest('[role="button"], button')?.click();
        }
      });
    });
    await sleep(3000);
    console.log('  ✅ 완료');
  }

  await b.close();
  console.log('\n✅ 3개 게시물 위치=서울 추가 완료!');
}
main().catch(e => console.error('❌ 에러:', e.message));
