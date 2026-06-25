const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  await p.goto('https://www.instagram.com/create/select/', { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  const fi = await p.$('input[type="file"]');
  if (fi) {
    await fi.setInputFiles('C:/Users/paul/.openclaw/workspace/insta_cards/yt_card4.png');
    console.log('이미지 ✅');
    await new Promise(r => setTimeout(r, 2000));

    await p.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '다음');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    const caption = `유튜버·크리에이터라면\n영상 편집, 에이컷에 맡기세요 🚀\n\n✅ 편당 10만 원대부터 (월 정기)\n✅ 2~3일 이내 1차 납품\n✅ 전담 에디터 배정\n✅ 무제한 수정 가능\n\n혼자 모든 걸 하다 지친 크리에이터라면\n지금 바로 문의하세요.\n\n👉 프로필 링크에서 무료 상담 신청\n\n#에이컷 #AICUT #유튜브편집 #영상편집외주 #크리에이터\n#유튜버 #영상편집 #콘텐츠마케팅 #숏폼 #릴스 #쇼츠`;
    
    const ca = await p.$('[aria-label*="캡션"], textarea, [contenteditable="true"]');
    if (ca) { await ca.click({ force: true }); await new Promise(r => setTimeout(r, 500)); await ca.fill(caption); console.log('캡션 ✅'); }
    await new Promise(r => setTimeout(r, 1000));

    const shared = await p.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '공유하기' && !b.disabled);
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('공유:', shared ? '✅' : '❌');
    await new Promise(r => setTimeout(r, 5000));
    console.log('✅ 업로드 완료!');
  }
  process.exit(0);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
