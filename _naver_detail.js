const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  // Go to all campaigns
  await adsPage.goto('https://ads.naver.com/manage/ad-accounts/334739/all-campaigns', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  // Get all links and the campaign row
  const info = await adsPage.evaluate(() => {
    // Find all links
    const links = Array.from(document.querySelectorAll('a')).map(a => ({
      text: (a.innerText || '').trim().slice(0, 40),
      href: a.href
    })).filter(a => a.text.length > 0);
    
    // Find campaign name cell
    const allText = document.body.innerText;
    
    return { links, allText: allText.slice(2000, 4000) };
  });
  
  console.log('Campaign links:');
  info.links.filter(l => l.text.includes('영상') || l.text.includes('캠페인') || l.href.includes('campaign')).forEach(l => console.log(' ', l.text, '->', l.href));
  
  console.log('\n--- More page text ---');
  console.log(info.allText);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
