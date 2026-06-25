const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CONTENT = require('./blog_post_content.js');

const CDP_PORT = 9224;
const IMG_DIR = __dirname;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function br() { return '<p><br></p>'; }

(async () => {
  console.log('=== 블로그 본문 작성 ===\n');
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const pages = b.contexts()[0].pages();
  
  // Find existing blog editor tab
  let target = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm.nhn')) { target = p; break; }
  }
  
  if (!target) {
    console.log('❌ 블로그 에디터 탭을 찾을 수 없습니다');
    console.log('Open tabs:');
    for (const p of pages) {
      console.log(' -', p.url().substring(0, 100));
    }
    await b.close();
    return;
  }
  
  console.log('📋 기존 블로그 에디터 탭 발견');
  console.log('   URL:', target.url().substring(0, 100));
  
  // Handle dialogs
  target.on('dialog', async d => { await d.dismiss(); });
  
  await target.bringToFront();
  await sleep(2000);
  
  // 1. Check current state
  const state0 = await target.evaluate(() => {
    try {
      const ed = window.SmartEditor?._editors?.['blogpc001'];
      if (!ed) return { error: 'SmartEditor not available' };
      return {
        title: ed.getDocumentTitle?.() || '',
        contentLen: ed.getContentText?.()?.length || 0
      };
    } catch(e) { return { error: e.message }; }
  });
  console.log('\n1. 현재 상태:', JSON.stringify(state0));
  
  // 2. Clear existing content first by focusing and select all+delete
  console.log('\n2. 기존 내용 초기화...');
  await target.evaluate(() => {
    try {
      const ce = document.querySelector('[contenteditable]');
      if (ce) { ce.focus(); ce.innerHTML = ''; }
    } catch(e) {}
  });
  await sleep(1000);
  
  // 3. Build HTML from content
  console.log('\n3. HTML 본문 생성...');
  const bodyLines = CONTENT.body.split('\n');
  const htmlParts = [];
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      htmlParts.push('<p style="text-align: center;"><br></p>');
    } else if (trimmed.startsWith('#하반기')) {
      htmlParts.push(`<h2 style="text-align: center;">${trimmed.replace('#하반기', '')}</h2>`);
    } else {
      htmlParts.push(`<p style="text-align: center;">${trimmed}</p>`);
    }
  }
  
  // Add hashtags
  htmlParts.push('<p style="text-align: center;"><br></p>');
  htmlParts.push('<p style="text-align: center; color: #888888; font-size: 12px;">' + CONTENT.hashtags + '</p>');
  
  const fullHtml = htmlParts.join('\n');
  console.log('   HTML 길이:', fullHtml.length, '자');
  
  // 4. Set title (if different)
  console.log('\n4. 제목 설정...');
  const titleOk = await target.evaluate((title) => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle(title);
      return true;
    } catch(e) { return false; }
  }, CONTENT.title);
  console.log('   결과:', titleOk ? '✅' : '❌ (현재 제목 유지)');
  
  // 5. Clipboard paste
  console.log('\n5. 본문 붙여넣기 (Clipboard)...');
  const clipOk = await target.evaluate((html) => {
    return new Promise((resolve) => {
      try {
        const blob = new Blob([html], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => resolve(true));
      } catch(e) { resolve(false); }
    });
  }, fullHtml);
  console.log('   클립보드 쓰기:', clipOk ? '✅' : '❌');
  
  if (clipOk) {
    await target.evaluate(() => {
      try { SmartEditor._editors['blogpc001'].focus(); } catch(e) {}
      const ce = document.querySelector('[contenteditable]');
      if (ce) {
        ce.focus();
        const r = document.createRange();
        r.selectNodeContents(ce);
        r.collapse(false);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }
    });
    await sleep(500);
    await target.keyboard.press('Control+v');
    await sleep(5000);
    
    const len = await target.evaluate(() => {
      try { return SmartEditor._editors['blogpc001'].getContentText().length; } catch(e) { return 0; }
    });
    console.log('   본문 길이:', len, '자');
    console.log('   결과:', len > 500 ? '✅' : '⚠️ ' + len + '자 (너무 짧음)');
  }
  
  // 6. Image upload via clipboard
  console.log('\n6. 이미지 업로드...');
  const imageFiles = [
    { name: 'aicut_blog_5questions.png', desc: '대표 이미지' },
    { name: 'aicut_blog_5questions_content.png', desc: '내용 이미지' }
  ];
  
  let imgSuccess = 0;
  for (const img of imageFiles) {
    const imgPath = path.join(IMG_DIR, img.name);
    if (!fs.existsSync(imgPath)) {
      console.log(`   ⏭️ ${img.desc}: 파일 없음 (${img.name})`);
      continue;
    }
    
    const imgBuf = fs.readFileSync(imgPath);
    const b64 = imgBuf.toString('base64');
    
    const clipImgOk = await target.evaluate((b64img) => {
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
    
    if (clipImgOk) {
      console.log(`   📸 ${img.desc}: 클립보드 쓰기 ✅`);
      
      // Insert at cursor position (after first paragraph)
      await target.evaluate(() => {
        const ce = document.querySelector('[contenteditable]');
        if (ce) {
          const firstP = ce.querySelector('p');
          if (firstP) {
            const r = document.createRange();
            r.setStartAfter(firstP);
            r.collapse(true);
            const s = window.getSelection();
            s.removeAllRanges();
            s.addRange(r);
          }
        }
      });
      await sleep(500);
      await target.keyboard.press('Control+v');
      await sleep(4000);
      
      const hasImg = await target.evaluate(() => {
        try {
          const ce = document.querySelector('[contenteditable]');
          return ce ? ce.querySelectorAll('img').length : 0;
        } catch(e) { return -1; }
      });
      console.log(`      에디터 내 이미지 수: ${hasImg}`);
      if (hasImg > 0) imgSuccess++;
    } else {
      console.log(`   ❌ ${img.desc}: 클립보드 쓰기 실패`);
    }
  }
  
  // 7. Save
  console.log('\n7. 저장...');
  let saved = false;
  for (let a = 0; a < 5; a++) {
    saved = await target.evaluate(() => {
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
  console.log('   저장 버튼 클릭:', saved ? '✅' : '❌');
  await sleep(3000);
  
  // 8. Final check
  console.log('\n8. 최종 확인...');
  const final = await target.evaluate(() => {
    const toasts = Array.from(document.querySelectorAll('[class*=toast], [class*=Toast], [role=alert]'));
    const toastText = toasts.map(e => (e.innerText || '').substring(0, 80)).join(' | ');
    try {
      const ed = SmartEditor._editors['blogpc001'];
      return {
        toast: toastText,
        title: ed.getDocumentTitle?.() || '',
        contentLen: ed.getContentText?.()?.length || 0
      };
    } catch(e) {
      return { toast: toastText, title: '', contentLen: 0 };
    }
  });
  console.log('   결과:', JSON.stringify(final, null, 2));
  
  console.log('\n====== 최종 결과 ======');
  console.log(`   📝 제목: "${CONTENT.title}"`);
  console.log(`   📄 본문: ${state0?.contentLen || 0}자 → ${final.contentLen}자`);
  console.log(`   🖼️  이미지: ${imgSuccess}/${imageFiles.length} 업로드 ✅`);
  console.log(`   💾 저장: ${saved ? '✅' : '❌'}`);
  console.log(`   🔔 토스트: ${final.toast || '없음'}`);
  
  await b.close();
  console.log('\n✅ 완료');
})();
