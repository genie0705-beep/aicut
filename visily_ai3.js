const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('visily.ai')) { page = pages[i]; break; }
  }
  if (!page) { console.log('no visily'); await b.close(); return; }

  await page.bringToFront();
  await new Promise(r => setTimeout(r, 2000));
  
  // Close popups
  for (let j = 0; j < 5; j++) {
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
  }

  // First, let's find the textarea AI input
  const textareas = await page.locator('textarea').all();
  console.log('Found ' + textareas.length + ' textareas');
  
  if (textareas.length > 0) {
    // Find the one with minimal text (the AI input)
    for (const ta of textareas) {
      const val = await ta.inputValue();
      if (val === '' || val === 'x') {
        // This is likely the AI prompt input
        await ta.click();
        await ta.fill('');
        await ta.type('담당자 관리 테이블에 아래 컬럼을 추가해줘: password_hash(VARCHAR), auth_level(VARCHAR), use_yn(CHAR). 기존 테이블 스타일과 동일하게 유지해줘.', { delay: 10 });
        console.log('Typed prompt into textarea');
        await new Promise(r => setTimeout(r, 1000));
        
        // Press Enter to submit
        await page.keyboard.press('Enter');
        console.log('Pressed Enter to submit');
        await new Promise(r => setTimeout(r, 4000));
        
        break;
      }
    }
  } else {
    // Click Generate with AI first
    await page.evaluate(() => {
      const els = document.querySelectorAll('span, div, button');
      for (const el of els) {
        if (el.innerText && el.innerText.trim() === 'Generate with AI' && el.offsetParent !== null) {
          el.click(); return;
        }
      }
    });
    await new Promise(r => setTimeout(r, 3000));
    
    // Try again to find textarea
    const ta2 = await page.locator('textarea').first();
    const count = await ta2.count();
    if (count > 0) {
      await ta2.click();
      await ta2.type('담당자 테이블에 password_hash, auth_level, use_yn 컬럼 추가해줘', { delay: 10 });
      await page.keyboard.press('Enter');
      console.log('Submitted via type+enter');
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  // Check result
  const txt = await page.evaluate(() => {
    const body = document.body.innerText;
    const lines = body.split('\n');
    return lines.filter(l => l.includes('password') || l.includes('auth_') || l.includes('use_yn') || l.includes('VARCHAR') || l.includes('CHAR(')).slice(0, 15);
  });
  console.log('\nResult:', txt.length > 0 ? txt.join(', ') : 'No matching text found');
  
  await page.screenshot({ path: 'visily_ai_final.png' });
  console.log('Screenshot saved');

  await b.close();
})().catch(e => console.log('ERR:', e.message));
