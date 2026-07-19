// 블로그 SE4 에디터 자동화
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    
    // 새 페이지 열기
    const page = await context.newPage();
    
    // 네이버 블로그 새 글 작성 페이지로 이동
    await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    console.log('Current URL:', page.url());
    
    // Check if we're on a login page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Check for login elements
    const isLoginPage = await page.evaluate(() => {
      return document.querySelector('input[type="password"], [name="pw"], [name="password"], .id_input, .input_id') !== null;
    });
    console.log('Is login page:', isLoginPage);
    
    if (isLoginPage) {
      console.log('LOGIN REQUIRED - 정이사님, 네이버 로그인이 필요합니다.');
      // Take a screenshot to show the current state
      await page.screenshot({ path: 'blog_login_state.png', fullPage: false });
      console.log('Screenshot saved: blog_login_state.png');
    } else {
      // Try to find and click the "글쓰기" button
      const writeBtn = await page.$('a, button, [role="button"], span').catch(() => null);
      const buttons = await page.evaluate(() => {
        const btns = document.querySelectorAll('a, button, [role="button"], span');
        return Array.from(btns)
          .filter(b => b.innerText.includes('글쓰기') || b.innerText.includes('작성'))
          .map(b => ({ tag: b.tagName, text: b.innerText.slice(0, 30), class: b.className.slice(0, 50) }));
      });
      console.log('Buttons with 글쓰기:', JSON.stringify(buttons));
      
      const se4Btn = await page.evaluate(() => {
        const btns = document.querySelectorAll('a, button, [role="button"]');
        for (const b of btns) {
          if (b.innerText.includes('글쓰기') || b.innerText.includes('스마트에디터')) {
            b.click();
            return 'clicked ' + b.innerText;
          }
        }
        return 'not found';
      });
      console.log('글쓰기 button:', se4Btn);
      
      await page.waitForTimeout(3000);
      console.log('After click URL:', page.url());
      
      // Let me try a direct URL approach - go to the SE4 editor
      await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      console.log('PostWriteForm URL:', page.url());
      
      // Check if SE4 editor loaded
      const hasEditor = await page.evaluate(() => {
        return {
          hasSmartEditor: typeof SmartEditor !== 'undefined',
          se4Editors: Object.keys(SmartEditor?._editors || {}),
          titleInput: document.querySelector('#title, [name="title"], .se-title-input, .write_title')?.tagName,
        };
      }).catch(() => ({ hasSmartEditor: false, se4Editors: [], titleInput: null }));
      console.log('Editor check:', JSON.stringify(hasEditor));
    }
    
    await page.screenshot({ path: 'blog_editor_state.png', fullPage: false });
    console.log('\nScreenshot saved: blog_editor_state.png');
    
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
})();
