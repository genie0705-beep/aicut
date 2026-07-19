// SE4 에디터 자동 입력 — 부동산 블로그
const { chromium } = require('playwright');
const { TITLE, buildBodyHTML } = require('./_blog_realestate_content.js');

const CDP_PORT = process.env.CDP_PORT || '9224';
const BLOG_PC_URL = 'https://blog.naver.com/PostWrite.naver?blogNaverId=aicut&categoryNo=2&returnUrl=https%3A%2F%2Fblog.naver.com%2Faicut';

async function main() {
  console.log('🔗 Chrome CDP 연결:', CDP_PORT);
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  
  // 모든 기존 컨텍스트 중 새 탭 열기
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  console.log('📄 블로그 페이지 이동...');
  await page.goto(BLOG_PC_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 1. 제목 입력
  console.log('📝 제목 입력...');
  const titleResult = await page.evaluate((title) => {
    try {
      const editor = SmartEditor._editors['blogpc001'];
      if (editor && editor.setDocumentTitle) {
        editor.setDocumentTitle(title);
        return '✅ SmartEditor API로 제목 설정 완료';
      }
      return '❌ SmartEditor._editors["blogpc001"] 없음';
    } catch (e) {
      return '❌ 제목 설정 실패: ' + e.message;
    }
  }, TITLE);
  console.log(titleResult);
  
  // 2. 본문 내용 생성
  const bodyHTML = buildBodyHTML();
  
  // 3. 클립보드에 HTML 복사 (Node.js 방식)
  // Playwright의 evaluate로 복사
  console.log('📋 클립보드에 HTML 복사...');
  await page.evaluate((html) => {
    function clipboardCopy(htmlContent) {
      return new Promise((resolve, reject) => {
        // 클립보드 API 사용
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        navigator.clipboard.write([clipboardItem])
          .then(resolve)
          .catch(() => {
            // fallback: text/plain도 함께
            const textPlain = htmlContent.replace(/<[^>]+>/g, ' ');
            const blobHTML = new Blob([htmlContent], { type: 'text/html' });
            const blobText = new Blob([textPlain], { type: 'text/plain' });
            navigator.clipboard.write([
              new ClipboardItem({
                'text/html': blobHTML,
                'text/plain': blobText
              })
            ]).then(resolve).catch(reject);
          });
      });
    }
    return clipboardCopy(html);
  }, bodyHTML);
  console.log('✅ 클립보드 복사 완료');
  
  await page.waitForTimeout(500);
  
  // 4. 에디터 영역 클릭 후 Ctrl+V
  console.log('⌨️ Ctrl+V 붙여넣기...');
  
  // 에디터 본문 영역 찾기
  const editorFrame = await page.$('iframe.se2_inputarea, iframe[name="content"]');
  if (editorFrame) {
    console.log('  iframe 감지됨 → iframe 내부에 붙여넣기');
    const frame = await editorFrame.contentFrame();
    if (frame) {
      // iframe body 클릭
      await frame.click('body');
      await page.waitForTimeout(300);
      await page.keyboard.press('Control+V');
    } else {
      console.log('  iframe contentFrame 없음, 직접 붙여넣기 시도');
      await editorFrame.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Control+V');
    }
  } else {
    // SmartEditor SE4 본문 영역 직접 찾기
    console.log('  iframe 없음, 에디터 영역 찾기...');
    
    // 다양한 셀렉터 시도
    const selectors = [
      'div[contenteditable="true"]',
      '.se2_content_container',
      '.smart_editor_body',
      '.se_composer_wrap',
      '.editor_area',
      '#smart_editor2_body'
    ];
    
    let clicked = false;
    for (const sel of selectors) {
      const el = await page.$(sel);
      if (el) {
        console.log('  에디터 찾음:', sel);
        await el.click();
        await page.waitForTimeout(300);
        await page.keyboard.press('Control+V');
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      // body에 직접 붙여넣기
      console.log('  에디터 영역 미발견, body에 붙여넣기 시도');
      await page.click('body');
      await page.waitForTimeout(300);
      await page.keyboard.press('Control+V');
    }
  }
  
  console.log('⌨️ Ctrl+V 완료, 5초 대기...');
  await page.waitForTimeout(5000);
  
  // 5. 저장 버튼 클릭 (임시저장)
  console.log('💾 임시저장 시도...');
  
  const saveResult = await page.evaluate(() => {
    // 다양한 저장 버튼 셀렉터
    const selectors = [
      'a[id="saveButton"]',
      'a._saveButton',
      'a.se2_save',
      'button:has-text("저장")',
      'a:has-text("저장")',
      'span:has-text("저장")'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        el.click();
        return '✅ 저장 버튼 클릭됨: ' + sel;
      }
    }
    
    // SmartEditor API로 저장
    try {
      if (SmartEditor && SmartEditor.save) {
        SmartEditor.save();
        return '✅ SmartEditor.save() 실행';
      }
    } catch (e) {}
    
    return '❌ 저장 버튼을 찾을 수 없음';
  });
  console.log(saveResult);
  
  await page.waitForTimeout(3000);
  
  console.log('\n✅ 작업 완료! 페이지를 확인해주세요.');
  console.log('🔗', BLOG_PC_URL);
  
  // 연결만 종료 (브라우저 유지)
  await b.disconnect();
}

main().catch(e => {
  console.error('❌ 오류:', e.message);
  process.exit(1);
});
