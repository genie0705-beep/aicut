const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const tp = ctx.pages().find(p => p.url().includes('threads.com'));
  if (!tp) { console.log('Threads 탭 없음'); await b.close(); process.exit(0); }

  // Threads 홈
  await tp.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  // 전체 페이지 DOM 구조 상세 분석
  const pageAnalysis = await tp.evaluate(() => {
    const lines = [];
    // 모든 role 속성 요소
    const roles = document.querySelectorAll('[role]');
    const roleCounts = {};
    roles.forEach(el => {
      const r = el.getAttribute('role') || '';
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    });
    lines.push('=== Role별 개수 ===');
    Object.entries(roleCounts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => lines.push(` ${k}: ${v}`));

    // 모든 a 태그 중 주요 링크
    lines.push('\n=== 주요 a 태그 ===');
    document.querySelectorAll('a').forEach((a, i) => {
      const href = a.getAttribute('href') || '';
      const text = (a.innerText || '').trim().substring(0, 20);
      const r = a.getBoundingClientRect();
      if (r.width > 0 && (href.length > 1 || text.length > 0)) {
        lines.push(` [${i}] href=${href.substring(0, 40)} text="${text}" size=${Math.round(r.w)}x${Math.round(r.h)} @(${Math.round(r.x)},${Math.round(r.y)})`);
      }
    });

    // 모든 button 요소
    lines.push('\n=== button 요소 ===');
    document.querySelectorAll('button').forEach((b, i) => {
      const t = (b.innerText || '').trim().substring(0, 20);
      const r = b.getBoundingClientRect();
      if (r.width > 0) lines.push(` [${i}] text="${t}" size=${Math.round(r.width)}x${Math.round(r.height)} @(${Math.round(r.x)},${Math.round(r.y)})`);
    });

    // 60x60 근처의 div (아이콘 버튼들)
    lines.push('\n=== 40~80px 아이콘 영역 ===');
    const all = document.querySelectorAll('div, a');
    all.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width >= 40 && r.width <= 80 && r.height >= 40 && r.height <= 80 && r.x > 0) {
        const role = el.getAttribute('role') || '';
        const text = (el.innerText || '').trim().substring(0, 10);
        const cls = (typeof el.className === 'string') ? el.className.substring(0, 20) : '';
        lines.push(` tag=${el.tagName} role="${role}" cls="${cls}" text="${text}" ${Math.round(r.w)}x${Math.round(r.h)} @(${Math.round(r.x)},${Math.round(r.y)})`);
      }
    });

    return lines.join('\n');
  });

  console.log(pageAnalysis);

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
