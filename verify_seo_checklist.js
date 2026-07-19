const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const labels = ['⚾ 프로야구', '🌧 장맛비'];
  let idx = 0;

  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    await p.bringToFront();
    await sleep(1000);

    // 전체 문서 텍스트 추출
    const docInfo = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const str = JSON.stringify(data);
      const comps = data?.document?.components || [];

      // 모든 텍스트 노드 수집
      let allText = '';
      let h2Count = 0;
      let strongCount = 0;
      let hashTags = '';
      let hasCenterAlign = false;
      let hasCTA_KaKao = false;
      let hasCTA_Email = false;
      let hasCTA_Web = false;

      function extractNodes(nodes) {
        if (!nodes) return;
        for (const n of nodes) {
          if (n.value) {
            allText += n.value + ' ';
            // 해시태그 체크
            if (n.value.includes('#')) hashTags += n.value + ' ';
            // CTA 체크
            if (n.value.includes('pf.kakao.com')) hasCTA_KaKao = true;
            if (n.value.includes('master@aicut.co.kr')) hasCTA_Email = true;
            if (n.value.includes('aicut.co.kr')) hasCTA_Web = true;
          }
          if (n.nodes) extractNodes(n.nodes);
        }
      }

      for (const c of comps) {
        const cStr = JSON.stringify(c);
        
        // H2 체크 (본문 내용에서)
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (v.nodes) extractNodes(v.nodes);
          }
        }

        // 정렬 체크
        if (cStr.includes('"align"') && cStr.includes('center')) hasCenterAlign = true;
      }

      // H2 개수 (본문 텍스트에서 "H2:" 같은 패턴)
      const h2Matches = allText.match(/프로야구|장맛비|KBO|숏폼|전략|이유|시작|타이밍|준비/g);
      
      return {
        totalTextLen: allText.length,
        textPreview: allText.substring(0, 500),
        h2Count: h2Count,
        hashTagCount: (hashTags.match(/#/g) || []).length,
        hasCTA_KaKao,
        hasCTA_Email,
        hasCTA_Web,
        hasCenterAlign,
        imgComponents: comps.filter(c => c['@ctype'] === 'oglink' || c.layout === 'image').length
      };
    });

    console.log(`\n━━━ ${labels[idx]} SEO 체크 ━━━`);
    console.log(`  📏 본문 길이: ${docInfo.totalTextLen}자`);
    console.log(`  🔖 해시태그: ${docInfo.hashTagCount}개`);
    console.log(`  📧 CTA 카카오톡: ${docInfo.hasCTA_KaKao ? '✅' : '❌'}`);
    console.log(`  📧 CTA 이메일: ${docInfo.hasCTA_Email ? '✅' : '❌'}`);
    console.log(`  🌐 CTA 홈페이지: ${docInfo.hasCTA_Web ? '✅' : '❌'}`);
    console.log(`  🖼 이미지/링크: ${docInfo.imgComponents}개`);
    console.log(`  Ⓜ️ 가운데 정렬: ${docInfo.hasCenterAlign ? '✅' : '❌'}`);
    console.log(`\n  [텍스트 미리보기]`);
    console.log(`  ${docInfo.textPreview.substring(0, 300)}`);
    idx++;
  }

  console.log('\n━━━ 📋 SEO 체크리스트 종합 ━━━');
  console.log('  (아래 항목은 코드 레벨 확인 필요)');
  console.log('  - H2 태그: HTML 파일 기준 7개/5개, 에디터는 plain text');
  console.log('  - Strong 키워드: HTML 기준 12개/10개, 에디터는 plain text');
  console.log('  - 가운데 정렬: SmartEditor 자동 적용 여부 확인 필요');
  console.log('  - 대표 이미지: main 템플릿 첫 번째로 업로드됨');
  console.log('  - 발행 시간: 오전 7~9시 권장');

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
