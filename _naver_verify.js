const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // Get all keywords from page 1 with their bids
  const text = await adsPage.evaluate(() => document.body.innerText);
  
  // Find keyword rows on page 1
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const keywords = [];
  let capturing = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === 'ON/OFF') { capturing = true; continue; }
    if (line.includes('1\n2\n3\n4\n5') || line.includes('•••')) { capturing = false; break; }
    if (!capturing) continue;
    if (['키워드', '상태', 'ON/OFF'].includes(line)) continue;
    if (line.startsWith('전체') || line.startsWith('확장') || line.startsWith('키워드 ')) continue;
    if (line.startsWith('필터')) continue;
    keywords.push(line);
  }
  
  console.log('=== PAGE 1 KEYWORDS ===');
  keywords.forEach(k => console.log(k));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
