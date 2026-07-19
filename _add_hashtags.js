const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const ep = pages.find(p => p.url().includes('Redirect=Write'));
  const frames = ep.frames();
  const sf = frames.find(f => f.url().includes('/postwrite'));
  
  // Append hashtags at the end
  const hashtags = '#분양대행사 #분양마케팅 #하반기마케팅 #영상마케팅 #부동산마케팅 #분양영상 #모델하우스 #숏폼마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #영상편집외주 #영상편집대행 #분양대행 #청약마케팅 #부동산중개 #분양홍보 #영상콘텐츠 #숏폼영상 #인스타릴스 #부동산릴스 #분양숏폼 #마케팅전략 #하반기준비 #분양업계 #에이컷 #aicuts #영상제작외주 #분양전문 #부동산영상';
  
  await sf.evaluate((tags) => {
    const se = SmartEditor.getEditor('blogpc001');
    se._canvasScrollingService.focusToFirstComp();
    se._editingService.lineBreak();
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak(tags);
  }, hashtags);
  
  // Center alignment for hashtags too
  await sf.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
  });
  
  // Verify final state
  const state = await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    return {
      title: se.getDocumentTitle(),
      textLength: se.getContentText().length,
      paras: document.querySelectorAll('.se-text-paragraph').length,
      imgs: document.querySelectorAll('.se-image-resource').length
    };
  });
  
  console.log('=== 해시태그 추가 완료 ===');
  console.log(JSON.stringify(state, null, 2));
  
  await b.close();
})();
