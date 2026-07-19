const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 GA4 페이지별 성과 분석 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('analytics.google.com')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://analytics.google.com/analytics/web/#/p538910436', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(5000);
  }
  await page.bringToFront();
  await sleep(3000);

  // 페이지 및 화면 보고서 (페이지별 조회수)
  console.log('1. 페이지 및 화면 보고서...');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/pagesandscreens', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(7000);

  const pageData = await page.evaluate(() => {
    const text = document.body.innerText;
    const result = {};

    // blog.naver.com 관련 페이지 스니펫
    const lines = text.split('\n').filter(l => l.trim());
    const blogLines = lines.filter(l => l.includes('blog.naver') || l.includes('aicut') || l.includes('/aicut/'));
    
    result.blogRelated = blogLines.slice(0, 30);
    result.rawPreview = text.substring(0, 3000);
    result.rawLines = lines.slice(0, 60);
    return result;
  });

  console.log('   [Pages containing blog.naver or aicut]');
  pageData.blogRelated.forEach(l => console.log('    ' + l));

  console.log('\n   [All pages - partial]');
  pageData.rawLines.forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  // 2. 랜딩 페이지 보고서
  console.log('\n2. 랜딩 페이지 보고서...');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/landingpages', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(7000);

  const landingData = await page.evaluate(() => {
    const text = document.body.innerText;
    const result = {};
    const lines = text.split('\n').filter(l => l.trim());
    const blogLines = lines.filter(l => l.includes('blog.naver') || l.includes('aicut') || l.includes('/aicut/'));
    result.blogLanding = blogLines.slice(0, 30);
    result.preview = text.substring(0, 2000);
    return result;
  });

  console.log('   [Blog landing pages]');
  landingData.blogLanding.forEach(l => console.log('    ' + l));

  console.log('\n   [All landing pages - partial]');
  const landingLines = landingData.preview.split('\n').filter(l => l.trim());
  landingLines.slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  b.close();
})().catch(e => console.error('FATAL:', e.message));
