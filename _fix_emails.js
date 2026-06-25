const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pg = await ctx.newPage();
  
  // 발견된 로그번호들
  const logNos = ['224322153594','224319092923','224317704980','224302878663','224302829331','224321668804','224321249534','224321152552','224320657442'];
  
  const toFix = [];
  
  for (const no of logNos) {
    try {
      await pg.goto('https://blog.naver.com/aicut/' + no, { waitUntil: 'networkidle', timeout: 15000 });
      await pg.waitForTimeout(1500);
      
      // 본문 확인 (iframe 내부)
      let text = '';
      const frames = pg.frames();
      for (const f of frames) {
        try {
          const t = await f.evaluate(() => document.body.innerText);
          text += t;
        } catch(e) {}
      }
      
      if (text.includes('contact@aicut.co.kr')) {
        toFix.push(no);
        console.log('✅ ' + no + ' - contact@ 발견');
      } else if (text.includes('contact@')) {
        toFix.push(no);
        console.log('✅ ' + no + ' - contact@ 발견 (짧은 버전)');
      } else {
        console.log('❌ ' + no + ' - 없음');
      }
    } catch(e) {
      console.log('❌ ' + no + ' - 에러');
    }
  }
  
  console.log('\n=== 수정 필요: ' + toFix.length + '개 ===');
  console.log(toFix.join(', '));
  
  // 각 포스트 수정
  for (const no of toFix) {
    console.log('\n--- 수정: ' + no + ' ---');
    
    // 수정 모드로 열기
    await pg.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut&logNo=' + no, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await pg.waitForTimeout(3000);
    
    const editorUrl = pg.url();
    if (editorUrl.includes('PostWriteForm')) {
      console.log('  에디터 열림');
      
      // 본문에서 contact@aicut.co.kr → master@aicut.co.kr 변경
      const replaced = await pg.evaluate(() => {
        const wrap = document.querySelector('.se-components-wrap');
        if (!wrap) return 'no wrap';
        const html = wrap.innerHTML;
        const newHtml = html.replace(/contact@aicut\.co\.kr/g, 'master@aicut.co.kr');
        if (html === newHtml) return 'no change needed';
        wrap.innerHTML = newHtml;
        return 'replaced';
      });
      console.log('  ' + replaced);
      
      // 저장
      await pg.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
      await pg.waitForTimeout(3000);
      console.log('  저장 완료');
    } else {
      console.log('  에디터 열기 실패: ' + editorUrl.substring(0, 80));
    }
  }
  
  console.log('\n=== ✅ 모든 수정 완료 ===');
  await b.close();
})();
