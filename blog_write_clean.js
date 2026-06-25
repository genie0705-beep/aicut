const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  if (!page) { await ctx.close(); return; }
  await page.bringToFront();
  await page.waitForTimeout(2000);
  
  const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
  if (!pf) { await ctx.close(); return; }

  // 문단 추출 (이모지 제거)
  const html = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : html;
  
  const paras = [];
  const tagRegex = /<(h[23]|p)[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = tagRegex.exec(bodyContent)) !== null) {
    let text = m[2]
      .replace(/<strong>([\s\S]*?)<\/strong>/g, '$1')
      .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1')
      .replace(/<br\s*\/?>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      // 이모지 제거 (🎯🔥🤖📊✂️☀️🚀 등)
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/\s+/g, ' ').trim();
    if (text) paras.push(text);
  }
  console.log('문단:', paras.length, '(이모지 제거됨)');

  // 제목 (이모지 제거)
  const title = '릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략';
  
  // 에디터 초기화
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('');
  });
  await page.waitForTimeout(2000);
  
  // writeTextWithSoftLineBreak로 전체 텍스트 한 번에 입력
  const fullText = paras.join('\n');
  await pf.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    se._canvasScrollingService.focusToFirstComp();
    const es = se._editingService;
    if (typeof es.writeTextWithSoftLineBreak === 'function') {
      es.writeTextWithSoftLineBreak(text);
    } else {
      es.write(text);
    }
  }, fullText);
  
  await page.waitForTimeout(3000);
  
  // 제목 설정
  await pf.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, title);
  
  await page.waitForTimeout(1000);
  
  const check = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    return {
      title: se.getDocumentTitle(),
      textLen: se.getContentText().length,
      comps: wrap?.querySelectorAll('.se-component').length || 0,
      paras: wrap?.querySelectorAll('.se-text-paragraph').length || 0,
      textComps: wrap?.querySelectorAll('.se-component.se-text').length || 0
    };
  });
  console.log('결과:', JSON.stringify(check));
  
  // 빈 paragraph 확인
  const emptyCheck = await pf.evaluate(() => {
    const paras2 = document.querySelectorAll('.se-text-paragraph');
    let empty = 0;
    paras2.forEach(p => { if (!p.textContent.trim()) empty++; });
    return { totalParas: paras2.length, emptyParas: empty };
  });
  console.log('빈 paragraph:', JSON.stringify(emptyCheck));
  
  await ctx.close();
})().catch(e => console.error('ERR:', e.message));
