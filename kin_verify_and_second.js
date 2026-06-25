const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // ====== 1단계: 첫 번째 답변 확인 ======
  const pages = ctx.pages();
  for (const p of pages) {
    if (p.url().includes('493566474')) {
      const text = await p.evaluate(() => document.body.innerText.substring(0, 600));
      console.log('=== 질문1 상태 ===');
      // Check if our answer appears
      if (text.includes('Runway') || text.includes('AI 영상 생성')) {
        console.log('✅ 답변이 등록된 것으로 보입니다!');
      } else {
        console.log('❓ 답변 확인 불가 (에디터가 닫혔거나 등록 안 됨)');
      }
      console.log(text.substring(0, 400));
      break;
    }
  }

  // ====== 2단계: 두 번째 질문 - 숏폼 마케팅 ======
  // '숏폼 제품 마케팅' 질문 (답변 1개)
  const url2 = 'https://kin.naver.com/qna/detail.naver?d1id=3&dirId=3031003&docId=493792415';
  // Actually let me use the one I found earlier: '숏폼 제품 마케팅'
  
  // Let me find a good second question - search for "숏폼 제품 마케팅"
  // The proper docId needs to be checked
  console.log('\n=== 두 번째 답변 준비 ===');
  
  // Open a new tab for the second question
  const p2 = await ctx.newPage();
  
  // Search for 영상편집/숏폼 관련 최신 질문
  await p2.goto('https://kin.naver.com/search/list.naver?query=' + encodeURIComponent('영상편집 하는법') + '&section=qna&sort=date', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(3000);
  
  const questions = await p2.evaluate(() => {
    const links = document.querySelectorAll('a[href*="detail.naver"]');
    const seen = new Set();
    return Array.from(links)
      .filter(a => {
        const t = (a.innerText || '').trim();
        return t.length > 8 && !seen.has(t) && seen.add(t);
      })
      .slice(0, 8)
      .map(a => ({ text: (a.innerText || '').trim().substring(0, 60), href: a.href }));
  });
  
  console.log('찾은 질문들:');
  questions.forEach((q, i) => console.log(i + ': ' + q.text));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
