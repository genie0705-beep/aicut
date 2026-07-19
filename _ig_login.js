const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const ig = ctx.pages().find(p => p.url().includes('instagram'));
  if (!ig) { console.log('No IG tab'); await b.close(); return; }
  
  ig.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  // Go to Instagram login page
  await ig.goto('https://www.instagram.com/accounts/login/', {waitUntil:'networkidle',timeout:20000});
  await ig.waitForTimeout(5000);
  
  console.log('URL:', ig.url().substring(0, 80));
  
  // Check for input fields
  const inputs = await ig.evaluate(() => {
    const allInputs = document.querySelectorAll('input');
    return Array.from(allInputs).map(i => ({
      type: i.type,
      name: i.name,
      placeholder: i.placeholder,
      value: i.value,
      autocomplete: i.autocomplete
    }));
  }).catch(() => []);
  console.log('Inputs:', JSON.stringify(inputs));
  
  await b.close();
})();
