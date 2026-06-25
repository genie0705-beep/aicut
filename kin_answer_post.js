const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  // ====== 질문 1: 사진을 AI동영상으로 ======
  async function answerAIvideo() {
    const url = 'https://kin.naver.com/qna/detail.naver?d1id=8&dirId=8080105&docId=493566474';
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(4000);
    
    // 답변하기 버튼 클릭
    const btn = await p.$('._answerWriteButtonWrapper button, button._answerWriteButton');
    if (!btn) { console.log('답변하기 버튼 없음'); await p.close(); return; }
    
    await btn.click();
    await p.waitForTimeout(3000);
    
    // 에디터 확인
    const editorInfo = await p.evaluate(() => {
      const editors = document.querySelectorAll('textarea, [contenteditable=true], iframe');
      return Array.from(editors).map((e, i) => ({
        idx: i, tag: e.tagName, 
        type: e.getAttribute('type') || '',
        editable: e.getAttribute('contenteditable') || '',
        id: e.id,
        class: (e.className || '').substring(0, 40)
      }));
    });
    console.log('에디터 정보:', JSON.stringify(editorInfo, null, 2));
    
    // Wait and check for editor iframe
    await p.waitForTimeout(2000);
    
    const frames = p.frames();
    console.log('프레임 수:', frames.length);
    for (let i = 0; i < frames.length; i++) {
      try {
        const u = frames[i].url().substring(0, 100);
        if (u.includes('kin') || u.includes('smart') || u.includes('editor')) {
          console.log('프레임 ' + i + ': ' + u);
        }
      } catch(e) {}
    }
    
    await p.close();
  }
  
  await answerAIvideo();
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
