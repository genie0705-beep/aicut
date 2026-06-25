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

  // 에디터 초기화
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
  });
  await page.waitForTimeout(2000);

  // 문단 추출
  const html = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : html;
  
  const paras = [];
  const tagRegex = /<(h[23]|p)[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = tagRegex.exec(bodyContent)) !== null) {
    let text = m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (text) paras.push(text);
  }
  console.log('문단:', paras.length);

  // write로 입력 (lineBreak 한 번만)
  await pf.evaluate((paras) => {
    const se = SmartEditor._editors['blogpc001'];
    se._canvasScrollingService.focusToFirstComp();
    const es = se._editingService;
    
    for (let i = 0; i < paras.length; i++) {
      es.write(paras[i]);
      if (i < paras.length - 1) {
        es.lineBreak();
      }
    }
  }, paras);
  
  await page.waitForTimeout(3000);
  
  const check = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const comps = wrap?.querySelectorAll('.se-component');
    return {
      textLen: se.getContentText().length,
      comps: comps?.length || 0,
      textComps: wrap?.querySelectorAll('.se-component.se-text').length || 0,
      firstText: wrap?.querySelector('.se-text-paragraph')?.textContent?.substring(0, 50)
    };
  });
  console.log('결과:', JSON.stringify(check));

  // writeTextWithSoftLineBreak 시도
  console.log('\n---- writeTextWithSoftLineBreak 시도 ----');
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
  });
  await page.waitForTimeout(2000);
  
  // \n으로 연결된 전체 텍스트를 한 번에 write
  const fullText = paras.join('\n');
  await pf.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    se._canvasScrollingService.focusToFirstComp();
    const es = se._editingService;
    
    // writeTextWithSoftLineBreak 사용
    if (typeof es.writeTextWithSoftLineBreak === 'function') {
      es.writeTextWithSoftLineBreak(text);
    } else {
      es.write(text);
    }
  }, fullText);
  
  await page.waitForTimeout(3000);
  
  const check2 = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const comps = wrap?.querySelectorAll('.se-component');
    const paras2 = wrap?.querySelectorAll('.se-text-paragraph');
    return {
      textLen: se.getContentText().length,
      comps: comps?.length || 0,
      textComps: wrap?.querySelectorAll('.se-component.se-text').length || 0,
      paraCount: paras2?.length || 0
    };
  });
  console.log('결과2:', JSON.stringify(check2));
  
  await ctx.close();
})().catch(e => console.error('ERR:', e.message));
