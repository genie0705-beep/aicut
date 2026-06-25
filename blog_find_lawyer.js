const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const p = ctx.pages()[6];
  await p.bringToFront();
  
  // Check ALL frames for the lawyer post link
  const frames = p.frames();
  console.log('전체 프레임:', frames.length);
  
  let found = false;
  for (let i = 0; i < frames.length; i++) {
    try {
      const text = await frames[i].evaluate(() => document.body.innerText).catch(() => '');
      if (text.includes('변호사') || text.includes('세무사') || text.includes('보험설계사')) {
        const url = frames[i].url();
        console.log('✅ 발견! 프레임 ' + i + ': ' + url.substring(0, 100));
        
        // In this frame, find the edit link
        const editInfo = await frames[i].evaluate(() => {
          const links = document.querySelectorAll('a');
          const result = [];
          links.forEach(a => {
            const href = a.href || '';
            const t = a.innerText.trim();
            if (href.includes('PostEditor') || href.includes('PostWrite') || href.includes('수정')) {
              result.push({ text: t.substring(0, 30), href: href.substring(0, 120) });
            }
          });
          return result;
        });
        console.log('수정 링크:', JSON.stringify(editInfo));
        
        found = true;
        break;
      }
    } catch(e) {}
  }
  
  if (!found) {
    // Let's just go directly to the blog post and find the edit link
    const knownIds = ['224315585369', '224312026671'];
    for (const id of knownIds) {
      await p.goto('https://blog.naver.com/aicut/' + id, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(()=>{});
      await p.waitForTimeout(3000);
      const text = await p.evaluate(() => document.body.innerText).catch(() => '');
      const frames2 = p.frames();
      for (let i = 0; i < frames2.length; i++) {
        try {
          const t = await frames2[i].evaluate(() => document.body.innerText).catch(() => '');
          if (t.includes('변호사') || t.includes('세무사')) {
            console.log('✅ 포스팅 ' + id + ' = 전문직 글!');
            
            // Find edit button in this frame
            const btns = await frames2[i].evaluate(() => {
              const items = document.querySelectorAll('a, button, span');
              const result = [];
              items.forEach(el => {
                const t2 = el.innerText.trim();
                const href = el.href || '';
                if ((t2.includes('수정') || href.includes('PostEditor') || href.includes('PostWrite')) && t2.length < 20) {
                  result.push({ text: t2.substring(0, 20), href: href.substring(0, 100), tag: el.tagName });
                }
              });
              return result;
            });
            console.log('수정 버튼:', JSON.stringify(btns));
            found = true;
            break;
          }
        } catch(e) {}
      }
      if (found) break;
    }
  }
  
  if (!found) console.log('전문직 포스팅을 찾을 수 없습니다');
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
