const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;
const CONTENT = require('./blog_post_content.js');

const IMG_DIR = __dirname;
const IMAGES = [
  'aicut_blog_h2_thumb.png',    // 1: 대표 이미지 (본문 시작 후)
  'aicut_blog_h2_reels.png',    // 2: 릴스 알고리즘 섹션
  'aicut_blog_h2_ai.png',       // 3: AI vs 전문가 섹션
  'aicut_blog_h2_reasons.png',  // 4: 3가지 이유 섹션
  'aicut_blog_h2_cta.png'       // 5: CTA 섹션
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('=== 블로그 작성 시작 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  
  // 1. 새 탭에서 블로그 글쓰기 페이지 열기
  console.log('1. 블로그 글쓰기 페이지 열기...');
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/aicut/PostWriteForm.nhn', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  console.log('   URL:', page.url());
  
  // SE 에디터 프레임 찾기
  let mf = null, ef = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') mf = f;
    if (f.url().includes('PostWriteForm') && !f.name().startsWith('input')) ef = f;
  }
  if (!mf) { console.log('   mainFrame 없음, 전체 프레임 탐색...'); }
  if (!ef) { console.log('   에디터 프레임 없음'); }
  
  console.log('   mainFrame:', !!mf, 'editorFrame:', !!ef);
  
  if (!ef) {
    // SmartEditor 4.x+ or SE One 찾기
    for (const f of page.frames()) {
      try {
        const hasEditor = await f.evaluate(() => {
          return typeof SmartEditor !== 'undefined' || 
                 document.querySelector('[contenteditable]') !== null ||
                 document.querySelector('.se-editor') !== null;
        }).catch(() => false);
        if (hasEditor) { ef = f; console.log('   에디터 프레임 발견:', f.url().substring(0, 80)); break; }
      } catch(e) {}
    }
  }

  // 2. 제목 설정
  console.log('\n2. 제목 설정...');
  let titleOk = false;
  if (ef) {
    try {
      titleOk = await ef.evaluate((title) => {
        // SmartEditor API
        if (typeof SmartEditor !== 'undefined') {
          const editors = Object.keys(SmartEditor._editors || {});
          if (editors.length > 0) {
            SmartEditor._editors[editors[0]].setDocumentTitle(title);
            return true;
          }
        }
        // DOM 접근
        const input = document.querySelector('#post-title, [name=title], .se-title-input, input[placeholder*=\"제목\"]');
        if (input) { input.value = title; input.dispatchEvent(new Event('input', {bubbles: true})); return true; }
        return false;
      }, CONTENT.title);
    } catch(e) { console.log('   API 오류:', e.message); }
  }
  
  if (!titleOk) {
    // mainFrame에서 찾기
    try {
      titleOk = await mf.evaluate((title) => {
        const input = document.querySelector('#post-title, [name=title], .se-title-input, input[placeholder*=\"제목\"]');
        if (input) { input.value = title; input.dispatchEvent(new Event('input', {bubbles: true})); return true; }
        return false;
      }, CONTENT.title);
    } catch(e) {}
  }
  console.log('   제목:', titleOk ? '✅' : '❌');
  
  // 3. 본문 입력 (clipboard + Ctrl+V)
  console.log('\n3. 본문 입력...');
  
  // HTML 형식으로 변환
  const bodyLines = CONTENT.body.split('\n');
  const htmlParts = [];
  for (const line of bodyLines) {
    if (line.startsWith('#')) {
      // 해시태그는 그냥 텍스트로
      htmlParts.push(`<p style="text-align: center;">${line}</p>`);
    } else if (line.startsWith('<strong>') || line.startsWith('<em>')) {
      htmlParts.push(`<p style="text-align: center;">${line}</p>`);
    } else if (line === '') {
      htmlParts.push('<p><br></p>');
    } else {
      htmlParts.push(`<p style="text-align: center;">${line}</p>`);
    }
  }
  const fullHtml = htmlParts.join('\n');
  
  // 클립보드에 HTML 쓰기
  const clipOk = await page.evaluate((html) => {
    return new Promise((resolve) => {
      const blob = new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }, fullHtml);
  console.log('   클립보드:', clipOk ? '✅' : '❌');
  
  if (clipOk) {
    // 에디터 영역 클릭 후 붙여넣기
    if (ef) {
      try {
        await ef.evaluate(() => {
          const ce = document.querySelector('[contenteditable]');
          if (ce) ce.focus();
        });
        await sleep(1000);
      } catch(e) {}
    }
    await page.mouse.click(500, 400);
    await sleep(1000);
    await page.keyboard.press('Control+v');
    await sleep(3000);
    
    // 본문 길이 확인
    let textLen = 0;
    if (ef) {
      try {
        textLen = await ef.evaluate(() => {
          const ed = SmartEditor && SmartEditor._editors;
          if (ed) {
            const key = Object.keys(ed)[0];
            return (ed[key].getContentText ? ed[key].getContentText() : '').length;
          }
          const ce = document.querySelector('[contenteditable]');
          return ce ? ce.innerText.length : 0;
        });
      } catch(e) {}
    }
    console.log('   본문 길이:', textLen > 100 ? '✅ ' + textLen + '자' : '⚠️ ' + textLen + '자');
  }
  
  // 4. 이미지 등록
  console.log('\n4. 이미지 등록...');
  let imgSuccessCount = 0;
  
  for (let i = 0; i < IMAGES.length; i++) {
    const imgName = IMAGES[i];
    const imgPath = path.join(IMG_DIR, imgName);
    
    if (!fs.existsSync(imgPath)) {
      console.log(`   [${i+1}/${IMAGES.length}] ${imgName} - 파일 없음 ❌`);
      continue;
    }
    
    console.log(`   [${i+1}/${IMAGES.length}] ${imgName} 등록 중...`);
    
    // 사진 버튼 찾아서 클릭
    const btnClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, span, div');
      for (const btn of buttons) {
        const t = (btn.innerText || '').trim();
        // '사진', '사진 추가', '이미지' 버튼 찾기
        if (t === '사진' || t === '사진 추가' || t === '이미지') {
          if (btn.offsetParent !== null) { // visible
            btn.click();
            return 'clicked:' + t;
          }
        }
      }
      // 아이콘 버튼: role=button, aria-label
      for (const btn of document.querySelectorAll('[aria-label*="사진"], [aria-label*="이미지"], [class*="photo"], [class*="image"]')) {
        if (btn.offsetParent !== null) {
          btn.click();
          return 'clicked:aria';
        }
      }
      return 'no-button';
    });
    console.log(`      사진 버튼: ${btnClicked}`);
    await sleep(2000);
    
    // filechooser 대기
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      Promise.resolve() // timeout if filechooser already showing
    ]);
    
    if (fileChooser) {
      await fileChooser.setFiles(imgPath);
      console.log(`      ✅ 파일 업로드 성공`);
      imgSuccessCount++;
      await sleep(3000); // 업로드 대기
    } else {
      // 파일 input 직접 찾기
      const fi = await page.$('input[type="file"]');
      if (fi) {
        await fi.setInputFiles(imgPath);
        console.log(`      ✅ input[file] 직접 업로드 성공`);
        imgSuccessCount++;
        await sleep(3000);
      } else {
        console.log(`      ❌ filechooser/input 없음`);
        // ESC로 닫기
        await page.keyboard.press('Escape');
        await sleep(1000);
      }
    }
  }
  
  console.log(`   이미지 등록 완료: ${imgSuccessCount}/${IMAGES.length}`);
  
  // 5. 저장 버튼 찾아서 클릭
  console.log('\n5. 저장...');
  const saved = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const t = (btn.innerText || '').trim();
      if (t === '저장' && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  console.log('   저장:', saved ? '✅' : '❌');
  await sleep(3000);
  
  // 토스트 메시지 확인
  const toastText = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"], [class*="message"], [class*="alert"], [role="alert"]');
    const texts = Array.from(els).map(el => el.innerText).join(', ');
    return texts.substring(0, 200) || '토스트 없음';
  });
  console.log('   토스트:', toastText);
  
  // 6. 결과 확인
  console.log('\n=== 결과 요약 ===');
  console.log(`   제목: "${CONTENT.title}"`);
  console.log(`   제목 등록: ${titleOk ? '✅' : '❌'}`);
  console.log(`   본문 입력: ${clipOk ? '✅' : '❌'}`);
  console.log(`   이미지 등록: ${imgSuccessCount}/${IMAGES.length}`);
  console.log(`   저장: ${saved ? '✅' : '❌'}`);
  console.log(`   토스트: ${toastText}`);
  
  await b.close();
  console.log('\n완료!');
})();
