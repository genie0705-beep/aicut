const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // === 1. 아트뮤 GX410 150W ===
  console.log('1️⃣ 아트뮤 GX410 150W');
  await page.goto('https://www.coupang.com/vp/products/8915834419', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  await page.evaluate(() => window.scrollTo(0, 3000));
  await sleep(3000);
  
  let text = await page.evaluate(() => document.body.innerText);
  
  // 상품 기본 정보
  const artmuInfo = text.match(/(아트뮤[^]*?150W[^]*?(?:원|%))/) || [];
  console.log('  정보:', artmuInfo[0]?.substring(0, 100) || '');
  
  // HP Victus 관련 사용후기/상품문의 찾기
  const artmuLines = text.split('\n').filter(l => {
    const lower = l.toLowerCase();
    return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍') || 
            lower.includes('4.5') || lower.includes('스마트핀') || lower.includes('배럴')) &&
           l.length < 120 && l.length > 5;
  });
  console.log(`  HP/Victus 언급: ${artmuLines.length}건`);
  artmuLines.slice(0, 10).forEach(l => console.log(`    → ${l.trim()}`));

  // === 2. 지파워 PD150W 검색 후 상세 ===
  console.log('\n\n2️⃣ 지파워 GaN PD150W');
  await page.goto('https://www.coupang.com/np/search?q=' + encodeURIComponent('지파워 GaN PD150W 4구 멀티형 노트북'), { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  
  // 지파워 링크 찾기
  const jpLink = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/vp/products/"]');
    for (const a of links) {
      if (a.textContent.includes('지파워') && a.textContent.includes('PD150W')) return a.href;
    }
    return null;
  });

  if (jpLink) {
    console.log('  상세페이지 이동:', jpLink.substring(0, 60));
    await page.goto(jpLink, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(4000);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await sleep(3000);
    
    text = await page.evaluate(() => document.body.innerText);
    const jpLines = text.split('\n').filter(l => {
      const lower = l.toLowerCase();
      return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍')) && l.length < 120;
    });
    console.log(`  HP/Victus 언급: ${jpLines.length}건`);
    jpLines.slice(0, 10).forEach(l => console.log(`    → ${l.trim()}`));
    
    const jpTitle = text.match(/(지파워[^]*?(?:PD150W|150W)[^]*?(?:원|%))/) || [];
    console.log('  상품:', jpTitle[0]?.substring(0, 80) || '');
  }

  // === 3. 컴스 IF975 상세 ===
  console.log('\n\n3️⃣ 컴스 IF975 HP 변환젠더');
  await page.goto('https://www.coupang.com/np/search?q=' + encodeURIComponent('컴스 USB Type C 노트북 전원 변환젠더 IF975 HP'), { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);
  
  const comsLink = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/vp/products/"]');
    for (const a of links) {
      if (a.textContent.includes('컴스') && a.textContent.includes('IF975')) return a.href;
    }
    return null;
  });

  if (comsLink) {
    console.log('  상세페이지 이동:', comsLink.substring(0, 60));
    await page.goto(comsLink, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(3000);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await sleep(3000);
    
    text = await page.evaluate(() => document.body.innerText);
    const comsLines = text.split('\n').filter(l => {
      const lower = l.toLowerCase();
      return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍') || 
              lower.includes('오멘') || lower.includes('4.5')) && l.length < 120;
    });
    console.log(`  HP 관련 언급: ${comsLines.length}건`);
    comsLines.slice(0, 15).forEach(l => console.log(`    → ${l.trim()}`));
    
    const comsTitle = text.match(/(컴스[^]*?(?:IF975|변환)[^]*?(?:원|%))/) || [];
    console.log('  상품:', comsTitle[0]?.substring(0, 80) || '');
  }

  // === 4. 노트킹 D-8 변환젠더 상세 ===
  console.log('\n\n4️⃣ 노트킹 D-8 HP 변환젠더');
  await page.goto('https://www.coupang.com/np/search?q=' + encodeURIComponent('노트킹 USB-C TO DC 4.5x3.0 100W D-8 HP'), { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);
  
  const ntLink = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/vp/products/"]');
    for (const a of links) {
      if (a.textContent.includes('노트킹') && a.textContent.includes('D-8')) return a.href;
    }
    return null;
  });

  if (ntLink) {
    console.log('  상세페이지 이동:', ntLink.substring(0, 60));
    await page.goto(ntLink, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(3000);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await sleep(3000);
    
    text = await page.evaluate(() => document.body.innerText);
    const ntLines = text.split('\n').filter(l => {
      const lower = l.toLowerCase();
      return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍')) && l.length < 120;
    });
    console.log(`  HP/Victus 언급: ${ntLines.length}건`);
    ntLines.slice(0, 15).forEach(l => console.log(`    → ${l.trim()}`));
    
    const ntTitle = text.match(/(노트킹[^]*?(?:D-8|100W)[^]*?(?:원|%))/) || [];
    console.log('  상품:', ntTitle[0]?.substring(0, 80) || '');
  }

  // === 5. 에이치디탑 변환케이블 상세 ===
  console.log('\n\n5️⃣ 에이치디탑 PD100W 케이블');
  await page.goto('https://www.coupang.com/np/search?q=' + encodeURIComponent('에이치디탑 C타입 to DC PD100W 노트북 충전 케이블 4.5mm'), { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);
  
  const hdtLink = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/vp/products/"]');
    for (const a of links) {
      if (a.textContent.includes('에이치디탑') && a.textContent.includes('PD100W')) return a.href;
    }
    return null;
  });

  if (hdtLink) {
    console.log('  상세페이지 이동:', hdtLink.substring(0, 60));
    await page.goto(hdtLink, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(3000);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await sleep(3000);
    
    text = await page.evaluate(() => document.body.innerText);
    const hdtLines = text.split('\n').filter(l => {
      const lower = l.toLowerCase();
      return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍')) && l.length < 120;
    });
    console.log(`  HP/Victus 언급: ${hdtLines.length}건`);
    hdtLines.slice(0, 15).forEach(l => console.log(`    → ${l.trim()}`));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
