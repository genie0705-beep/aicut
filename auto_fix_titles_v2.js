const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const baseballTitle = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';
  const rainyTitle = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';

  // 가장 본문이 큰 2개 탭 찾기 (최신 작성)
  const editors = [];
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    const info = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const str = JSON.stringify(data);
      // 본문 텍스트 첫 500자에서 키워드 찾기
      const bodyText = data?.document?.components?.map?.(c => JSON.stringify(c)).join(' ') || '';
      return { len: str.length, bodyText: bodyText.substring(0, 2000), page: p, frame: f };
    });
    if (info) editors.push(info);
  }

  // 본문 큰 순 정렬 후 상위 2개
  editors.sort((a, b) => b.len - a.len);
  const mainEditors = editors.filter(e => e.len > 5000).slice(0, 2);

  for (const ed of mainEditors) {
    const text = ed.bodyText;
    const hasBaseball = text.includes('프로야구') || text.includes('KBO 구단') || text.includes('홈런');
    const hasRainy = text.includes('장맛비') || text.includes('장마') || text.includes('비 오');

    let newTitle, label;
    if (hasBaseball && !hasRainy) { newTitle = baseballTitle; label = '⚾ 프로야구'; }
    else if (hasRainy && !hasBaseball) { newTitle = rainyTitle; label = '🌧 장맛비'; }
    else {
      // 둘 다 포함 시 본문 첫 줄로 판단
      if (text.includes('주말 장맛비')) { newTitle = rainyTitle; label = '🌧 장맛비'; }
      else if (text.includes('프로야구 시즌')) { newTitle = baseballTitle; label = '⚾ 프로야구'; }
      else { newTitle = null; label = '?'; }
    }

    if (newTitle) {
      await ed.frame.evaluate((t) => {
        SmartEditor._editors.blogpc001.setDocumentTitle(t);
      }, newTitle);
      console.log(`${label} ✅ 제목 수정: ${newTitle.substring(0, 30)}...`);
      await ed.frame.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.trim() === '저장') { b.click(); return; }
        }
      });
      await sleep(2000);
      console.log(`     ✅ 저장`);
    }
  }

  console.log('\n✅ 제목 수정 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
