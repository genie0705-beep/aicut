const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // 기존 PostWriteForm 탭 확인
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  }
  
  // 복구 팝업 - 이어서 작성
  const r = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.innerText || '').trim();
      if (t.includes('이어서')) { b.click(); return 'clicked'; }
    }
    return 'no popup';
  });
  console.log('복구:', r);
  await page.waitForTimeout(3000);
  
  // === 1. 제목 확인 ===
  const title = await page.evaluate(() => {
    try { return SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { return ''; }
  });
  console.log('\n=== 1. 제목 ===');
  console.log(title ? `✅ "${title}"` : '❌ 비어있음');
  
  // === 2. iframe 내부 HTML 분석 ===
  console.log('\n=== 2. 본문 HTML 분석 ===');
  
  const analysis = await page.evaluate(() => {
    const r = {};
    const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentDocument) { r.error = 'iframe 없음'; return r; }
    
    const doc = iframe.contentDocument;
    const body = doc.body;
    
    r.htmlLength = body.innerHTML.length;
    r.textLength = body.innerText.length;
    r.textPreview = body.innerText.substring(0, 300);
    
    // H2 태그 확인
    const h2s = body.querySelectorAll('h2');
    r.h2Count = h2s.length;
    r.h2Texts = [];
    h2s.forEach(h2 => r.h2Texts.push(h2.innerText.substring(0, 40)));
    
    // Strong 태그 확인
    const strongs = body.querySelectorAll('strong, b');
    r.strongCount = strongs.length;
    r.strongTexts = [];
    strongs.forEach(s => r.strongTexts.push(s.innerText.substring(0, 30)));
    
    // P 태그 확인
    const ps = body.querySelectorAll('p');
    r.pCount = ps.length;
    
    // 센터 정렬 확인
    const centerEls = body.querySelectorAll('[style*="text-align: center"], [align="center"]');
    r.centerCount = centerEls.length;
    r.centerSample = centerEls.length > 0 ? centerEls[0].innerText.substring(0, 30) : '없음';
    
    // HTML 태그가 텍스트로 보이는지 (깨짐 확인)
    const hasHtmlCode = body.innerHTML.includes('&lt;') || body.innerHTML.includes('&gt;') || 
                        body.innerText.includes('<h2') || body.innerText.includes('<p ');
    r.hasHtmlCode = hasHtmlCode;
    
    // 이미지 확인
    const imgs = body.querySelectorAll('img');
    r.imgCount = imgs.length;
    
    return r;
  });
  
  if (analysis.error) {
    console.log('❌', analysis.error);
  } else {
    console.log('HTML 길이:', analysis.htmlLength + ' chars');
    console.log('텍스트 길이:', analysis.textLength + ' chars');
    console.log('');
    console.log('H2 태그:', analysis.h2Count + '개');
    analysis.h2Texts.forEach((t, i) => console.log(`  ${i+1}. "${t}"`));
    console.log('');
    console.log('Strong 태그:', analysis.strongCount + '개');
    analysis.strongTexts.forEach((t, i) => console.log(`  ${i+1}. "${t}"`));
    console.log('');
    console.log('P 태그:', analysis.pCount + '개');
    console.log('센터 정렬:', analysis.centerCount + '개 요소');
    console.log('  샘플:', analysis.centerSample);
    console.log('');
    console.log('HTML 코드 깨짐:', analysis.hasHtmlCode ? '❌ 발견됨' : '✅ 없음');
    console.log('이미지:', analysis.imgCount + '개');
  }
  
  // === 3. SmartEditor 데이터 확인 ===
  console.log('\n=== 3. SmartEditor 데이터 ===');
  const seData = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData();
      const comps = d.document ? d.document.components : [];
      return { compCount: comps.length, compTypes: comps.map(c => c.type).join(', ') };
    } catch(e) { return { error: e.message }; }
  });
  console.log('컴포넌트:', seData.compCount + '개');
  console.log('타입:', seData.compTypes);
  
  // === 4. 스크린샷 ===
  await page.screenshot({ path: path.join(W, 'blog_seo_check.png'), fullPage: true });
  
  console.log('\n=== 분석 완료 ===');
  console.log('스크린샷 저장: blog_seo_check.png');
  
  await b.close();
})();
