// 최종: 문서 상태 확인 + 저장 처리
const { chromium } = require('playwright');

const LOG_NO = '224341544476';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postupdate') && p.url().includes(LOG_NO)) {
      page = p;
      break;
    }
  }

  if (!page) {
    console.log('❌ Editor page not found');
    await b.close();
    return;
  }

  console.log('✅ Editor page found:', page.url());

  // Check document for images
  console.log('\n[1] 문서 이미지 확인...');
  const docState = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

      // Count images
      const imgMatches = dataStr.match(/se-component[^>]*se-image/g);

      // Find all image positions relative to text
      const sections = dataStr.match(/<div class="se-component[^>]*>.*?<\/div>\s*<\/div>\s*<\/div>/gs) || [];

      const imageSections = [];
      sections.forEach((s, idx) => {
        if (s.includes('se-image')) {
          const altMatch = s.match(/alt="([^"]*)"/);
          imageSections.push({ idx, alt: altMatch ? altMatch[1] : '' });
        }
      });

      return {
        totalImages: imgMatches ? imgMatches.length : 0,
        dataLen: dataStr.length,
        imageSections
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`  ${JSON.stringify(docState, null, 2)}`);

  if (docState.totalImages === 0) {
    console.log('  ⚠️ 이미지가 0장입니다. 업로드가 실제로 반영되지 않았을 수 있습니다.');
    console.log('  파일 업로드가 완료되려면 시간이 필요합니다. 기다려보겠습니다...');
    await page.waitForTimeout(5000);

    // Check again
    const docState2 = await page.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        const data = ed.getDocumentData();
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        const imgMatches = dataStr.match(/se-component[^>]*se-image/g);
        return { totalImages: imgMatches ? imgMatches.length : 0, dataLen: dataStr.length };
      } catch(e) {
        return { error: e.message };
      }
    });
    console.log(`  재확인: ${JSON.stringify(docState2)}`);
  }

  // Handle save/publish
  // In SE4 editor for existing post, the main button is "발행" not "저장"
  // But we need to check if there's a confirmation dialog

  console.log('\n[2] 저장 처리...');

  // Listen for dialogs
  page.on('dialog', async dialog => {
    console.log(`  다이얼로그: ${dialog.type()} - ${dialog.message().substring(0, 100)}`);
    // Accept any confirmations
    if (dialog.type() === 'beforeunload') {
      await dialog.dismiss();
    } else {
      await dialog.accept();
    }
  });

  // Method 1: Try clicking "발행" button directly
  console.log('  "발행" 버튼 클릭...');
  const publishResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
        // Get real coordinates
        const rect = btn.getBoundingClientRect();
        btn.click();
        return { clicked: true, text: '발행', x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      }
    }
    return { clicked: false };
  });
  console.log(`  ${JSON.stringify(publishResult)}`);

  // Wait to see if dialog or navigation occurs
  await page.waitForTimeout(5000);
  console.log('  저장 후 URL:', page.url());

  // Check final state
  console.log('\n[3] 최종 상태 확인...');
  const finalState = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      const imgMatches = dataStr.match(/se-component[^>]*se-image/g);
      return { totalImages: imgMatches ? imgMatches.length : 0, dataLen: dataStr.length };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`  ${JSON.stringify(finalState)}`);

  // If still on editor page, try saving again via API
  if (page.url().includes('postupdate')) {
    console.log('\n  아직 에디터 페이지입니다. 다른 저장 방법 시도...');

    // Try using keyboard shortcut Ctrl+S
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(3000);
    console.log('  Ctrl+S 후 URL:', page.url());

    // Try clicking 발행 button at specific coordinates using Playwright click
    const publishBtn = await page.$('button.publish_btn__m9KHH');
    if (publishBtn) {
      await publishBtn.click();
      await page.waitForTimeout(3000);
      console.log('  publish_btn 클릭 후 URL:', page.url());
    } else {
      console.log('  publish_btn not found by class');
    }
  }

  console.log('\n=== 📋 최종 결과 ===');
  console.log('URL:', page.url());
  console.log('제목:', await page.title().catch(() => 'N/A'));
  console.log('이미지:', finalState.totalImages);

  await b.close();
})().catch(e => console.log('E:', e.message));
