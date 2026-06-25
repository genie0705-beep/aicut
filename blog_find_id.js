const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const p = ctx.pages()[6];
  await p.bringToFront();
  await p.waitForTimeout(2000);
  
  // PostList 페이지에서 포스팅 ID 찾기
  await p.goto('https://blog.naver.com/PostList.naver?blogId=aicut&widgetTypeCall=true&noTrackingCode=true&directAccess=true', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(()=>{});
  await p.waitForTimeout(5000);
  
  // 모든 프레임에서 aicut/숫자 링크 수집
  const frames = p.frames();
  let postId = null;
  let postTitle = '';
  
  for (let i = 0; i < frames.length; i++) {
    try {
      const result = await frames[i].evaluate(() => {
        const links = document.querySelectorAll('a');
        const found = [];
        links.forEach(a => {
          const href = a.href || '';
          const text = a.innerText.trim();
          const m = href.match(/aicut\/(\d+)/);
          if (m && text.length > 5) {
            found.push({ text: text.substring(0, 60), id: m[1] });
          }
        });
        return found;
      }).catch(() => []);
      
      for (const item of result) {
        if (item.text.includes('변호사') || item.text.includes('세무사') || item.text.includes('보험')) {
          postId = item.id;
          postTitle = item.text;
          console.log('✅ 발견! 프레임 ' + i + ': ' + item.text + ' (ID: ' + item.id + ')');
          break;
        }
      }
      if (postId) break;
    } catch(e) {}
  }
  
  if (postId) {
    console.log('\n🔗 수정 페이지 링크:');
    console.log('https://blog.naver.com/PostEditor.naver?blogId=aicut&logNo=' + postId);
    console.log('\n(브라우저에서 이 주소로 직접 이동하시면 됩니다)');
  } else {
    console.log('전문직 포스팅을 찾지 못했습니다');
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
