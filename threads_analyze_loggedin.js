const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const tp = ctx.pages().find(p => p.url().includes('threads.com'));
  if (!tp) { console.log('Threads 탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // 모든 버튼 및 클릭 가능 요소 분석
  const allClicks = await tp.evaluate(() => {
    const results = [];
    const all = document.querySelectorAll('*');
    all.forEach(el => {
      const tag = el.tagName;
      const role = el.getAttribute('role') || '';
      const cls = (typeof el.className === 'string') ? el.className : '';
      const text = (el.innerText || '').trim().substring(0, 15);
      const r = el.getBoundingClientRect();
      
      // 보이는 요소 중 클릭 가능한 것
      if (r.width > 0 && r.height > 0 && r.x >= 0 && r.x < 2000) {
        const isClickable = role === 'button' || tag === 'BUTTON' || tag === 'A';
        if (isClickable && r.width < 200 && r.height < 200) {
          results.push({
            tag, role, cls: cls.substring(0, 25),
            text, w: Math.round(r.w), h: Math.round(r.h),
            x: Math.round(r.x), y: Math.round(r.y)
          });
        }
      }
    });
    return results;
  });

  console.log('=== 클릭 가능한 요소들 ===');
  allClicks.forEach((c, i) => {
    console.log(` [${i}] ${c.tag} role=${c.role} cls=${c.cls} text="${c.text}" ${c.w}x${c.h} @(${c.x},${c.y})`);
  });

  // 로그인 상태인지 확인
  const text = await tp.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('\n=== 페이지 텍스트 ===');
  console.log(text.substring(0, 300));

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
