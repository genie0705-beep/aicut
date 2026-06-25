const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  const page = pages[6];

  await new Promise(r => setTimeout(r, 2000));

  // 에디터 전체 DOM 구조 분석
  const fullDetail = await page.evaluate(() => {
    const lines = [];
    
    // 1. 모든 [contenteditable] 상세
    document.querySelectorAll('[contenteditable]').forEach((el, i) => {
      const cls = (typeof el.className === 'string') ? el.className : '';
      const parentEl = el.parentElement;
      const parentCls = parentEl ? (typeof parentEl.className === 'string' ? parentEl.className : '') : '';
      lines.push(`CE[${i}] id=${el.id} cls="${cls.substring(0,50)}"`);
      lines.push(`   parent: tag=${parentEl?.tagName} cls="${parentCls.substring(0,40)}"`);
      lines.push(`   text(처음30): "${(el.innerText||'').trim().substring(0,30)}"`);
    });

    // 2. SE_editor 내부 구조
    const se = document.querySelector('#SE_editor, .se-editor, [class*="editor"]');
    if (se) {
      lines.push(`\nSE: tag=${se.tagName} id=${se.id} cls="${(typeof se.className === 'string' ? se.className : '').substring(0,40)}"`);
      
      // SE 내부 첫 번째 레벨 자식들
      Array.from(se.children).slice(0, 5).forEach((child, i) => {
        const cls = typeof child.className === 'string' ? child.className : '';
        const ce = child.isContentEditable;
        lines.push(`  child[${i}]: tag=${child.tagName} ce=${ce} cls="${cls.substring(0,40)}" text="${(child.innerText||'').trim().substring(0,20)}"`);
      });
    }

    // 3. input/textarea 모두
    document.querySelectorAll('input, textarea').forEach((el, i) => {
      const name = el.getAttribute('name') || '';
      const id = el.id || '';
      const ph = el.getAttribute('placeholder') || '';
      const val = (el.value || '').substring(0, 20);
      lines.push(`INPUT[${i}]: name=${name} id=${id} placeholder="${ph}" value="${val}"`);
    });

    // 4. "제목"이라는 텍스트가 있는 요소
    document.querySelectorAll('*').forEach(el => {
      const t = (el.innerText || '').trim();
      if (t === '제목' && el.children.length === 0) {
        const cls = typeof el.className === 'string' ? el.className : '';
        lines.push(`\n"제목"텍스트: tag=${el.tagName} cls="${cls.substring(0,30)}"`);
        const pe = el.parentElement;
        if (pe) {
          lines.push(`  parent: tag=${pe.tagName} cls="${(typeof pe.className === 'string' ? pe.className : '').substring(0,30)}"`);
          // 부모 내 모든 contenteditable
          pe.querySelectorAll('[contenteditable]').forEach(ce => {
            lines.push(`  parent내 CE: "${(ce.innerText||'').trim().substring(0,30)}"`);
          });
        }
      }
    });

    // 5. postwrite 전용: editor 영역 확인
    const editorArea = document.querySelector('.editor, .write_editor, .post_editor, [class*="write"]');
    if (editorArea) {
      lines.push(`\nEditorArea: tag=${editorArea.tagName} cls="${(typeof editorArea.className === 'string' ? editorArea.className : '').substring(0,40)}"`);
    }

    return lines.join('\n');
  });

  console.log(fullDetail);

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
