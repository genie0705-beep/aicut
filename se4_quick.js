const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];

  let page = null;
  // Redirect=Write 페이지 찾기
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm') || p.url().includes('Redirect=Write')) {
      page = p; break;
    }
  }

  if (!page) {
    console.log('에디터 없음 — PostList에서 열기');
    for (const p of ctx.pages()) {
      if (p.url().includes('PostList.naver') && p.url().includes('aicut')) {
        page = p;
        await page.evaluate(() => {
          const btn = document.querySelector('a[href*="Redirect=Write"]');
          if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 4000));
        break;
      }
    }
  }

  if (!page) { console.log('❌ 페이지 못 찾음'); return; }

  let ef = null;
  for (const f of page.frames()) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; }
    } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }

  console.log('1. ✅ 에디터 발견');

  // 제목
  await ef.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('7월 마지막 주, 날씨별 서울 주말 나들이 BEST 5');
  });
  console.log('2. ✅ 제목 설정');

  // 본문
  const html = fs.readFileSync(path.join(__dirname, 'blog_content_20260718.html'), 'utf-8');
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');

  await ef.evaluate((t) => {
    const ed = SmartEditor._editors['blogpc001'];
    ed._canvasScrollingService.focusToFirstComp();
    ed._editingService.writeTextWithSoftLineBreak(t);
  }, text);
  console.log('3. ✅ 본문 입력');

  // 정렬 + H태그
  await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data?.document?.blocks || [];
    blocks.forEach((b, idx) => {
      if (!b || !b.text) return;
      const t = b.text.trim();
      if (t.match(/^(첫째|둘째|셋째|넷째|다섯째)/)) blocks[idx].type = 'heading2';
      else if (t.match(/^(서울숲|코엑스|북서울|양재천|잠실)/)) blocks[idx].type = 'heading3';
      else if (t.includes('영상으로 기록')) blocks[idx].type = 'heading2';
    });
    data.document.blocks = blocks;
    ed.setDocumentData(data);

    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      canvas.innerHTML = blocks.map(b => {
        const tag = b.type === 'heading2' ? 'h2' : b.type === 'heading3' ? 'h3' : 'p';
        return `<${tag} style="text-align:center">${b.text}</${tag}>`;
      }).join('');
    }
  });

  const len = await ef.evaluate(() => SmartEditor._editors['blogpc001'].getContentText().length);
  console.log(`4. ✅ 정렬+H태그 적용 (${len}자)`);
  console.log('\n✅ 완료! 브라우저 확인 후 저장+발행 부탁드립니다.');
})();
