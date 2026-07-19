const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 가장 최근 작성된 탭 2개 찾기 (body가 가장 큰 2개)
  const editors = [];
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    const state = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return null;
      const data = JSON.stringify(ed._documentService.getDocumentData());
      return {
        bodyLen: data.length,
        title: ed._documentService.getDocumentTitle()?.substring(0, 50) || '',
        hasContent: data.length > 1000
      };
    });
    if (state) editors.push({ page: p, frame: f, ...state });
  }

  // body 크기 기준 정렬 (가장 큰 2개 = 방금 작성한 것)
  editors.sort((a, b) => b.bodyLen - a.bodyLen);
  const mainEditors = editors.filter(e => e.hasContent).slice(0, 2);

  // 각 탭의 실제 내용 확인
  for (const ed of mainEditors) {
    // 본문 첫 200자로 어떤 내용인지 확인
    const contentPreview = await ed.frame.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const str = JSON.stringify(data);
      // components 중 body 내용 찾기
      const comps = data?.document?.components || [];
      for (const c of comps) {
        if (c['@ctype'] === 'paragraph' || c.layout === 'default') {
          const text = JSON.stringify(c).substring(0, 200);
          return text;
        }
      }
      return str.substring(0, 200);
    });

    console.log(`\n📄 제목: ${ed.title}`);
    console.log(`   본문: ${(ed.bodyLen/1024).toFixed(0)}KB`);
    console.log(`   내용: ${contentPreview.substring(0, 100)}...`);
  }

  // 내용 기반으로 올바른 제목 설정
  const fixTitles = [
    { name: '⚾ 프로야구', keywords: ['야구', 'KBO', '프로야구', '숏폼'] },
    { name: '🌧 장맛비', keywords: ['장맛비', '장마', '비 오는', '실내'] },
  ];

  for (const ed of mainEditors) {
    const preview = await ed.frame.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      return JSON.stringify(data).substring(0, 2000);
    });

    let correctTitle = null;
    for (const ft of fixTitles) {
      const matchCount = ft.keywords.filter(kw => preview.includes(kw)).length;
      if (matchCount > 0) {
        if (ft.name === '⚾ 프로야구') 
          correctTitle = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';
        else 
          correctTitle = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';
      }
    }

    if (correctTitle) {
      await ed.frame.evaluate((t) => {
        SmartEditor._editors.blogpc001.setDocumentTitle(t);
      }, correctTitle);
      console.log(`\n✅ ${correctTitle.substring(0, 30)}... 으로 제목 변경`);
      
      // 저장
      await ed.frame.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.trim() === '저장') { b.click(); return; }
        }
      });
      await sleep(2000);
      console.log('   ✅ 저장 완료');
    }
  }

  console.log('\n━━━ ✅ 제목 수정 완료 ━━━');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
