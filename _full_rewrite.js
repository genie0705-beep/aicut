const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

// =============================================
// THEMES — 월드컵 스타일 혼합 (blog_worldcup_v3.js 패턴)
// =============================================
const THEMES = {
  dark_purple: { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow:'rgba(92,61,232,0.55)', badgeBg:'rgba(167,139,250,0.15)', badgeColor:'#a78bfa', badgeBorder:'rgba(167,139,250,0.3)', textColor:'#fff', accent:'#a78bfa', subColor:'rgba(255,255,255,0.6)', ctaFrom:'#5c3de8', ctaTo:'#7c5cf6' },
  light_cyan: { bg:'linear-gradient(160deg,#f0f4f8,#e8ecf5,#dce5f5)', glow:'rgba(6,182,212,0.18)', badgeBg:'rgba(6,182,212,0.1)', badgeColor:'#0891b2', badgeBorder:'rgba(6,182,212,0.25)', textColor:'#0f172a', accent:'#0891b2', subColor:'rgba(15,23,42,0.5)', ctaFrom:'#0891b2', ctaTo:'#5c3de8' },
  light_pink: { bg:'linear-gradient(160deg,#faf5f7,#f8edf5,#fce7f3)', glow:'rgba(236,72,153,0.16)', badgeBg:'rgba(236,72,153,0.1)', badgeColor:'#db2777', badgeBorder:'rgba(236,72,153,0.25)', textColor:'#0f172a', accent:'#db2777', subColor:'rgba(15,23,42,0.5)', ctaFrom:'#db2777', ctaTo:'#5c3de8' },
  dark_green: { bg:'linear-gradient(160deg,#0a1628,#0f2847,#064e3b)', glow:'rgba(52,211,153,0.3)', badgeBg:'rgba(52,211,153,0.15)', badgeColor:'#34d399', badgeBorder:'rgba(52,211,153,0.3)', textColor:'#fff', accent:'#34d399', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#059669', ctaTo:'#34d399' }
};

// =============================================
// STEP 1: 이미지 생성 (REF 분석 CSS + 혼합 테마)
// =============================================
async function genImage(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const iW = opt.width || 700;
  const iH = opt.height || 700;
  const isCard = iW > iH;
  const mtTop = isCard ? Math.round(iH*0.10) : Math.round(iH*0.14);

  const GAP = isCard ? Math.round(iH * 0.06) : Math.round(iH * 0.07);
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${iW}px;height:${iH}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;background:${T.bg}}
.card{width:${iW}px;height:${iH}px;position:relative;overflow:hidden;background:${T.bg};display:flex;align-items:center;justify-content:center;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);
  width:${iW}px;height:${Math.round(iH*1.0)}px;top:35%;left:50%;transform:translate(-50%,-50%);}
.content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;gap:${GAP}px;max-width:88%;}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};
  font-size:${isCard?14:15}px;font-weight:700;padding:${isCard?'5px 18px':'6px 20px'};
  border:1px solid ${T.badgeBorder};border-radius:30px;letter-spacing:-0.3px;backdrop-filter:blur(1px);}
.main{color:${T.textColor};font-size:${isCard?34:40}px;font-weight:800;line-height:1.35;
  word-break:keep-all;letter-spacing:-0.5px;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:${isCard?14:16}px;font-weight:400;line-height:1.4;
  word-break:keep-all;letter-spacing:-0.2px;}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;
  font-size:${isCard?14:16}px;font-weight:700;padding:${isCard?'9px 32px':'11px 38px'};
  border-radius:50px;display:inline-block;letter-spacing:-0.3px;
  box-shadow:0 2px 16px rgba(92,61,232,0.25);}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="content">
    <div class="badge">${opt.badge}</div>
    <div class="main">${opt.main.replace(/\n/g, '<br>')}</div>
    <div class="sub">${opt.sub}</div>
    <div class="cta">${opt.cta||'AICUT →'}</div>
  </div>
</div></body></html>`;

  const tmp = path.join(W, '_tmp_gen.html');
  fs.writeFileSync(tmp, html);
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const c = b.contexts()[0];
  const p = await c.newPage();
  await p.setViewportSize({width:iW,height:iH});
  await p.goto('file:///'+tmp.replace(/\\/g,'/'),{waitUntil:'networkidle',timeout:15000});
  await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(2000);
  const out = path.join(W, opt.out);
  await p.screenshot({path:out,fullPage:false});
  const sz = fs.statSync(out).size;
  await p.close(); await b.close(); fs.unlinkSync(tmp);
  return {file:opt.out,sizeKB:Math.round(sz/1024)};
}

// =============================================
// STEP 2~3: 에디터 본문 작성 + 이미지 등록 + 정렬
// =============================================
async function writeS(sf, t) {
  await sf.evaluate((txt) => {
    const se = SmartEditor.getEditor('blogpc001');
    try { se._editingService.writeTextWithSoftLineBreak(txt); }
    catch(e) { se._editingService.insertTextCompAtLast(); se._canvasScrollingService.focusToFirstComp(); se._editingService.writeTextWithSoftLineBreak(txt); }
  }, t);
}
async function br(sf) { await sf.evaluate(()=>{try{SmartEditor.getEditor('blogpc001')._editingService.lineBreak();}catch(e){}}); }
async function upload(ep, sf, file) {
  const btn = sf.locator('.se-toolbar-item-image button').first();
  const fcP = ep.waitForEvent('filechooser', {timeout:8000}).catch(()=>null);
  await btn.click(); await ep.waitForTimeout(400);
  const fc = await fcP;
  if (fc) { await fc.setFiles(file); await ep.waitForTimeout(2500); }
  await sf.evaluate(()=>{try{const se=SmartEditor.getEditor('blogpc001');se._editingService.insertTextCompAtLast();se._canvasScrollingService.focusToFirstComp();}catch(e){}});
}
async function applyCenter(sf) {
  await sf.evaluate(() => {
    // 텍스트 정렬 — RULES.md 6-2-3
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    // 이미지 섹션 정렬
    document.querySelectorAll('.se-section-image').forEach(s => {
      s.classList.add('se-section-align-center');
      s.style.textAlign = 'center';
      const parent = s.closest('.se-component-content');
      if (parent) parent.style.textAlign = 'center';
    });
    const c = document.querySelector('.se-main-container');
    if (c) c.dispatchEvent(new Event('DOMSubtreeModified', {bubbles:true}));
  });
}

// =============================================
// MAIN
// =============================================
async function main() {
  // === STEP 1: Generate Images ===
  console.log('=== [1/3] 이미지 생성 ===');
  const imgs = [
    { theme:'dark_purple', badge:'🏢 분양 마케팅', out:'aicut_blog_estate_main.png', width:700, height:700,
      main:'분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배 올린 썰',
      sub:'직접 부딪힌 3개월, 솔직한 후기', cta:'AICUT 무료상담 →' },
    { theme:'light_cyan', badge:'🔄 3개월의 기록', out:'aicut_blog_estate_cycle.png', width:700, height:400,
      main:'1달 차: 자신감\n2달 차: 좌절\n<em>3달 차: 현타</em>',
      sub:'이 패턴, 공감되시나요? 😅', cta:'AICUT 해결 →' },
    { theme:'dark_green', badge:'💰 현실 계산', out:'aicut_blog_estate_cost.png', width:700, height:400,
      main:'인력 1명 300만원\n<em>외주는 절반</em>\n퀄리티는 더 높은데',
      sub:'직접 하는 게 오히려 손해였다 🤯', cta:'AICUT 견적 →' },
    { theme:'light_pink', badge:'📱 3채널 전략', out:'aicut_blog_estate_channel.png', width:700, height:400,
      main:'릴스·쇼츠·틱톡\n<em>채널별 맞춤</em>\n콘텐츠로 바꿨다',
      sub:'감성/정보/트렌드, 각각 다르게', cta:'AICUT 전략 →' },
    { theme:'dark_purple', badge:'✅ 바뀐 점 4가지', out:'aicut_blog_estate_after.png', width:700, height:400,
      main:'① 밤 11시에 잡니다\n② 퀄리티 UP\n③ 비용 DOWN\n④ 팀원 표정 😂',
      sub:'외주 맡기고 모든 게 바뀌었다', cta:'AICUT 후기 →' },
    { theme:'dark_green', badge:'🚀 지금 시작', out:'aicut_blog_estate_cta.png', width:700, height:400,
      main:'하반기 준비\n<em>에이컷과 함께</em>',
      sub:'카톡: pf.kakao.com/_GIesX/chat', cta:'AICUT 상담 신청' },
  ];
  
  for (let i=0; i<imgs.length; i++) {
    process.stdout.write(`  [${i+1}/6] ${imgs[i].out}...`);
    try { const r = await genImage(imgs[i]); console.log(` ✅ ${r.sizeKB}KB`); }
    catch(e) { console.log(` ❌ ${e.message}`); }
  }
  
  // === STEP 2: Editor Reset + Write + Image Upload ===
  console.log('=== [2/3] 에디터 작성 ===');
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let ep = ctx.pages().find(p => p.url().includes('Redirect=Write'));
  if (!ep) {
    console.log('  Redirect=Write 탭 없음, 새로 생성...');
    // Use the page that was viewing reference post or create new
    ep = ctx.pages().find(p => p.url().includes('PostView')) || await ctx.newPage();
    await ep.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await ep.waitForTimeout(3000);
  }
  // Wait for postwrite frame to be ready
  let frames = ep.frames();
  let sf = frames.find(f => f.url().includes('PostWriteForm') || f.url().includes('/postwrite'));
  let attempts = 0;
  while (!sf && attempts < 10) {
    await ep.waitForTimeout(1000);
    frames = ep.frames();
    sf = frames.find(f => f.url().includes('PostWriteForm') || f.url().includes('/postwrite'));
    attempts++;
  }
  if (!sf) { console.log('❌ postwrite iframe not found'); await b.close(); return; }
  
  // Reset
  await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._documentService.resetDocumentData();
    se.setDocumentTitle('분양대행사, 브로셔만 들고 있다가 영상 마케팅으로 하반기 매출 2배 올린 썰');
    se._canvasScrollingService.focusToFirstComp();
  });
  
  // --- INTRO ---
  console.log('  도입부...');
  await writeS(sf, '분양대행사 관계자라면 상상해보세요.');
  await br(sf);
  await writeS(sf, '하반기 분양 일정은 다 잡혔는데, 마케팅은 어떻게 할지 막막한 삶을 💭');
  await br(sf); await br(sf);
  await writeS(sf, '"브로셔는 만들었는데, 요즘 경쟁사들은 영상까지 찍더라"');
  await br(sf);
  await writeS(sf, '"영상 제작 알아보니 견적이 천차만별이고 뭐가 맞는지 모르겠고"');
  await br(sf);
  await writeS(sf, '"하반기 준비해야 하는데 시간이 너무 부족해"');
  await br(sf); await br(sf);
  await writeS(sf, '이게 제 현실이었습니다.');
  await br(sf);
  await writeS(sf, '네, 영상 마케팅 외주를 고민하게 된 결정적인 계기입니다. 🏢😵');
  
  // --- MAIN IMAGE ---
  console.log('  메인 이미지...');
  await br(sf); await br(sf);
  await upload(ep, sf, path.join(W, 'aicut_blog_estate_main.png'));
  
  // --- SECTION 1: 처음엔 자신만만 → cycle 이미지 ---
  await writeS(sf, '처음엔 자신만만했습니다');
  await br(sf);
  await writeS(sf, '"분양은 현장 상담이 정석이지, 영상이 뭐가 필요해?"');
  await br(sf);
  await writeS(sf, '브로슈어 잘 만들고, 현장에서 직접 설명하면 된다고 생각했습니다.');
  await br(sf);
  await writeS(sf, '모델하우스 오픈하고, 브로셔 돌리고, 전화 상담하고.');
  await br(sf);
  await writeS(sf, '이게 되던 시절이 있었죠. 💪');
  
  console.log('  cycle 이미지...');
  await br(sf); await br(sf);
  await upload(ep, sf, path.join(W, 'aicut_blog_estate_cycle.png'));
  
  await writeS(sf, '🔄 반복된 악순환의 3개월');
  await br(sf); await br(sf);
  await writeS(sf, '1달 차: 자신감 — "영상쯤이야 우리 사무실 막내가 하면 된다"');
  await br(sf);
  await writeS(sf, '2달 차: 좌절 — "스마트폰으로 찍었더니 화질이... 퀄리티가 안 나온다"');
  await br(sf);
  await writeS(sf, '3달 차: 현타 — "이거 차라리 영상편집 외주 맡기는 게 낫겠다"');
  await br(sf); await br(sf);
  await writeS(sf, '이 패턴, 혹시 공감되시나요? 😅');
  await br(sf); await br(sf);
  await writeS(sf, '솔직히 고백하자면, 분양 영상 1편 만드는 데 평균 3~4일이 걸렸습니다.');
  await br(sf);
  await writeS(sf, '촬영 가서 찍고, 편집하고, 자막 넣고, 수정하고. 그 와중에 본업인 분양 대행도 해야 하고.');
  
  // --- SECTION 2: cost 이미지 ---
  console.log('  cost 이미지...');
  await br(sf); await br(sf);
  await upload(ep, sf, path.join(W, 'aicut_blog_estate_cost.png'));
  
  await writeS(sf, '💡 깨달음: 분양대행사에겐 시간이 곧 돈이다');
  await br(sf); await br(sf);
  await writeS(sf, '어느 날 문득 계산해봤습니다.');
  await br(sf); await br(sf);
  await writeS(sf, '내 영상 제작에 투입하는 시간: 주 20시간');
  await br(sf);
  await writeS(sf, '내 본업(분양 대행)에 써야 할 시간: 주 40시간');
  await br(sf);
  await writeS(sf, '영상편집 외주 월 비용: 50~100만 원');
  await br(sf);
  await writeS(sf, '전담 인력 1명 월 인건비: 300만 원');
  await br(sf); await br(sf);
  await writeS(sf, '뭐지? 직접 하는 게 오히려 손해였습니다. 🤯');
  
  // --- SECTION 3: channel 이미지 ---
  console.log('  channel 이미지...');
  await br(sf); await br(sf);
  await upload(ep, sf, path.join(W, 'aicut_blog_estate_channel.png'));
  
  await writeS(sf, '채널별로 전략을 바꿨습니다');
  await br(sf); await br(sf);
  await writeS(sf, '인스타 릴스 → 감성 + 인테리어');
  await br(sf);
  await writeS(sf, '모델하우스 인테리어 디테일 + 잔잔한 BGM. 저장 수가 확 늘었습니다.');
  await br(sf); await br(sf);
  await writeS(sf, '유튜브 쇼츠 → 정보 + 가치');
  await br(sf);
  await writeS(sf, '분양 조건·청약 일정·시세 분석. 구독자 유입이 가장 잘 나왔습니다.');
  await br(sf); await br(sf);
  await writeS(sf, '틱톡 → 트렌드 + 현장감');
  await br(sf);
  await writeS(sf, '분양 현장 비하인드, 관계자 일상. 2030 예비 청약자 유입이 생겼습니다.');
  
  // --- SECTION 4: after 이미지 ---
  console.log('  after 이미지...');
  await br(sf); await br(sf);
  await upload(ep, sf, path.join(W, 'aicut_blog_estate_after.png'));
  
  await writeS(sf, '✅ 영상 편집 외주, 이렇게 바뀌었습니다');
  await br(sf); await br(sf);
  await writeS(sf, '✅ 바뀐 점 1: 매주 정해진 요일에 영상 납품 (더 이상 독촉 없다)');
  await br(sf);
  await writeS(sf, '✅ 바뀐 점 2: 퀄리티가 확 올라감 (전문 에디터 편집)');
  await br(sf);
  await writeS(sf, '✅ 바뀐 점 3: 오히려 비용 DOWN (내 시간 = 분업무)');
  await br(sf);
  await writeS(sf, '✅ 바뀐 점 4: 팀원 표정이 좋아짐 (가장 중요) 😂');
  await br(sf); await br(sf);
  await writeS(sf, '분양대행사는 편집할 시간에 분양 전략을 고민해야 합니다.');
  
  // --- CTA IMAGE ---
  console.log('  CTA 이미지...');
  await br(sf); await br(sf);
  await upload(ep, sf, path.join(W, 'aicut_blog_estate_cta.png'));
  
  await writeS(sf, '🎯 이 글을 보는 당신에게');
  await br(sf); await br(sf);
  await writeS(sf, '혹시 지금도 브로셔만 들고 SNS 마케팅 고민하고 계신가요?');
  await br(sf);
  await writeS(sf, '그만 고민하세요. 영상 마케팅 외주는 부끄러운 게 아닙니다.');
  await br(sf);
  await writeS(sf, '오히려 똑똑한 선택입니다. 👍');
  await br(sf); await br(sf);
  await writeS(sf, '📞 지금 에이컷에 무료 상담해보세요. 분양대행사 일정에 맞춰 월 정기 납품 가능합니다.');
  await br(sf); await br(sf);
  await writeS(sf, '📩 카톡: pf.kakao.com/_GIesX/chat');
  await br(sf);
  await writeS(sf, '📧 이메일: master@aicut.co.kr');
  await br(sf);
  await writeS(sf, '🌐 홈페이지: aicut.co.kr');
  
  // --- HASHTAGS ---
  await br(sf); await br(sf);
  await writeS(sf, '#분양대행사 #분양마케팅 #하반기마케팅 #영상마케팅 #부동산마케팅 #분양영상 #모델하우스 #숏폼마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #영상편집외주 #영상편집대행 #분양대행 #청약마케팅 #부동산중개 #분양홍보 #영상콘텐츠 #숏폼영상 #인스타릴스 #부동산릴스 #분양숏폼 #마케팅전략 #하반기준비 #분양업계 #에이컷 #aicuts #영상제작외주 #분양전문 #부동산영상');
  
  // === STEP 3: Center Alignment (RULES.md 6-2-3) ===
  console.log('=== [3/3] 센터 정렬 적용 ===');
  await applyCenter(sf);
  
  // === VERIFY ===
  const st = await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    const ps = document.querySelectorAll('.se-text-paragraph');
    const cps = document.querySelectorAll('.se-text-paragraph-align-center, .se-text-paragraph[style*="center"]');
    const imgs = document.querySelectorAll('.se-section-image');
    const cimgs = document.querySelectorAll('.se-section-align-center');
    return {
      title: se.getDocumentTitle(),
      len: se.getContentText().length,
      paras: ps.length,
      centerParas: `${Math.round(cps.length/ps.length*100)}%`,
      imgs: imgs.length,
      centerImgs: `${Math.round(cimgs.length/imgs.length*100)}%`
    };
  });
  
  console.log('\n=== 최종 검증 ===');
  console.log(JSON.stringify(st, null, 2));
  
  await b.close();
  console.log('\n=== 전면 재작성 완료 ===');
}

main().catch(e => console.error('FATAL:', e));
