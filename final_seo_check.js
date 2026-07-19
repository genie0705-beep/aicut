const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const results = [];
  let idx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    const info = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return null;
      
      const data = ed._documentService.getDocumentData();
      const str = JSON.stringify(data);
      const comps = data?.document?.components || [];
      
      // 모든 텍스트 추출
      let allText = '';
      let hasCenterAlign = false;
      let ctaKakao = false, ctaEmail = false, ctaWeb = false;
      let hashTags = [];
      let imgCount = 0;
      let h2Count = 0;
      
      function walkNodes(nodes) {
        if (!nodes) return;
        for (const n of nodes) {
          if (n.style?.align === 'center') hasCenterAlign = true;
          if (n.value) {
            allText += n.value + ' ';
            if (n.value.includes('pf.kakao.com')) ctaKakao = true;
            if (n.value.includes('master@aicut.co.kr')) ctaEmail = true;
            if (n.value.includes('aicut.co.kr') && !n.value.includes('pf.kakao.com') && !n.value.includes('@')) ctaWeb = true;
            const hashes = n.value.match(/#[가-힣a-zA-Z0-9]+/g);
            if (hashes) hashTags.push(...hashes);
          }
          if (n.nodes) walkNodes(n.nodes);
        }
      }

      for (const c of comps) {
        const ct = c['@ctype'];
        if (ct === 'text' && c.value) {
          for (const v of c.value) walkNodes([v]);
        }
        if (ct === 'oglink' || ct === 'image' || c.layout === 'image') {
          imgCount++;
        }
      }

      // 제목
      const title = ed._documentService.getDocumentTitle() || '';

      return {
        title,
        bodyLen: allText.length,
        textPreview: allText.substring(0, 200),
        hasCenterAlign,
        ctaKakao, ctaEmail, ctaWeb,
        uniqueHashCount: [...new Set(hashTags)].length,
        imgCount,
        rawStrLen: str.length
      };
    });

    if (info) {
      const checks = {
        '제목 있음': info.title.length > 10 ? '✅' : '❌',
        '본문 1,500자↑': info.bodyLen >= 1500 ? '✅' : `⚠️ ${info.bodyLen}자`,
        '가운데 정렬': info.hasCenterAlign ? '✅' : '❌',
        'CTA 카카오톡': info.ctaKakao ? '✅' : '❌',
        'CTA 이메일': info.ctaEmail ? '✅' : '❌',
        'CTA 홈페이지': info.ctaWeb ? '✅' : '❌',
        '해시태그 30개': info.uniqueHashCount >= 30 ? `✅ ${info.uniqueHashCount}개` : `⚠️ ${info.uniqueHashCount}개`,
        '이미지 포함': info.imgCount >= 1 ? `✅ ${info.imgCount}개` : '❌',
        '본문 KB': `${(info.rawStrLen/1024).toFixed(0)}KB`,
      };

      const label = info.title.includes('프로야구') ? '⚾ 프로야구' : 
                    info.title.includes('장맛비') ? '🌧 장맛비' : '?';

      console.log(`\n━━━ ${label} ━━━`);
      console.log(`  제목: ${info.title.substring(0, 50)}...`);
      console.log(`  본문: ${info.bodyLen}자 / ${(info.rawStrLen/1024).toFixed(0)}KB`);
      console.log(`  첫줄: ${info.textPreview.substring(0, 60)}...`);
      console.log(`\n  SEO 체크리스트:`);
      for (const [key, val] of Object.entries(checks)) {
        console.log(`    ${key}: ${val}`);
      }

      results.push({ label, ...checks, rawLen: info.rawStrLen });
    }
    idx++;
  }

  // 종합
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📋 종합 판정`);
  console.log(`${'='.repeat(50)}`);
  
  const allPass = results.every(r => 
    Object.entries(r).filter(([k]) => k !== 'label' && k !== 'rawLen' && k !== '본문 KB').every(([,v]) => v.startsWith('✅'))
  );

  results.forEach(r => {
    const failCount = Object.entries(r)
      .filter(([k]) => k !== 'label' && k !== 'rawLen' && k !== '본문 KB')
      .filter(([,v]) => !v.startsWith('✅')).length;
    console.log(`  ${r.label}: ${failCount === 0 ? '✅ ALL PASS' : `⚠️ ${failCount}개 항목 미달`}`);
  });

  console.log(`\n  ${allPass ? '✅ 모든 항목 통과! 발행 준비 완료.' : '⚠️ 일부 항목 보완 필요'}`);
  console.log(`  (참고: 이미지 6장 업로드는 document JSON에 image component로 반영되지 않을 수 있음)`);

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
