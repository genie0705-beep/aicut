const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;
const CONTENT = require('./blog_post_content.js');

const IMG_DIR = __dirname;
const IMAGES = [
  'aicut_blog_h2_thumb.png',
  'aicut_blog_h2_reels.png',
  'aicut_blog_h2_ai.png',
  'aicut_blog_h2_reasons.png',
  'aicut_blog_h2_cta.png'
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// HTML 헬퍼
function p(text) { return '<p style="text-align: center;">' + text + '</p>'; }
function br() { return '<p><br></p>'; }

(async () => {
  console.log('=== 블로그 작성 시작 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 1. 블로그 글쓰기 페이지 열기
  console.log('1. 블로그 글쓰기 페이지 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.nhn?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  console.log('   ✅ 페이지 로딩 완료:', page.url());
  
  // 2. 제목 설정
  console.log('\n2. 제목 설정...');
  let titleOk = false;
  
  // 먼저 SmartEditor API로 시도
  titleOk = await page.evaluate((title) => {
    try {
      if (typeof SmartEditor !== 'undefined' && SmartEditor._editors && SmartEditor._editors['blogpc001']) {
        SmartEditor._editors['blogpc001'].setDocumentTitle(title);
        return true;
      }
    } catch(e) {}
    return false;
  }, CONTENT.title);
  
  if (!titleOk) {
    // DOM으로 제목 입력 필드 찾기
    titleOk = await page.evaluate((title) => {
      const selectors = [
        '#post-title', '.se-title-input', 'input[placeholder*="제목"]',
        '.title_area input', 'textarea[placeholder*="제목"]', '[contenteditable].title'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = title;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            el.innerText = title;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
          return true;
        }
      }
      return false;
    }, CONTENT.title);
  }
  console.log('   제목:', titleOk ? '✅' : '❌');
  
  // 3. 본문 HTML 준비
  console.log('\n3. 본문 HTML 생성...');
  const bodyLines = CONTENT.body.split('\n');
  const htmlParts = [];
  for (const line of bodyLines) {
    if (line === '') {
      htmlParts.push(br());
    } else if (line.startsWith('#하반기')) {
      // 해시태그 블록
      htmlParts.push(p(line));
    } else if (line.includes('<strong>') || line.includes('<em>')) {
      htmlParts.push(p(line));
    } else {
      htmlParts.push(p(line));
    }
  }
  const fullHtml = htmlParts.join('\n');
  console.log('   HTML 길이:', fullHtml.length, '자');
  
  // 4. 클립보드에 HTML 쓰기
  console.log('\n4. 클립보드 쓰기 + 붙여넣기...');
  const clipOk = await page.evaluate((html) => {
    return new Promise((resolve) => {
      try {
        const blob = new Blob([html], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
          .then(() => resolve(true))
          .catch(() => resolve(false));
      } catch(e) { resolve(false); }
    });
  }, fullHtml);
  console.log('   클립보드:', clipOk ? '✅' : '❌');
  
  if (clipOk) {
    // 에디터 영역 클릭
    await page.evaluate(() => {
      // SmartEditor API로 에디터 포커스
      try {
        if (SmartEditor._editors && SmartEditor._editors['blogpc001']) {
          const ed = SmartEditor._editors['blogpc001'];
          if (ed.focus) ed.focus();
        }
      } catch(e) {}
      
      // contenteditable 찾아서 포커스
      const ce = document.querySelector('[contenteditable]');
      if (ce) {
        ce.focus();
        // 커서를 끝으로 이동
        const range = document.createRange();
        range.selectNodeContents(ce);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
    await sleep(1000);
    
    // Ctrl+V
    await page.keyboard.press('Control+v');
    await sleep(4000); // 충분히 대기 (큰 문서)
    
    // 본문 길이 확인
    let textLen = 0;
    try {
      textLen = await page.evaluate(() => {
        try {
          if (SmartEditor._editors && SmartEditor._editors['blogpc001']) {
            const text = SmartEditor._editors['blogpc001'].getContentText ? 
              SmartEditor._editors['blogpc001'].getContentText() : '';
            return text.length;
          }
        } catch(e) {}
        const ce = document.querySelector('[contenteditable]');
        return ce ? ce.innerText.length : 0;
      });
    } catch(e) {}
    console.log('   본문 길이:', textLen > 500 ? '✅ ' + textLen + '자' : '⚠️ ' + textLen + '자');
  }
  
  // 5. 이미지 등록
  console.log('\n5. 이미지 등록...');
  let imgSuccessCount = 0;
  
  for (let i = 0; i < IMAGES.length; i++) {
    const imgName = IMAGES[i];
    const imgPath = path.join(IMG_DIR, imgName);
    
    if (!fs.existsSync(imgPath)) {
      console.log(`   [${i+1}/${IMAGES.length}] ${imgName} - 파일 없음 ❌`);
      continue;
    }
    
    console.log(`   [${i+1}/${IMAGES.length}] ${imgName} 업로드 중...`);
    
    // 사진 버튼 클릭
    const btnResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const t = (btn.innerText || '').trim();
        if (t === '사진\n사진 추가' || t === '사진') {
          if (btn.offsetParent !== null) {
            btn.click();
            return 'clicked';
          }
        }
      }
      return 'not found';
    });
    console.log(`      버튼: ${btnResult}`);
    await sleep(2000);
    
    // filechooser 이벤트 대기
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      sleep(1000)
    ]);
    
    if (fileChooser) {
      await fileChooser.setFiles(imgPath);
      console.log(`      ✅ filechooser 업로드 성공`);
      imgSuccessCount++;
      await sleep(4000); // 업로드 + 썸네일 생성 대기
    } else {
      // 직접 input[type=file] 찾기
      const fi = await page.$('input[type="file"]');
      if (fi) {
        await fi.setInputFiles(imgPath);
        console.log(`      ✅ input[file] 직접 업로드 성공`);
        imgSuccessCount++;
        await sleep(4000);
      } else {
        console.log(`      ❌ 업로드 실패 - file input 없음`);
        await page.keyboard.press('Escape');
        await sleep(1000);
      }
    }
  }
  
  console.log(`   이미지 등록 결과: ${imgSuccessCount}/${IMAGES.length}`);
  
  // 6. 저장
  console.log('\n6. 저장...');
  let saved = false;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    saved = await page.evaluate(() => {
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
    
    if (saved) {
      console.log('   저장 버튼 클릭 완료');
      break;
    }
    await sleep(1000);
  }
  
  if (!saved) console.log('   저장 버튼 ❌');
  
  // 7. 결과 확인
  await sleep(3000);
  const toastText = await page.evaluate(() => {
    const selectors = [
      '[class*="toast"]', '[class*="Toast"]', '[role="alert"]',
      '[class*="message"]', '[class*="noti"]', '.se-toast',
      '#toast', '.toast', '.notify'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText) return el.innerText.trim().substring(0, 100);
    }
    return '알림 없음';
  });
  console.log('   저장 알림:', toastText);
  
  console.log('\n=== 최종 결과 ===');
  console.log(`   📝 제목: "${CONTENT.title}"`);
  console.log(`   📌 제목 등록: ${titleOk ? '✅' : '❌'}`);
  console.log(`   📄 본문 등록: ${clipOk ? '✅' : '❌'}`);
  console.log(`   🖼️ 이미지 등록: ${imgSuccessCount}/${IMAGES.length} ✅`);
  console.log(`   💾 저장: ${saved ? '✅' : '❌'}`);
  console.log(`   🔔 알림: ${toastText}`);
  
  await b.close();
  console.log('\n✅ 블로그 작성 완료!');
})();
