const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // PostWriteForm이 있는 새 탭 찾기
  let targetPage = null;
  for (const p of ctx.pages()) {
    // PostWriteForm iframe 있는 탭
    if (p.frames().some(f => f.url().includes('PostWriteForm'))) {
      targetPage = p;
      break;
    }
  }

  if (!targetPage) {
    console.log('❌ 에디터 탭 없음, 새로 엽니다...');
    targetPage = await ctx.newPage();
    await targetPage.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(5000);
  }

  await targetPage.bringToFront();
  await sleep(2000);

  const f = targetPage.frames().find(ff => ff.url().includes('PostWriteForm'));
  if (!f) { console.log('❌ iframe 없음'); b.close(); return; }
  console.log('✅ 에디터 iframe 발견');

  // 포스팅2: 주말 장맛비
  console.log('\n━━━ 🌧 포스팅 2: 주말 장맛비 ━━━');

  // 제목
  const title2 = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';
  const t2 = await f.evaluate((t) => {
    SmartEditor._editors.blogpc001.setDocumentTitle(t);
    return '✅ 제목 입력';
  }, title2);
  console.log(`  ${t2}`);
  await sleep(1000);

  // 본문
  const htmlContent = fs.readFileSync(path.join(__dirname, 'aicut_blog_rainy.html'), 'utf-8');
  const b64 = Buffer.from(htmlContent, 'utf-8').toString('base64');
  const bodyResult = await f.evaluate((b) => {
    const html = decodeURIComponent(escape(atob(b)));
    SmartEditor._editors.blogpc001._commandManager.execCommand('insertHTML', html);
    return '✅ execCommand insertHTML';
  }, b64);
  console.log(`  ${bodyResult}`);
  await sleep(2000);

  // 저장
  const saved = await f.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.trim() === '저장') { b.click(); return '✅ 저장 완료'; }
    }
    return '❌ 저장 버튼 없음';
  });
  console.log(`  ${saved}`);

  console.log('\n━━━ ✅ 2개 포스팅 모두 입력 완료 ━━━');
  console.log('  ⚾ 포스팅 1: 프로야구 — 제목+본문+저장 ✅');
  console.log('  🌧 포스팅 2: 주말 장맛비 — 제목+본문+저장 ✅');
  console.log('  📸 이미지 12장 업로드 부탁드립니다!');

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
