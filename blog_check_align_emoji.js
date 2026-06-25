const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Redirect=Write 탭 (새 글 작성)
  let p = ctx.pages().find(p => p.url().includes('Redirect=Write'));
  
  // 없으면 Redirect=Update 탭 찾기
  if (!p) p = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  
  if (!p) { console.log('에디터 탭 없음'); await ctx.close(); return; }
  
  await p.bringToFront();
  await p.waitForTimeout(3000);
  
  const pf = p.frames().find(f => f.url().includes('PostWriteForm') || f.url().includes('PostUpdateForm'));
  if (!pf) { console.log('에디터 프레임 없음'); await ctx.close(); return; }
  
  const hasSE = await pf.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors['blogpc001']);
  console.log('SE 접근:', hasSE ? '✅' : '❌');
  if (!hasSE) { await ctx.close(); return; }
  
  // 1) 정렬 API 확인
  const alignInfo = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const es = se._editingService;
    const ds = se._documentService;
    
    const esMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(es));
    const alignRelated = esMethods.filter(m =>
      m.includes('align') || m.includes('justify') || m.includes('center')
    );
    
    const dsMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(ds));
    const dsAlign = dsMethods.filter(m =>
      m.includes('align') || m.includes('style') || m.includes('attribute')
    );
    
    let execCenter = false;
    try { execCenter = document.execCommand('justifyCenter', false, null); } catch(e) {}
    
    // 현재 paragraph의 정렬 상태
    const paras = document.querySelectorAll('.se-text-paragraph');
    const stats = {};
    paras.forEach(p => {
      const cls = p.className;
      const align = cls.includes('align-center') ? 'center' : cls.includes('align-left') ? 'left' : 'other';
      stats[align] = (stats[align] || 0) + 1;
    });
    
    return {
      esAlignMethods: alignRelated,
      dsAlignMethods: dsAlign,
      execCenter: execCenter,
      currentParas: paras.length,
      alignStats: stats,
      sampleClass: paras[0] ? paras[0].className : 'none'
    };
  });
  console.log('\n=== 정렬 API ===');
  console.log('_editingService 정렬 메서드:', alignInfo.esAlignMethods);
  console.log('_documentService 정렬 메서드:', alignInfo.dsAlignMethods);
  console.log('execCommand justifyCenter:', alignInfo.execCenter);
  console.log('현재 paragraph 정렬:', JSON.stringify(alignInfo.alignStats));
  console.log('샘플 class:', alignInfo.sampleClass);
  
  // 2) 이모지 테스트
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('이모지 테스트');
    se._canvasScrollingService.focusToFirstComp();
    const es = se._editingService;
    es.write('이모지 테스트: 🔥⚽🎯');
    es.lineBreak();
    es.write('두 번째 라인 ✅');
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const emojiResult = await pf.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    const paras = wrap.querySelectorAll('.se-text-paragraph');
    const emojiParas = [];
    paras.forEach(p => {
      const text = p.textContent || '';
      // 이모지 범위: U+1F300~U+1FFFF
      for (let i = 0; i < text.length; i++) {
        const code = text.codePointAt(i);
        if (code && code >= 0x1F300 && code <= 0x1FFFF) {
          emojiParas.push(text.substring(0, 50));
          break;
        }
      }
    });
    return {
      totalParas: paras.length,
      emojiParasCount: emojiParas.length,
      samples: emojiParas.slice(0, 3)
    };
  });
  console.log('\n=== 이모지 테스트 ===');
  console.log(JSON.stringify(emojiResult, null, 2));
  
  await ctx.close();
})().catch(e => console.error('ERR:', e.message.substring(0, 300)));
