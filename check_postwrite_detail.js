const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }
  
  await new Promise(r => setTimeout(r, 2000));

  // 페이지 내 contenteditable 및 제목/본문 영역 분석
  const detail = await page.evaluate(() => {
    const lines = [];
    
    // 1. 모든 input
    document.querySelectorAll('input').forEach((el, i) => {
      lines.push(`input[${i}] id=${el.id} name=${el.name} placeholder="${el.placeholder}" value="${(el.value||'').substring(0,20)}"`);
    });
    
    // 2. 모든 contenteditable
    document.querySelectorAll('[contenteditable]').forEach((el, i) => {
      const cls = (typeof el.className === 'string') ? el.className : '';
      lines.push(`\ncontenteditable[${i}] id=${el.id} cls="${cls.substring(0,60)}"`);
      lines.push(`  innerText(처음50): "${(el.innerText||'').trim().substring(0,50)}"`);
      lines.push(`  innerHTML(처음200): "${(el.innerHTML||'').substring(0,200)}"`);
    });
    
    // 3. SE_editor 영역
    const se = document.querySelector('#SE_editor, .se-editor');
    if (se) {
      const cls = (typeof se.className === 'string') ? se.className : '';
      lines.push(`\nSE_editor: tag=${se.tagName} id=${se.id} cls="${cls.substring(0,50)}"`);
      lines.push(`  innerText(처음50): "${(se.innerText||'').trim().substring(0,50)}"`);
    }
    
    // 4. title 관련 요소
    const titleEls = document.querySelectorAll('[class*="title"]');
    titleEls.forEach(el => {
      const cls = (typeof el.className === 'string') ? el.className : '';
      if (el.offsetParent !== null) {
        lines.push(`\ntitle관련: tag=${el.tagName} cls="${cls.substring(0,40)}" text="${(el.innerText||'').trim().substring(0,30)}"`);
      }
    });
    
    // 5. placeholder 속성
    document.querySelectorAll('[placeholder]').forEach(el => {
      const p = el.getAttribute('placeholder') || '';
      if (p) lines.push(`placeholder: tag=${el.tagName} text="${p}"`);
    });
    
    return lines.join('\n');
  });
  
  console.log(detail);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
