const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const frames = wp.frames();
  for (const f of frames) {
    const has = await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false);
    if (has) {
      const v = await f.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        const canvas = document.querySelector('.se-canvas');
        const text = canvas ? canvas.innerText : '';
        const strongs = canvas ? canvas.querySelectorAll('strong').length : 0;
        const headings = canvas ? canvas.querySelectorAll('h2, h3').length : 0;
        const imgs = canvas ? canvas.querySelectorAll('img').length : 0;
        const links = canvas ? canvas.querySelectorAll('a').length : 0;
        const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
        const longParas = paragraphs.filter(p => p.length > 50);
        const hashCount = (text.match(/#\S+/g) || []).length;
        
        return {
          title: ed.getDocumentTitle(),
          textLen: text.length,
          headingCount: headings,
          strongCount: strongs,
          imgCount: imgs,
          linkCount: links,
          longParas: longParas.length,
          maxParaLen: paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.length)) : 0,
          hashCount: hashCount,
          hasBok: text.includes('중복'),
          hasCTA: text.includes('pf.kakao'),
          hasEmail: text.includes('master@'),
          hasHomepage: text.includes('aicut.co.kr'),
          preview: text.substring(0, 400)
        };
      });
      
      console.log('=== 🔍 최종 리체크 ===\n');
      console.log('📌 제목:', v.title ? '✅' : '❌', '-', v.title);
      console.log('📝 본문:', v.textLen + '자', v.textLen >= 1400 ? '✅' : '⚠️');
      console.log('   H2/H3:', v.headingCount + '개');
      console.log('   Strong:', v.strongCount + '개', v.strongCount >= 5 ? '✅' : '⚠️');
      console.log('🔗 CTA: 카톡', v.hasCTA ? '✅' : '❌', '메일', v.hasEmail ? '✅' : '❌', '홈페이지', v.hasHomepage ? '✅' : '❌');
      console.log('🏷️ 해시태그:', v.hashCount + '개');
      console.log('📱 50자↑:', v.longParas + '개 (최대', v.maxParaLen + '자)');
      console.log('🖼️ 이미지:', v.imgCount + '/5장');
      console.log('🔗 링크:', v.linkCount + '/3개\n');
      console.log('--- 미리보기 ---');
      console.log(v.preview);
      
      break;
    }
  }
  
  await b.close();
})();
