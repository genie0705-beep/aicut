const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

const STYLES = {
  dark: {
    bg: '#0D1630',
    gradient: 'linear-gradient(135deg, #0D1630 0%, #1a1f4e 50%, #0D1630 100%)',
    accent: '#a78bfa',
    accent2: '#06b6d4',
    text: '#FFFFFF',
    subtext: '#c0c0d0',
    ctaBg: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
  },
  light: {
    bg: '#FDFAF2',
    gradient: 'linear-gradient(135deg, #FDFAF2 0%, #f5f0e8 100%)',
    accent: '#a78bfa',
    accent2: '#F4B942',
    text: '#1a1a2e',
    subtext: '#666680',
    ctaBg: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
  }
};

const PAGES = [
  // 1. Main 700x700 — dark
  {
    name: 'aicut_blog_estate_main.png', w:700, h:700, style:'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width:700px; height:700px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:60px; text-align:center; overflow:hidden; }
      .tag { background:${s.accent}; color:#fff; padding:8px 24px; border-radius:20px; font-size:16px; font-weight:700; margin-bottom:20px; letter-spacing:1px; }
      h1 { color:#fff; font-size:42px; font-weight:900; line-height:1.3; margin-bottom:16px; word-break:keep-all; }
      .sub { color:${s.subtext}; font-size:18px; font-weight:400; line-height:1.5; word-break:keep-all; }
      .accent-text { color:${s.accent}; }
    </style></head><body>
      <div class="tag">🏢 분양대행사 마케팅</div>
      <h1>"브로셔만 들다가<br><span class="accent-text">영상 마케팅</span>으로<br>하반기 매출 2배"</h1>
      <div class="sub">직접 부딪힌 3개월, 솔직한 후기</div>
    </body></html>`
  },
  // 2. Cycle 800×450 — light (3-column cards)
  {
    name: 'aicut_blog_estate_cycle.png', w:800, h:450, style:'light',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:50px 60px; text-align:center; overflow:hidden; }
      .emoji-icon { font-size:40px; margin-bottom:10px; }
      h2 { color:${s.text}; font-size:28px; font-weight:800; margin-bottom:8px; word-break:keep-all; }
      .subtitle { color:${s.subtext}; font-size:14px; margin-bottom:18px; }
      .items { display:flex; gap:16px; }
      .item { background:#fff; border-radius:16px; padding:16px; width:200px; box-shadow:0 4px 12px rgba(0,0,0,0.08); }
      .item-icon { font-size:32px; margin-bottom:8px; }
      .item-title { font-size:15px; font-weight:700; color:${s.text}; margin-bottom:4px; }
      .item-desc { font-size:12px; color:${s.subtext}; line-height:1.4; }
    </style></head><body>
      <div class="emoji-icon">🔄</div>
      <h2>3개월의 기록</h2>
      <div class="subtitle">직접 하려다 부딪힌 현실</div>
      <div class="items">
        <div class="item"><div class="item-icon">💪</div><div class="item-title">1달 차: 자신감</div><div class="item-desc">"영상쯤이야 우리도 할 수 있지" 직접 찍고 편집 시작</div></div>
        <div class="item"><div class="item-icon">😰</div><div class="item-title">2달 차: 좌절</div><div class="item-desc">화질 안 맞고, 편집 4시간. 본업에 지장</div></div>
        <div class="item"><div class="item-icon">😅</div><div class="item-title">3달 차: 현타</div><div class="item-desc">"이거 외주 맡기는 게 낫겠다" 결정</div></div>
      </div>
    </body></html>`
  },
  // 3. Cost 800×450 — dark (비교표)
  {
    name: 'aicut_blog_estate_cost.png', w:800, h:450, style:'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:50px 60px; text-align:center; overflow:hidden; }
      .emoji-icon { font-size:40px; margin-bottom:10px; }
      h2 { color:#fff; font-size:28px; font-weight:800; margin-bottom:16px; }
      table { width:100%; max-width:620px; border-collapse:collapse; }
      th { background:${s.accent}; color:#fff; padding:10px; font-size:13px; font-weight:700; }
      th:first-child { border-radius:8px 0 0 0; }
      th:last-child { border-radius:0 8px 0 0; }
      td { padding:12px 10px; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.1); }
      td:first-child { font-weight:600; color:#fff; text-align:left; }
      td:nth-child(2) { color:#ff6b6b; text-align:center; }
      td:nth-child(3) { color:#51cf66; text-align:center; font-weight:700; }
      .accent-text { color:${s.accent}; }
    </style></head><body>
      <div class="emoji-icon">💰</div>
      <h2>직접 vs 외주, <span class="accent-text">현실 비교</span></h2>
      <table><tr><th>항목</th><th>직접 제작</th><th>✅ 에이컷</th></tr>
        <tr><td>월 인건비</td><td>300만원~</td><td>50~100만원</td></tr>
        <tr><td>영상 퀄리티</td><td>아마추어</td><td>전문가 수준</td></tr>
        <tr><td>주간 투입 시간</td><td>20시간+</td><td>1시간 이내</td></tr>
        <tr><td>정시 납품</td><td>60%</td><td>98%</td></tr>
      </table>
    </body></html>`
  },
  // 4. Channel 800×450 — light (3-column)
  {
    name: 'aicut_blog_estate_channel.png', w:800, h:450, style:'light',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:50px 60px; text-align:center; overflow:hidden; }
      .emoji-icon { font-size:40px; margin-bottom:10px; }
      h2 { color:${s.text}; font-size:28px; font-weight:800; margin-bottom:6px; }
      .subtitle { color:${s.subtext}; font-size:14px; margin-bottom:18px; }
      .items { display:flex; gap:16px; }
      .item { background:#fff; border-radius:16px; padding:18px 14px; width:200px; box-shadow:0 4px 12px rgba(0,0,0,0.08); }
      .item-icon { font-size:36px; margin-bottom:8px; }
      .item-title { font-size:15px; font-weight:700; color:${s.text}; margin-bottom:4px; }
      .item-desc { font-size:12px; color:${s.subtext}; line-height:1.4; }
    </style></head><body>
      <div class="emoji-icon">📱</div>
      <h2>채널별 맞춤 전략</h2>
      <div class="subtitle">같은 영상도 채널에 따라 다르게</div>
      <div class="items">
        <div class="item"><div class="item-icon">📸</div><div class="item-title">인스타 릴스</div><div class="item-desc">감성+인테리어 중심. 모델하우스 디테일 + BGM</div></div>
        <div class="item"><div class="item-icon">▶️</div><div class="item-title">유튜브 쇼츠</div><div class="item-desc">정보+가치. 분양조건·청약일정·시세 분석</div></div>
        <div class="item"><div class="item-icon">🎵</div><div class="item-title">틱톡</div><div class="item-desc">트렌드+현장감. 현장 비하인드·일상</div></div>
      </div>
    </body></html>`
  },
  // 5. After 800×450 — dark (✅ 체크리스트)
  {
    name: 'aicut_blog_estate_after.png', w:800, h:450, style:'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:50px 60px; text-align:center; overflow:hidden; }
      .emoji-icon { font-size:40px; margin-bottom:10px; }
      h2 { color:#fff; font-size:28px; font-weight:800; margin-bottom:16px; }
      .items { display:flex; flex-direction:column; gap:10px; width:100%; max-width:560px; }
      .item { display:flex; align-items:center; gap:14px; background:rgba(167,139,250,0.12); border:1px solid rgba(167,139,250,0.25); border-radius:14px; padding:14px 20px; text-align:left; }
      .check { background:${s.accent2}; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
      .item-text { color:#fff; font-size:14px; font-weight:600; line-height:1.4; }
      .item-desc { color:${s.subtext}; font-size:12px; }
    </style></head><body>
      <div class="emoji-icon">✅</div>
      <h2>외주 맡기고 바뀐 점</h2>
      <div class="items">
        <div class="item"><div class="check">✓</div><div class="item-text">정시 납품 <span style="color:${s.subtext};font-weight:400;">— 매주 정해진 요일에 영상 도착</span></div></div>
        <div class="item"><div class="check">✓</div><div class="item-text">퀄리티 UP <span style="color:${s.subtext};font-weight:400;">— 전문 에디터 편집으로 완성도 향상</span></div></div>
        <div class="item"><div class="check">✓</div><div class="item-text">비용 DOWN <span style="color:${s.subtext};font-weight:400;">— 인건비 대비 50% 절감</span></div></div>
        <div class="item"><div class="check">✓</div><div class="item-text">팀원 만족 😂 <span style="color:${s.subtext};font-weight:400;">— 더 이상 야근하는 편집 no</span></div></div>
      </div>
    </body></html>`
  },
  // 6. CTA 800×450 — dark
  {
    name: 'aicut_blog_estate_cta.png', w:800, h:450, style:'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:60px; text-align:center; overflow:hidden; }
      h2 { color:#fff; font-size:32px; font-weight:800; margin-bottom:10px; word-break:keep-all; }
      .desc { color:${s.subtext}; font-size:15px; margin-bottom:24px; line-height:1.5; }
      .cta { background:${s.ctaBg}; color:#fff; padding:14px 44px; border-radius:50px; font-size:18px; font-weight:700; display:inline-block; margin-bottom:18px; }
      .contact { color:${s.subtext}; font-size:13px; line-height:1.8; }
      .contact strong { color:${s.accent2}; }
    </style></head><body>
      <h2>하반기 마케팅,<br>지금 준비하세요</h2>
      <div class="desc">분양대행사 맞춤 영상 편집<br>월 정기 납품으로 부담 없이 시작</div>
      <div class="cta">무료 상담 신청</div>
      <div class="contact">
        📩 카톡: <strong>pf.kakao.com/_GIesX/chat</strong><br>
        📧 <strong>master@aicut.co.kr</strong>
      </div>
    </body></html>`
  }
];

(async () => {
  console.log('=== 이미지 생성 (freelancer 스타일) ===');
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  
  for (let i = 0; i < PAGES.length; i++) {
    const p = PAGES[i];
    const s = STYLES[p.style];
    // Wrap in centering frame + fixed card
    const innerHtml = p.html(s);
    // Extract body content and wrap in card div
    const bodyMatch = innerHtml.match(/<body>([\s\S]*)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1] : '';
    const styleMatch = innerHtml.match(/<style>([\s\S]*)<\/style>/);
    const styleContent = styleMatch ? styleMatch[1] : '';
    
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${s.bg};}
.card{width:${p.w}px;height:${p.h}px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;background:${s.gradient};}
${styleContent}
</style></head><body><div class="card">
${bodyContent}
</div></body></html>`;
    
    const tmpFile = path.join(W, `_tmp_${i}.html`);
    fs.writeFileSync(tmpFile, html);
    
    const page = await ctx.newPage();
    await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), {waitUntil:'networkidle', timeout:15000});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2000);
    
    // Force viewport to match exactly
    await page.setViewportSize({width: p.w, height: p.h});
    await page.waitForTimeout(500);
    
    const outPath = path.join(W, p.name);
    await page.screenshot({path: outPath, fullPage: false});
    console.log(`  [${i+1}/${PAGES.length}] ${p.name} ✅`);
    
    fs.unlinkSync(tmpFile);
    await page.close();
  }
  
  await b.close();
  console.log('\n=== 이미지 생성 완료 ===');
  
  // === 에디터 업로드 ===
  console.log('=== 에디터 업로드 ===');
  const b2 = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx2 = b2.contexts()[0];
  let ep = null, sf = null;
  for (const p of ctx2.pages()) {
    const f = p.frames().find(f => f.url().includes('/postwrite') || f.url().includes('PostWriteForm'));
    if (f) {
      const hasEd = await f.evaluate(() => Object.keys(SmartEditor._editors||{}).length > 0).catch(()=>false);
      if (hasEd) { ep = p; sf = f; break; }
    }
  }
  if (!ep || !sf) { console.log('에디터 없음'); await b2.close(); return; }
  
  ep.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._documentService.resetDocumentData();
    se.setDocumentTitle('분양대행사, 브로셔만 들고 있다가 영상 마케팅으로 하반기 매출 2배 올린 썰');
    se._canvasScrollingService.focusToFirstComp();
  });
  
  const w = async (t) => {
    await sf.evaluate((txt) => {
      const se = SmartEditor.getEditor('blogpc001');
      try { se._editingService.writeTextWithSoftLineBreak(txt); }
      catch(e) { se._editingService.insertTextCompAtLast(); se._canvasScrollingService.focusToFirstComp(); se._editingService.writeTextWithSoftLineBreak(txt); }
    }, t);
  };
  const br = async () => { await sf.evaluate(()=>{try{SmartEditor.getEditor('blogpc001')._editingService.lineBreak();}catch(e){}}); };
  const up = async (file) => {
    const btn = sf.locator('.se-toolbar-item-image button').first();
    const fcP = ep.waitForEvent('filechooser',{timeout:10000}).catch(()=>null);
    await btn.click(); await ep.waitForTimeout(800);
    const fc = await fcP;
    if (fc) { await fc.setFiles(path.join(W, file)); await ep.waitForTimeout(3000); }
    await sf.evaluate(()=>{try{const se=SmartEditor.getEditor('blogpc001');se._editingService.insertTextCompAtLast();se._canvasScrollingService.focusToFirstComp();}catch(e){}});
  };
  
  const texts = [
    '분양대행사 관계자라면 상상해보세요. 💭',
    '"브로셔는 만들었는데, 요즘 경쟁사들은 영상까지 찍더라"',
    '이게 제 현실이었습니다. 영상 마케팅 외주를 고민하게 된 계기입니다. 🏢',
    '',
    '처음엔 자신만만했습니다. "분양은 현장 상담이 정석이지" 💪',
    '',
    '🔄 1달 차: 자신감 → 2달 차: 좌절 → 3달 차: 현타 😅',
    '',
    '💡 깨달음: 시간이 곧 돈이다. 외주 50~100만원 vs 인력 300만원 🤯',
    '',
    '채널별 전략: 릴스=감성 / 쇼츠=정보 / 틱톡=트렌드',
    '',
    '✅ 외주 후: 정시납품·퀄리티UP·비용DOWN 😂',
    '',
    '🎯 그만 고민하세요. 똑똑한 선택입니다. 👍',
    '📩 카톡: pf.kakao.com/_GIesX/chat',
    '📧 master@aicut.co.kr',
    '#분양대행사 #분양마케팅 #하반기마케팅 #영상마케팅 #부동산마케팅 #분양영상 #모델하우스 #숏폼마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #영상편집외주 #영상편집대행 #분양대행 #청약마케팅 #부동산중개 #분양홍보 #영상콘텐츠 #숏폼영상 #인스타릴스 #부동산릴스 #분양숏폼 #마케팅전략 #하반기준비 #분양업계 #에이컷 #aicuts #영상제작외주 #분양전문 #부동산영상'
  ];
  for (const t of texts) { if (t) await w(t); await br(); }
  
  const imgFiles = ['aicut_blog_estate_main.png','aicut_blog_estate_cycle.png','aicut_blog_estate_cost.png','aicut_blog_estate_channel.png','aicut_blog_estate_after.png','aicut_blog_estate_cta.png'];
  for (const f of imgFiles) { await br(); await br(); await up(f); }
  
  await sf.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => { p.classList.add('se-text-paragraph-align-center'); p.style.textAlign='center'; });
    document.querySelectorAll('.se-section-image').forEach(s => { s.classList.add('se-section-align-center'); s.style.textAlign='center'; });
  });
  
  const st = await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    return { title: se.getDocumentTitle(), len: se.getContentText().length, imgs: document.querySelectorAll('.se-image-resource').length };
  });
  
  console.log('\n=== 최종 ===');
  console.log(JSON.stringify(st, null, 2));
  await b2.close();
  console.log('=== 완료 ===');
})();
