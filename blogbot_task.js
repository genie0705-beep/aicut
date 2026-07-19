const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // Step 1: Open the post in edit mode
  console.log('=== [1] 포스트 수정 모드로 열기 ===');
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&Redirect=Edit&logNo=224341544476', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log('현재 URL:', page.url());
  console.log('현재 제목:', await page.title());

  // Check for SE4 editor or edit page
  const pageInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      iframes: document.querySelectorAll('iframe').length,
      hasSmartEditor: !!document.querySelector('.smart_editor, .se_editor, .se_editor_view, #smart_editor'),
      editorId: document.querySelector('[id*=editor], [id*=Editor]')?.id || 'none',
      // Look for contenteditable areas
      contentEditable: document.querySelectorAll('[contenteditable]').length,
      // Main content area
      mainContent: document.querySelector('#content, .content, main, article')?.id || 'none',
    };
  });
  console.log('페이지 정보:', JSON.stringify(pageInfo, null, 2));

  // Check if redirected to the post view (not edit mode)
  const currentUrl = page.url();
  if (currentUrl.includes('PostView')) {
    console.log('직접 편집 URL 접속 실패. PostView로 리디렉션됨.');
    
    // Try to click edit button
    const editLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="Edit"], a[href*="edit"]'));
      return links.map(a => ({ text: a.textContent.trim(), href: a.href }));
    });
    console.log('수정 링크들:', JSON.stringify(editLinks));
    
    // Try looking for a button element
    const editButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, span, div')).
        filter(el => el.textContent.includes('수정') || el.textContent.includes('편집'));
      return btns.slice(0, 5).map(el => ({ tag: el.tagName, text: el.textContent.trim(), class: el.className }));
    });
    console.log('수정 버튼들:', JSON.stringify(editButtons));
  }

  await page.close();
  b.disconnect();
})().catch(e => console.error('오류:', e.message));
