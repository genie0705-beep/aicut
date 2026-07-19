const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=0', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  // HTML에서 모든 href 수집
  const data = await page.evaluate(() => {
    const allHrefs = [];
    document.querySelectorAll('a[href]').forEach(a => {
      allHrefs.push({ text: a.textContent.trim().substring(0, 60), href: (a.href || '').substring(0, 100) });
    });
    
    // blog.naver.com/aicut/ 링크만 필터
    const blogLinks = allHrefs.filter(h => h.href.includes('/aicut/') && !h.href.includes('PostList'));
    
    // script 태그에서 post JSON 검색
    const scripts = [];
    document.querySelectorAll('script').forEach(s => {
      const c = s.textContent || '';
      if (c.includes('PostList') || c.includes('logNo') || c.includes('aicut')) {
        scripts.push({ type: s.type, content: c.substring(0, 200) });
      }
    });

    // body 텍스트에서 모든 숫자-텍스트 패턴
    const text = document.body.innerText;
    const postTitles = [];
    const lines = text.split('\n').filter(l => l.trim());
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 15 && lines[i].length < 100 && (lines[i].includes('2026') || lines[i].includes('영상') || lines[i].includes('마케팅') || lines[i].includes('편집'))) {
        postTitles.push(lines[i].substring(0, 80));
      }
    }

    return { blogLinks: blogLinks.slice(0, 20), scripts: scripts.slice(0, 5), postTitles: postTitles.slice(0, 30), allHrefs: allHrefs.slice(0, 10) };
  });

  console.log('=== 블로그 링크 ===');
  data.blogLinks.forEach(l => console.log(`  ${l.href} | ${l.text}`));

  console.log('\n=== 포스트 제목 ===');
  data.postTitles.forEach((t, i) => console.log(`  ${i}: ${t}`));

  console.log('\n=== 첫 10개 href ===');
  data.allHrefs.forEach(l => console.log(`  ${l.href.substring(0, 80)} | ${l.text.substring(0, 40)}`));

  b.close();
})().catch(e => console.log('ERR:', e.message));
