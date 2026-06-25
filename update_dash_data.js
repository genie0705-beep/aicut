const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('aicut_marketing'));
  if (!page) { console.log('Dashboard tab not found'); return; }
  
  // Wait for full JS init
  await page.waitForTimeout(3000);
  
  // Inject data via localStorage (the DataStore uses prefix 'aicut_ds_')
  const instagramData = {
    'instagram.views': 6426,
    'instagram.likes': 4,
    'instagram.comments': 1,
    'instagram.followers': 45,
    'instagram.posts': 12,
    'instagram.lastPost': '23시간 전'
  };
  
  const result = await page.evaluate((data) => {
    // Save via DataStore if available, else directly
    if (typeof DataStore !== 'undefined') {
      for (const [k, v] of Object.entries(data)) {
        DataStore.set(k, v);
      }
      DataStore._save();
      return { method: 'DataStore', keys: Object.keys(data) };
    } else {
      // Direct localStorage fallback
      const key = 'aicut_ds_all';
      let existing = {};
      try { existing = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
      Object.assign(existing, data);
      localStorage.setItem(key, JSON.stringify(existing));
      return { method: 'localStorage', keys: Object.keys(data) };
    }
  }, instagramData);
  
  console.log('Data saved via:', JSON.stringify(result));
  
  // Reload and verify
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const verified = await page.evaluate(() => {
    if (typeof DataStore !== 'undefined') {
      return {
        views: DataStore.get('instagram.views'),
        likes: DataStore.get('instagram.likes')
      };
    }
    return { error: 'DataStore not found after reload' };
  });
  
  console.log('Verified data:', JSON.stringify(verified));
  console.log('✅ Dashboard data updated successfully!');
})();
