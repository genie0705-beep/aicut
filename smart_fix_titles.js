const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let idx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    const bodyText = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      return JSON.stringify(data).substring(0, 3000);
    });

    // 내용 기반 판단
    const hasBaseball = bodyText.includes('야구') || bodyText.includes('KBO') || bodyText.includes('프로야구') || bodyText.includes('숏폼 마케팅');
    const hasRainy = bodyText.includes('장맛비') || bodyText.includes('장마') || bodyText.includes('비 오는') || bodyText.includes('실내');

    const baseballTitle = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';
    const rainyTitle = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';

    let newTitle = null;
    let label = '?';

    if (hasBaseball && !hasRainy) {
      newTitle = baseballTitle;
      label = '⚾ 프로야구';
    } else if (hasRainy && !hasBaseball) {
      newTitle = rainyTitle;
      label = '🌧 장맛비';
    } else if (hasBaseball && hasRainy) {
      // 둘 다 포함 = 장맛비 (body가 더 큰 쪽)
      const len = bodyText.length;
      newTitle = len > 20000 ? rainyTitle : baseballTitle;
      label = len > 20000 ? '🌧 장맛비 (우선)' : '⚾ 프로야구 (우선)';
    }

    if (newTitle) {
      await f.evaluate((t) => {
        SmartEditor._editors.blogpc001.setDocumentTitle(t);
      }, newTitle);
      console.log(`  [${idx}] ${label} ✅ 제목 변경: ${newTitle.substring(0, 30)}...`);
      
      await f.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.trim() === '저장') { b.click(); return; }
        }
      });
      await sleep(2000);
    } else {
      console.log(`  [${idx}] ❓ 내용 판단 불가: 야구=${hasBaseball} 장맛비=${hasRainy}`);
    }
    idx++;
  }

  console.log('\n✅ 제목 수정 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
