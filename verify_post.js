const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  
  console.log('=== 저장된 포스팅 확인 ===\n');
  
  // 에디터 열기
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 복구 팝업 처리
  const recovery = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t.includes('이어서') || t.includes('취소')) {
        btn.click();
        return t.substring(0, 20);
      }
    }
    return '팝업 없음';
  });
  console.log('복구:', recovery);
  await page.waitForTimeout(3000);
  
  // SmartEditor 데이터 확인
  const data = await page.evaluate(() => {
    const r = {};
    try {
      const ed = SmartEditor._editors['blogpc001'];
      r.title = ed.getDocumentTitle();
      
      const doc = ed.getDocumentData();
      r.docType = typeof doc;
      if (doc && doc.document) {
        r.components = doc.document.components ? doc.document.components.length : 0;
        r.componentTypes = doc.document.components ? doc.document.components.map(c => c.type).join(', ') : 'none';
        
        // 텍스트 내용 샘플
        const textComp = doc.document.components.find(c => c.type === 'text' || c.type === 'paragraph');
        if (textComp && textComp.textMap) {
          r.textPreview = JSON.stringify(textComp.textMap).substring(0, 200);
        }
      } else {
        r.rawPreview = JSON.stringify(doc).substring(0, 200);
      }
    } catch (e) {
      r.error = e.message;
    }
    return r;
  });
  
  console.log('=== 포스팅 데이터 ===');
  console.log('제목:', data.title);
  console.log('컴포넌트:', data.components + '개');
  console.log('타입:', data.componentTypes);
  if (data.textPreview) console.log('텍스트 샘플:', data.textPreview);
  if (data.error) console.log('에러:', data.error);
  
  // 화면 스크린샷
  await page.screenshot({ path: path.join(W, 'blog_verify_status.png') });
  
  // 타이틀이 정상인 경우 확인 완료
  if (data.title && data.title.includes('IR 피칭')) {
    console.log('\n✅ 제목 정상');
  }
  if (data.components > 1) {
    console.log('✅ 내용 정상 (컴포넌트 ' + data.components + '개)');
  }
  
  console.log('\n=== 확인 완료 ===');
  
  await b.close();
})();
