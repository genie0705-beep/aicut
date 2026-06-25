const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점';
const BODY_FILE = 'C:/Users/paul/.openclaw/workspace/blog_draft_20260616.md';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('Redirect=Write') || pg.url().includes('PostWriteForm')) {
      page = pg;
      break;
    }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(2000);

  // === Step 1: input_buffer frame 찾기 (contenteditable body) ===
  var inputBuffer = null;
  for (const f of page.frames()) {
    try {
      var bodyCE = await f.evaluate(function() {
        var b = document.body;
        return b && b.isContentEditable ? b.getAttribute('contenteditable') : null;
      }).catch(function() { return null; });
      
      if (bodyCE) {
        inputBuffer = f;
        console.log('✅ input_buffer frame (contenteditable body)');
        break;
      }
    } catch(e) {}
  }

  if (!inputBuffer) {
    console.log('❌ input_buffer not found');
    await b.close();
    return;
  }

  // === Step 2: 제목 입력 ===
  console.log('✏️ 제목 입력...');
  
  // Try typing directly into the input buffer
  var titleDone = await inputBuffer.evaluate(function(title) {
    try {
      // Navigate to title area: press Tab or find title element
      var allCE = document.querySelectorAll('[contenteditable]');
      // Find the input_buffer iframe's document
      var body = document.body;
      body.focus();
      
      // Clear and insert title as first line with special format
      // Naver uses React, but the input_buffer receives raw input
      body.innerHTML = '';
      
      // Insert title as heading
      body.innerHTML = '<p><strong>' + title + '</strong></p><p><br></p>';
      
      // Dispatch input event
      body.dispatchEvent(new Event('input', { bubbles: true }));
      
      return 'title_set';
    } catch(e) {
      return 'error: ' + e.message.substring(0, 50);
    }
  }, TITLE);
  console.log('  ' + titleDone);

  await sleep(1000);

  // === Step 3: 본문 HTML 준비 ===
  console.log('📝 본문 입력...');
  
  // Read the markdown file and convert to simple HTML
  var mdContent = fs.readFileSync(BODY_FILE, 'utf8');
  // Extract body after the title line
  var lines = mdContent.split('\n');
  var bodyLines = [];
  var inBody = false;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.startsWith('# ') && !inBody) {
      inBody = true;
      continue; // skip the main title
    }
    if (line.startsWith('---') || line.startsWith('**태그:**') || line.startsWith('## 체크리스트')) {
      break;
    }
    bodyLines.push(line);
  }
  
  var bodyHTML = bodyLines.join('\n')
    .replace(/^## (.+)/gm, '<h2>$1</h2>')
    .replace(/^### (.+)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^> (.+)/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\[이미지[^\]]*\]/g, '')
    .trim();
  
  bodyHTML = '<p>' + bodyHTML + '</p>';
  
  var bodyResult = await inputBuffer.evaluate(function(html) {
    try {
      var body = document.body;
      body.innerHTML = html;
      body.dispatchEvent(new Event('input', { bubbles: true }));
      return 'body_set_' + html.length + 'chars';
    } catch(e) {
      return 'error: ' + e.message.substring(0, 50);
    }
  }, bodyHTML);
  console.log('  ' + bodyResult);

  await sleep(2000);

  // === Step 4: mainFrame에서 저장 버튼 찾기 ===
  console.log('💾 저장 시도...');
  
  // Find mainFrame
  var mainFrame = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mainFrame = f; break; }
  }
  
  if (mainFrame) {
    var saveResult = await mainFrame.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if (t === '저장' && btns[i].offsetParent !== null) {
          btns[i].click();
          return '저장_클릭';
        }
      }
      return '저장_없음';
    });
    console.log('  ' + saveResult);
  } else {
    console.log('  mainFrame 없음');
  }

  await sleep(3000);
  
  console.log('\n✅ 작업 완료!');
  console.log('📋 정이사님, 현재 블로그 탭 확인 후 검토 부탁드립니다.');
  console.log('   발행 전 내용 확인하시고 발행 버튼 눌러주세요.');
  
  await b.close();
})();
