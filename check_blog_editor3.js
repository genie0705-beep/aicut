const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('blog.naver.com') && p.url().includes('Write'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 5000));
  }
  
  const pwFrame = page.frames().find(f => f.url().includes('PostWriteForm'));
  if (!pwFrame) { console.log('프레임 없음'); await b.close(); process.exit(0); }
  
  console.log('PostWriteForm 접근 완료');
  
  // 자세한 DOM 분석
  const detail = await pwFrame.evaluate(() => {
    const lines = [];
    
    // 모든 input
    document.querySelectorAll('input').forEach((el, i) => {
      lines.push(`input[${i}] id=${el.id} name=${el.name} type=${el.type} placeholder="${el.placeholder}" value="${(el.value||'').substring(0,30)}"`);
    });
    
    // 모든 textarea
    document.querySelectorAll('textarea').forEach((el, i) => {
      lines.push(`textarea[${i}] id=${el.id} name=${el.name} rows=${el.rows}`);
    });
    
    // 모든 contenteditable
    document.querySelectorAll('[contenteditable]').forEach((el, i) => {
      const cls = typeof el.className === 'string' ? el.className : '';
      lines.push(`contenteditable[${i}] id=${el.id} cls=${cls.substring(0,50)} text="${(el.innerText||'').substring(0,30)}"`);
    });
    
    // 모든 iframe
    document.querySelectorAll('iframe').forEach((el, i) => {
      lines.push(`iframe[${i}] id=${el.id} src=${(el.src||'').substring(0,80)}`);
    });
    
    // se-body 영역
    const seBody = document.querySelector('.se-body');
    if (seBody) {
      seBody.querySelectorAll('*').forEach((el, i) => {
        const cls = typeof el.className === 'string' ? el.className : '';
        const tag = el.tagName;
        if (tag === 'DIV' || tag === 'SPAN' || tag === 'P') {
          const t = (el.innerText||'').substring(0,30);
          lines.push(`se-body > ${tag}[${i}] cls=${cls.substring(0,40)} text="${t}"`);
        }
      });
    }
    
    // title 영역 찾기 (se-title)
    const seTitle = document.querySelector('.se-title, #title, [data-name="title"]');
    if (seTitle) {
      const cls = typeof seTitle.className === 'string' ? seTitle.className : '';
      lines.push(`se-title: tag=${seTitle.tagName} cls=${cls.substring(0,40)} text="${(seTitle.innerText||'').substring(0,30)}"`);
    } else {
      lines.push('se-title: not found');
    }
    
    // 전체 body HTML 구조 (축약)
    const bodyHTML = document.body.innerHTML.substring(0, 3000);
    lines.push('\n=== body HTML (일부) ===');
    lines.push(bodyHTML);
    
    return lines.join('\n');
  });
  
  console.log(detail.substring(0, 4000));
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
