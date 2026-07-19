const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  // Go to campaign details
  const url = 'https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267';
  await adsPage.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  
  // Click on the ad group name link
  const link = await adsPage.$('a:has-text("퀵스타트_파워링크")');
  if (link) {
    const href = await link.getAttribute('href');
    console.log('Ad group link:', href);
    
    if (href) {
      await adsPage.goto(new URL(href, url).href, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 4000));
      
      console.log('URL:', adsPage.url());
      const text = await adsPage.evaluate(() => document.body.innerText);
      console.log('--- PAGE TEXT ---');
      console.log(text);
    }
  } else {
    console.log('Ad group link not found');
    const links = await adsPage.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim().slice(0,40), href: a.href })).filter(a => a.text);
    });
    links.forEach(l => console.log(l.text, '->', l.href));
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
