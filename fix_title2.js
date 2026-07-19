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

    // body text 확인
    const bodyText = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const comps = data?.document?.components || [];
      let fullText = '';
      for (const c of comps) {
        fullText += JSON.stringify(c);
      }
      return {
        has야구: fullText.includes('프로야구') || fullText.includes('KBO'),
        has장마: fullText.includes('장맛비') || fullText.includes('장마'),
        preview: fullText.substring(0, 300)
      };
    });

    const baseballTitle = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';
    const rainyTitle = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';

    let newTitle = null;
    let label = '?';
    if (bodyText.has야구 && !bodyText.has장마) { newTitle = baseballTitle; label = '⚾ 프로야구'; }
    else if (bodyText.has장마 && !bodyText.has야구) { newTitle = rainyTitle; label = '🌧 장맛비'; }
    else if (bodyText.has야구 && bodyText.has장마) { 
      // 장맛비 글도 "야구도 취소되고" 포함 → 장맛비로
      if (bodyText.preview.includes('장맛비')) { newTitle = rainyTitle; label = '🌧 장맛비'; }
      else { newTitle = baseballTitle; label = '⚾ 프로야구'; }
    }

    if (newTitle) {
      await f.evaluate((t) => {
        SmartEditor._editors.blogpc001.setDocumentTitle(t);
      }, newTitle);
      console.log(`  [${idx}] ${label}`);
      await f.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.trim() === '저장') { b.click(); return; }
        }
      });
      await sleep(2000);
      console.log('      ✅ 저장');
    }
    idx++;
  }

  console.log('\n✅ 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
