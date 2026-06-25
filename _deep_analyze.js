const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  console.log('=== 정밀 분석 ===\n');
  
  const r = {};
  
  // 1. 제목
  try { r.title = await page.evaluate(() => SmartEditor._editors['blogpc001'].getDocumentTitle()); } catch(e) { r.title = 'ERROR'; }
  console.log('[1] 제목:', r.title ? '✅ "' + r.title + '"' : '❌ 없음');
  
  // 2. getDocumentData 내부 데이터 구조
  const data = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData();
      const comps = d.document ? d.document.components : [];
      const detail = comps.map((c, i) => {
        const info = { idx: i, type: c.type || c['@ctype'] };
        // text 컴포넌트의 value 확인
        if (c.value && c.value.length > 0) {
          info.valueCount = c.value.length;
          info.firstValue = JSON.stringify(c.value[0]).substring(0, 100);
        }
        if (c.textContent) info.textContent = c.textContent.substring(0, 50);
        return info;
      });
      return { count: comps.length, detail: detail };
    } catch(e) { return { error: e.message }; }
  });
  console.log('\n[2] getDocumentData 컴포넌트:', data.count + '개');
  data.detail.forEach(d => {
    console.log(`   [${d.idx}] type:${d.type} | valueCount:${d.valueCount || 0} ${d.textContent ? '| text:' + d.textContent : ''} ${d.firstValue ? '| sample:' + d.firstValue : ''}`);
  });
  
  // 3. iframe body 상세
  const iframe = await page.evaluate(() => {
    const r = {};
    const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentDocument) { r.error = '접근불가'; return r; }
    const body = iframe.contentDocument.body;
    r.htmlLen = body.innerHTML.length;
    r.textLen = body.innerText.length;
    r.h2 = body.querySelectorAll('h2').length;
    r.strong = body.querySelectorAll('strong, b').length;
    r.p = body.querySelectorAll('p').length;
    r.img = body.querySelectorAll('img').length;
    r.allHTML = body.innerHTML;
    r.textPreview = body.innerText.substring(0, 200);
    // 하위 태그 전체 분석
    const allTags = {};
    body.querySelectorAll('*').forEach(el => {
      const t = el.tagName;
      allTags[t] = (allTags[t] || 0) + 1;
    });
    r.tagSummary = Object.entries(allTags).sort((a,b) => b[1]-a[1]).slice(0,15).map(([t,c]) => t+'='+c).join(', ');
    return r;
  });
  
  console.log('\n[3] iframe 화면:');
  if (iframe.error) {
    console.log('   ❌', iframe.error);
  } else {
    console.log('   HTML 길이:', iframe.htmlLen + ' chars ' + (iframe.htmlLen > 0 ? '✅' : '❌'));
    console.log('   태그 요약:', iframe.tagSummary);
    console.log('   H2:', iframe.h2 + '개');
    console.log('   Strong:', iframe.strong + '개');
    console.log('   P:', iframe.p + '개');
    console.log('   이미지:', iframe.img + '개');
    console.log('   텍스트:', iframe.textPreview ? iframe.textPreview.substring(0, 100) : '(비어있음)');
  }
  
  // 4. 해시태그
  const tags = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        return { value: inp.value, count: inp.value.split('#').filter(t => t.trim().length > 0).length };
      }
    }
    return { error: '못 찾음' };
  });
  console.log('\n[4] 해시태그:', tags.count + '개 ' + (tags.count >= 30 ? '✅' : '❌'));
  
  // 5. 저장 버튼 상태
  const saveBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) { if ((btn.innerText || '').trim() === '저장') { return '있음'; } }
    return '없음';
  });
  console.log('[5] 저장 버튼:', saveBtn);
  
  // 6. 토스트 메시지
  const toast = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
    return els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' | ') : '없음';
  });
  console.log('[6] 토스트 메시지:', toast);
  
  // === 최종 결론 ===
  console.log('\n=== 최종 분석 결론 ===');
  const ok = r.title && data.count > 2 && iframe.htmlLen > 0 && tags.count >= 30;
  console.log(ok ? '✅ 정상' : '❌ 비정상');
  if (!ok) {
    if (!r.title) console.log('   - 제목 없음');
    if (data.count <= 2) console.log('   - 컴포넌트 부족 (' + data.count + '개)');
    if (iframe.htmlLen <= 0) console.log('   - iframe 내용 없음');
    if (tags.count < 30) console.log('   - 해시태그 부족 (' + tags.count + '개)');
  }
  
  await b.close();
})();
