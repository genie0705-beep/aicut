const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let gaPage = null;
  for (const p of pages) {
    if (p.url().includes('analytics.google.com')) {
      gaPage = p;
      break;
    }
  }
  
  // 관리 페이지에서 '이벤트' 링크의 href 찾기
  const links = await gaPage.evaluate(() => {
    const allLinks = document.querySelectorAll('a');
    const result = [];
    for (const a of allLinks) {
      const text = (a.innerText || '').trim();
      const href = a.getAttribute('href') || '';
      if (text === '이벤트' && href) {
        result.push({ href: href.substring(0, 150), text, id: a.id, class: a.className?.substring(0, 40) });
      }
    }
    return result;
  }).catch(e => 'Error: ' + e.message);
  
  console.log('이벤트 링크들:', JSON.stringify(links, null, 2));
  
  // '데이터 표시' 아래의 이벤트 링크 href 찾기 (tree 구조)
  const treeLinks = await gaPage.evaluate(() => {
    const treeItems = document.querySelectorAll('[role=treeitem]');
    const result = [];
    for (const item of treeItems) {
      const text = (item.innerText || '').trim();
      if (text === '이벤트') {
        const link = item.querySelector('a');
        if (link) {
          result.push({ href: link.getAttribute('href')?.substring(0, 150) });
        }
        // aria-selected, aria-expanded 등
        result.push({
          text,
          role: item.getAttribute('role'),
          expanded: item.getAttribute('aria-expanded'),
          selected: item.getAttribute('aria-selected'),
          tag: item.tagName,
          clickable: !!item.querySelector('a, button, [role=button]')
        });
      }
    }
    return result;
  }).catch(e => 'Error: ' + e.message);
  
  console.log('\\n트리 아이템:', JSON.stringify(treeLinks, null, 2));
  
  // span 요소로 찾기
  const spanEvents = await gaPage.evaluate(() => {
    const spans = document.querySelectorAll('span');
    const result = [];
    for (const s of spans) {
      if ((s.innerText || '').trim() === '이벤트') {
        const parent = s.parentElement;
        result.push({
          parentTag: parent?.tagName,
          parentRole: parent?.getAttribute('role'),
          grandParentTag: parent?.parentElement?.tagName,
          grandParentRole: parent?.parentElement?.getAttribute('role'),
          hasHref: !!parent?.getAttribute('href'),
          href: parent?.getAttribute('href')?.substring(0, 150)
        });
      }
    }
    return result;
  }).catch(e => 'Error: ' + e.message);
  
  console.log('\\n이벤트 span:', JSON.stringify(spanEvents, null, 2));
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
