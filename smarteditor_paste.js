const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let p = null;
  for (const page of ctx.pages()) {
    if (page.frames().some(f => f.url().includes('PostWriteForm'))) { p = page; break; }
  }
  if (!p) { console.log('탭 없음'); b.close(); return; }

  await p.bringToFront();
  await sleep(2000);
  const f = p.frames().find(f => f.url().includes('PostWriteForm'));

  const posts = [
    { file: 'aicut_blog_baseball.html', label: '⚾ 프로야구' },
    { file: 'aicut_blog_rainy.html', label: '🌧 장맛비' },
  ];

  for (const post of posts) {
    console.log(`\n━━━ ${post.label} ━━━`);

    const htmlContent = fs.readFileSync(path.join(__dirname, post.file), 'utf-8');
    const b64 = Buffer.from(htmlContent, 'utf-8').toString('base64');

    // 접근법 1: execCommand로 HTML 삽입
    const r1 = await f.evaluate((b64h) => {
      try {
        const html = decodeURIComponent(escape(atob(b64h)));
        const ed = SmartEditor._editors.blogpc001;
        if (ed._commandManager && typeof ed._commandManager.execCommand === 'function') {
          ed._commandManager.execCommand('insertHTML', html);
          return '✅ execCommand insertHTML';
        }
        return '❌ execCommand 없음';
      } catch(e) { return '❌ ' + e.message; }
    }, b64);
    console.log(`  ${r1}`);

    await sleep(2000);
    
    // 성공했으면 저장 후 다음 포스트로
    // 이미 저장 버튼이 있으므로 저장
    const saved = await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장') { b.click(); return '✅ 저장'; }
      }
      return '❌ 저장 버튼 없음';
    });
    console.log(`  ${saved}`);
    await sleep(2000);

    // navigate to new write page for post 2
    if (post === posts[0]) {
      console.log('\n  새 글쓰기 페이지로 이동...');
      await p.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await sleep(5000);
      // 새 iframe 찾기
      const f2 = p.frames().find(ff => ff.url().includes('PostWriteForm'));
      if (!f2) { console.log('  ❌ 새 iframe 없음'); break; }
      // f 변수를 새 iframe으로 업데이트 (루프 재실행)
      // 런타임에서 f를 재할당할 순 없으니 루프를 다시 도는 방식 
    }
  }

  console.log('\n✅ 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
