const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  p.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // Go to post page
  await p.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'networkidle', timeout: 15000 });
  await p.waitForTimeout(5000);

  console.log('Parent URL:', p.url());

  // Find mainFrame
  const mf = await p.$('iframe[name="mainFrame"], iframe[id="mainFrame"]');
  if (!mf) {
    console.log('mainFrame iframe not found');
    return;
  }
  
  const frame = await mf.contentFrame();
  if (!frame) {
    console.log('Cannot access mainFrame content');
    return;
  }

  console.log('mainFrame URL:', frame.url());

  // Search for edit button inside mainFrame
  const editInfo = await frame.evaluate(() => {
    const results = [];
    
    // Method 1: text contains "수정"
    const allEls = document.querySelectorAll('a, button, span, div, li');
    for (const el of allEls) {
      const text = (el.textContent || '').trim();
      if (text === '수정' || text === '편집' || text === 'Edit' || text === '글 수정' || text.includes('수정하기')) {
        if (el.offsetParent !== null) {
          results.push({
            tag: el.tagName,
            text: text,
            id: el.id || '',
            className: (el.className || '').substring(0, 80),
            href: el.href || el.getAttribute('href') || '',
            onclick: (el.getAttribute('onclick') || '').substring(0, 150)
          });
        }
      }
    }

    // Method 2: href contains Edit
    const links = document.querySelectorAll('a');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const text = (link.textContent || '').trim();
      if ((href.includes('Edit') || href.includes('edit')) && link.offsetParent !== null) {
        results.push({
          tag: 'a',
          text: text,
          href: href.substring(0, 150),
          visible: true
        });
      }
    }

    // Method 3: check blog top toolbar
    const toolbar = document.querySelector('.post_toolbar, .blog_toolbar, .area_top_tool, [class*="tool"]');
    if (toolbar) {
      results.push({
        tag: 'toolbar',
        className: toolbar.className,
        html: toolbar.innerHTML.substring(0, 200)
      });
    }

    // Method 4: Check for SE post control buttons (수정/삭제)
    const seButtons = document.querySelectorAll('.se_module_button, .se_module_control, .se-module-button');
    for (const btn of seButtons) {
      results.push({
        tag: btn.tagName,
        text: (btn.textContent || '').trim(),
        className: (btn.className || '').substring(0, 80)
      });
    }

    return results;
  });

  console.log('mainFrame - 수정/Edit elements:', JSON.stringify(editInfo, null, 2));

  // Also check parent page for login state
  const loginInfo = await p.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    let loginId = '';
    for (const s of scripts) {
      if (s.text && s.text.includes('loginId')) {
        const m = s.text.match(/loginId["']?\s*[:=]\s*["']([^"']+)["']/);
        if (m) loginId = m[1];
      }
      if (s.text && s.text.includes('blogId')) {
        const m = s.text.match(/blogId["']?\s*[:=]\s*["']([^"']+)["']/);
        if (m) loginId = m[1];
      }
    }
    return { loginId };
  });
  console.log('Login info:', JSON.stringify(loginInfo));

  await p.close();
  b.disconnect();
})().catch(e => console.log('E:', e.message));
