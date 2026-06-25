const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;
const CONTENT = require('./blog_post_content.js');
const IMG_DIR = __dirname;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function p(text) { return '<p style="text-align: center;">' + text + '</p>'; }
function br() { return '<p><br></p>'; }

(async () => {
  console.log('=== 블로그 작성 시도 #2 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 1. 에디터 열기
  console.log('1. 에디터 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.nhn?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  
  // 2. 제목
  console.log('2. 제목 설정...');
  const titleOk = await page.evaluate((title) => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle(title);
      return true;
    } catch(e) { return false; }
  }, CONTENT.title);
  console.log('   제목:', titleOk ? '✅' : '❌');
  
  // 3. 본문 HTML
  const bodyLines = CONTENT.body.split('\n');
  const htmlParts = [];
  for (const line of bodyLines) {
    if (line === '') htmlParts.push(br());
    else if (line.startsWith('#하반기')) htmlParts.push(p(line));
    else htmlParts.push(p(line));
  }
  const fullHtml = htmlParts.join('\n');
  
  // 4. 클립보드 + 붙여넣기
  console.log('3. 본문 붙여넣기...');
  const clipOk = await page.evaluate((html) => {
    return new Promise((resolve) => {
      try {
        const blob = new Blob([html], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => resolve(true));
      } catch(e) { resolve(false); }
    });
  }, fullHtml);
  
  if (clipOk) {
    await page.evaluate(() => {
      try { SmartEditor._editors['blogpc001'].focus(); } catch(e) {}
      const ce = document.querySelector('[contenteditable]');
      if (ce) { ce.focus(); const r = document.createRange(); r.selectNodeContents(ce); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    });
    await sleep(1000);
    await page.keyboard.press('Control+v');
    await sleep(5000);
    
    const len = await page.evaluate(() => {
      try { return SmartEditor._editors['blogpc001'].getContentText().length; } catch(e) { return 0; }
    });
    console.log('   본문:', len > 500 ? '✅ ' + len + '자' : '⚠️ ' + len + '자');
  }
  
  // 5. 이미지 업로드 시도 (clipboard 방식)
  console.log('4. 이미지 업로드 시도...');
  let imgOk = 0;
  
  for (let i = 0; i < 1; i++) { // 첫 1장만 테스트
    const imgName = 'aicut_blog_h2_thumb.png';
    const imgPath = path.join(IMG_DIR, imgName);
    const imgBuf = fs.readFileSync(imgPath);
    const b64 = imgBuf.toString('base64');
    
    // 방법1: clipboard에 이미지 쓰고 Ctrl+V
    const imgClipOk = await page.evaluate((b64img) => {
      return new Promise((resolve) => {
        try {
          const binary = atob(b64img);
          const arr = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
          const blob = new Blob([arr], { type: 'image/png' });
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => resolve(true));
        } catch(e) { resolve(false); }
      });
    }, b64);
    
    if (imgClipOk) {
      console.log(`   [${i+1}] clipboard 이미지 쓰기 ✅`);
      await page.keyboard.press('Control+v');
      await sleep(3000);
      
      // 이미지가 삽입되었는지 확인
      const hasImg = await page.evaluate(() => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          const data = ed.getDocumentData ? ed.getDocumentData() : null;
          if (data && data.document) {
            const hasImage = data.document.components.some(c => c['@ctype'] === 'image');
            return hasImage ? '이미지 컴포넌트 있음' : '이미지 컴포넌트 없음';
          }
          return 'getDocumentData 없음';
        } catch(e) { return '에러: ' + e.message; }
      });
      console.log(`      결과: ${hasImg}`);
      if (hasImg.includes('있음')) imgOk++;
    } else {
      console.log(`   [${i+1}] clipboard 이미지 쓰기 ❌`);
    }
  }
  
  // 6. 저장
  console.log('5. 저장...');
  let saved = false;
  for (let a = 0; a < 3; a++) {
    saved = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) {
          btn.click(); return true;
        }
      }
      return false;
    });
    if (saved) break;
    await sleep(1000);
  }
  console.log('   저장:', saved ? '✅' : '❌');
  await sleep(3000);
  
  // 7. 최종 확인
  const finalCheck = await page.evaluate(() => {
    const toasts = Array.from(document.querySelectorAll('[class*=toast], [class*=Toast], [role=alert]'));
    const toastText = toasts.map(e => e.innerText.substring(0, 50)).join(' | ');
    return { 
      toast: toastText,
      title: document.querySelector('#post-title')?.value || '',
      contentLen: document.querySelector('[contenteditable]')?.innerText?.length || 0
    };
  });
  console.log('   최종:', JSON.stringify(finalCheck));
  
  console.log('\n=== 최종 결과 ===');
  console.log(`   📝 제목: ${titleOk ? '✅' : '❌'}`);
  console.log(`   📄 본문: ${clipOk ? '✅' : '❌'}`);
  console.log(`   🖼️ 이미지: ${imgOk}/1 ✅ (clipboard 방식)`);
  console.log(`   💾 저장: ${saved ? '✅' : '❌'}`);
  
  await b.close();
})();
