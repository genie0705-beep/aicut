const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Click image toolbar button
  console.log('=== 이미지 툴바 버튼 클릭 ===');
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('.se-image-toolbar-button');
    if (btn) { btn.click(); return 'ok'; }
    return 'not found';
  });
  console.log('클릭 결과:', clicked);
  await page.waitForTimeout(3000);
  
  // 2. Analyze panels/buttons after click
  console.log('\n=== 클릭 후 화면 분석 ===');
  const data = await page.evaluate(() => {
    const results = [];
    // All visible buttons with text
    document.querySelectorAll('button').forEach(b => {
      const t = (b.innerText || '').trim();
      const r = b.getBoundingClientRect();
      if (t && r.width > 0) results.push({type:'button', text:t.substring(0,30), x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height)});
    });
    // File inputs
    document.querySelectorAll('input[type="file"]').forEach(f => {
      const r = f.getBoundingClientRect();
      results.push({type:'file_input', id:f.id||'', x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height)});
    });
    // Visible iframes
    document.querySelectorAll('iframe').forEach(f => {
      const r = f.getBoundingClientRect();
      if (r.width > 0) results.push({type:'iframe', id:f.id||'', src:String(f.src||'').substring(0,50), x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height)});
    });
    return results;
  });
  data.forEach(d => console.log(`  ${d.type} | ${d.text||d.id||d.src} | (${d.x},${d.y}) ${d.w}x${d.h}`));
  
  // 3. Tag input
  console.log('\n=== 태그(글감) input ===');
  const tags = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).filter(i => i.offsetWidth > 0).map(i => ({placeholder:i.placeholder, id:i.id, name:i.name, class:String(i.className||'').substring(0,40), x:Math.round(i.getBoundingClientRect().x), y:Math.round(i.getBoundingClientRect().y)}));
  });
  tags.forEach(t => console.log(`  placeholder:"${t.placeholder}" | id:${t.id} | name:${t.name} | class:${t.class} | (${t.x},${t.y})`));
  
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_editor_analyze3.png' });
  console.log('\n=== 완료 ===');
  await browser.close();
})();
