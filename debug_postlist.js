const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  console.log('=== 모든 프레임 ===');
  page.frames().forEach((f, i) => console.log(`  [${i}] ${f.url().substring(0, 100)}`));

  const pf = page.frames().find(f => f.url().includes('PostList'));
  if (pf) {
    console.log('\n=== PostList Frame 데이터 ===');
    const data = await pf.evaluate(() => {
      // 1. HTML에서 script 태그 찾기
      const scripts = document.querySelectorAll('script');
      let jsonData = null;
      
      for (const s of scripts) {
        const content = s.textContent || s.innerHTML;
        if (content.includes('logNo') && content.includes('"title"')) {
          const match = content.match(/\[{"title":"[^"]+","source":"[^"]+","logNo":\d+.*?}\]/);
          if (match) {
            try { jsonData = JSON.parse(match[0]); } catch(e) {}
          }
        }
      }

      // 2. 모든 a 태그의 href 수집
      const links = [];
      document.querySelectorAll('a[href*="/aicut/"]').forEach(a => {
        const href = a.href || '';
        const text = a.textContent.trim();
        const logMatch = href.match(/\/aicut\/(\d+)/);
        if (logMatch && text.length > 5) {
          links.push({ text: text.substring(0, 80), logNo: logMatch[1], href: href.substring(0, 80) });
        }
      });

      // 3. unique post links (logNo 기준)
      const uniqueLinks = [];
      const seen = new Set();
      for (const l of links) {
        if (!seen.has(l.logNo)) {
          seen.add(l.logNo);
          uniqueLinks.push(l);
        }
      }

      return { jsonData, links: uniqueLinks.slice(0, 50) };
    });

    if (data.jsonData) {
      console.log(`  JSON 데이터: ${data.jsonData.length}개`);
      data.jsonData.forEach(p => console.log(`    ${p.logNo} | ${p.title.substring(0, 60)}`));
    } else {
      console.log('  JSON 없음');
    }

    if (data.links.length > 0) {
      console.log(`\n  링크: ${data.links.length}개`);
      data.links.forEach(l => console.log(`    ${l.logNo} | ${l.text.substring(0, 60)}`));
    } else {
      console.log('  링크 없음');
    }
  }

  b.close();
})().catch(e => console.log('ERR:', e.message));
