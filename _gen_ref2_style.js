const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

const THEMES = {
  dark_purple: { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow:'rgba(92,61,232,0.55)', badgeBg:'rgba(167,139,250,0.15)', badgeColor:'#a78bfa', badgeBorder:'rgba(167,139,250,0.3)', textColor:'#fff', accent:'#a78bfa', subColor:'rgba(255,255,255,0.6)', ctaFrom:'#5c3de8', ctaTo:'#7c5cf6' },
  dark_green: { bg:'linear-gradient(160deg,#0a1628,#0f2847,#064e3b)', glow:'rgba(52,211,153,0.3)', badgeBg:'rgba(52,211,153,0.15)', badgeColor:'#34d399', badgeBorder:'rgba(52,211,153,0.3)', textColor:'#fff', accent:'#34d399', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#059669', ctaTo:'#34d399' },
  light_warm: { bg:'linear-gradient(160deg,#fdfaf2,#f8f3ea,#f0eadc)', glow:'rgba(180,155,120,0.12)', badgeBg:'rgba(180,155,120,0.12)', badgeColor:'#8b7355', badgeBorder:'rgba(180,155,120,0.25)', textColor:'#3d3028', accent:'#8b7355', subColor:'rgba(61,48,40,0.5)', ctaFrom:'#8b7355', ctaTo:'#5c3de8' },
  light_mint: { bg:'linear-gradient(160deg,#f5faf8,#ecf5f0,#e0ede5)', glow:'rgba(52,180,130,0.12)', badgeBg:'rgba(52,180,130,0.1)', badgeColor:'#2d8a6a', badgeBorder:'rgba(52,180,130,0.2)', textColor:'#1a3a2e', accent:'#2d8a6a', subColor:'rgba(26,58,46,0.5)', ctaFrom:'#2d8a6a', ctaTo:'#5c3de8' },
};

async function gen(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const iW = opt.width || 700;
  const iH = opt.height || 700;
  const GAP = iW > iH ? Math.round(iH * 0.06) : Math.round(iH * 0.07);

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${iW}px;height:${iH}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;background:${T.bg}}
.card{width:${iW}px;height:${iH}px;position:relative;overflow:hidden;background:${T.bg};display:flex;align-items:center;justify-content:center;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);
  width:${iW}px;height:${Math.round(iH*1.0)}px;top:35%;left:50%;transform:translate(-50%,-50%);}
.content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;gap:${GAP}px;max-width:88%;}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};
  font-size:${iW>iH?14:15}px;font-weight:700;padding:${iW>iH?'5px 18px':'6px 20px'};
  border:1px solid ${T.badgeBorder};border-radius:30px;letter-spacing:-0.3px;backdrop-filter:blur(1px);}
.main{color:${T.textColor};font-size:${iW>iH?32:38}px;font-weight:800;line-height:1.35;
  word-break:keep-all;letter-spacing:-0.5px;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:${iW>iH?14:15}px;font-weight:400;line-height:1.4;
  word-break:keep-all;letter-spacing:-0.2px;}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;
  font-size:${iW>iH?13:15}px;font-weight:700;padding:${iW>iH?'8px 30px':'10px 34px'};
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

async function imgUpload(page, frame, file) {
  const btn = frame.locator('.se-toolbar-item-image button').first();
  const fcP = page.waitForEvent('filechooser', {timeout:8000}).catch(()=>null);
  await btn.click(); await page.waitForTimeout(400);
  const fc = await fcP;
  if (fc) { await fc.setFiles(file); await page.waitForTimeout(2500); }
  await frame.evaluate(()=>{try{const se=SmartEditor.getEditor('blogpc001');se._editingService.insertTextCompAtLast();se._canvasScrollingService.focusToFirstComp();}catch(e){}});
}

async function main() {
  // === STEP 1: 이미지 생성 ===
  console.log('=== 이미지 생성 (REF2 스타일) ===');
  // 대표만 700x700, 나머진 800x450 dark/light 교차
  const imgs = [
    { theme:'dark_purple', badge:'🏢 분양 마케팅', out:'aicut_blog_estate_main.png', width:700, height:700,
      main:'분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배 올린 썰',
      sub:'직접 부딪힌 3개월, 솔직한 후기', cta:'AICUT 무료상담 →' },
    { theme:'light_warm', badge:'🔄 3개월의 기록', out:'aicut_blog_estate_cycle.png', width:800, height:450,
      main:'1달 차: 자신감\n2달 차: 좌절\n<em>3달 차: 현타</em>',
      sub:'이 패턴, 공감되시나요? 😅', cta:'AICUT 해결 →' },
    { theme:'dark_purple', badge:'💰 현실 계산', out:'aicut_blog_estate_cost.png', width:800, height:450,
      main:'인력 1명 300만원\n<em>외주는 절반</em>\n퀄리티는 더 높은데',
      sub:'직접 하는 게 오히려 손해였다 🤯', cta:'AICUT 견적 →' },
    { theme:'light_warm', badge:'📱 3채널 전략', out:'aicut_blog_estate_channel.png', width:800, height:450,
      main:'릴스·쇼츠·틱톡\n<em>채널별 맞춤</em>\n콘텐츠로 바꿨다',
      sub:'감성/정보/트렌드, 각각 다르게', cta:'AICUT 전략 →' },
    { theme:'dark_purple', badge:'✅ 바뀐 점 4가지', out:'aicut_blog_estate_after.png', width:800, height:450,
      main:'① 밤 11시에 잡니다\n② 퀄리티 UP\n③ 비용 DOWN\n④ 팀원 표정 😂',
      sub:'외주 맡기고 모든 게 바뀌었다', cta:'AICUT 후기 →' },
    { theme:'dark_green', badge:'🚀 지금 시작', out:'aicut_blog_estate_cta.png', width:800, height:450,
      main:'하반기 준비\n<em>에이컷과 함께</em>',
      sub:'카톡: pf.kakao.com/_GIesX/chat', cta:'AICUT 상담 신청' },
  ];

  for (let i=0; i<imgs.length; i++) {
    process.stdout.write(`  [${i+1}/6] ${imgs[i].out} (${imgs[i].width}x${imgs[i].height}, ${imgs[i].theme})...`);
    try { const r = await gen(imgs[i]); console.log(` ✅ ${r.sizeKB}KB`); }
    catch(e) { console.log(` ❌ ${e.message}`); }
  }

  // === STEP 2: 에디터 업로드 (이미지만 교체) ===
  console.log('\n=== 에디터 이미지 교체 ===');
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let ep = ctx.pages().find(p => p.url().includes('Redirect=Write'));
  if (!ep) {
    ep = ctx.pages().find(p => p.url().includes('blog.naver.com') && !p.url().includes('nidlogin')) || await ctx.newPage();
    ep.on('dialog', async d => await d.dismiss());
    await ep.goto('https://blog.naver.com/aicut?Redirect=Write&', {waitUntil:'domcontentloaded',timeout:20000});
    await ep.waitForTimeout(4000);
  }
  const frames = ep.frames();
  let sf = frames.find(f => f.url().includes('PostWriteForm') || f.url().includes('/postwrite'));
  let att = 0;
  while (!sf && att < 10) { await ep.waitForTimeout(1000); sf = ep.frames().find(f => f.url().includes('PostWriteForm') || f.url().includes('/postwrite')); att++; }
  if (!sf) { console.log('❌ iframe 없음'); await b.close(); return; }

  // Find existing image components and re-upload
  // Clear all existing content and re-upload images into existing structure
  const imgFiles = [
    'aicut_blog_estate_main.png',
    'aicut_blog_estate_cycle.png',
    'aicut_blog_estate_cost.png',
    'aicut_blog_estate_channel.png',
    'aicut_blog_estate_after.png',
    'aicut_blog_estate_cta.png'
  ];

  // Approach: remove existing images and re-add them via toolbar
  // First, check current state
  const before = await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    const imgs = document.querySelectorAll('.se-image-resource');
    return { title: se.getDocumentTitle(), imgCount: imgs.length };
  });
  console.log('현재 상태:', JSON.stringify(before));

  // Navigate cursor to first text position, then delete existing images and re-upload
  // Actually, easier: just reset and redo text+images
  await sf.evaluate((title) => {
    const se = SmartEditor.getEditor('blogpc001');
    se._documentService.resetDocumentData();
    se.setDocumentTitle(title);
    se._canvasScrollingService.focusToFirstComp();
  }, before.title);

  // Re-write text and images in order
  const writeS = async (t) => {
    await sf.evaluate((txt) => {
      const se = SmartEditor.getEditor('blogpc001');
      try { se._editingService.writeTextWithSoftLineBreak(txt); }
      catch(e) { se._editingService.insertTextCompAtLast(); se._canvasScrollingService.focusToFirstComp(); se._editingService.writeTextWithSoftLineBreak(txt); }
    }, t);
  };
  const br = async () => { await sf.evaluate(()=>{try{SmartEditor.getEditor('blogpc001')._editingService.lineBreak();}catch(e){}}); };

  const texts = [
    '분양대행사 관계자라면 상상해보세요. 💭',
    '"브로셔는 만들었는데, 요즘 경쟁사들은 영상까지 찍더라"',
    '"영상 제작 알아보니 견적이 천차만별이고"',
    '"하반기 준비해야 하는데 시간이 너무 부족해"',
    '이게 제 현실이었습니다. 영상 마케팅 외주를 고민하게 된 계기입니다. 🏢😵',

    '처음엔 자신만만했습니다.',
    '"분양은 현장 상담이 정석이지"',
    '브로슈어 잘 만들면 된다고 생각했습니다.',
    '이게 되던 시절이 있었죠. 💪',

    '🔄 1달 차: 자신감 → 2달 차: 좌절 → 3달 차: 현타',
    '이 패턴, 공감되시나요? 😅',

    '💡 깨달음: 시간이 곧 돈이다',
    '영상편집 외주 50~100만원 vs 인력 1명 300만원',
    '뭐지? 직접 하는 게 오히려 손해였습니다. 🤯',

    '채널별로 전략을 바꿨습니다',
    '릴스=감성+인테리어 / 쇼츠=정보+가치 / 틱톡=트렌드+현장감',

    '✅ 영상 편집 외주, 이렇게 바뀌었습니다',
    '✅ 바뀐 점 1~4: 정시납품·퀄리티UP·비용DOWN·팀원표정 😂',

    '🎯 그만 고민하세요. 영상 마케팅 외주는 똑똑한 선택입니다. 👍',
    '📩 카톡: pf.kakao.com/_GIesX/chat',
    '📧 master@aicut.co.kr  |  🌐 aicut.co.kr',
    '#분양대행사 #분양마케팅 #하반기마케팅 #영상마케팅 #부동산마케팅 #분양영상 #모델하우스 #숏폼마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #영상편집외주 #영상편집대행 #분양대행 #청약마케팅 #부동산중개 #분양홍보 #영상콘텐츠 #숏폼영상 #인스타릴스 #부동산릴스 #분양숏폼 #마케팅전략 #하반기준비 #분양업계 #에이컷 #aicuts #영상제작외주 #분양전문 #부동산영상'
  ];

  for (const t of texts) {
    await writeS(t); await br();
  }

  // Upload images interspersed
  // After 도입부
  await br(); await br();
  await imgUpload(ep, sf, path.join(W, imgFiles[0])); // main
  
  await br();
  await imgUpload(ep, sf, path.join(W, imgFiles[1])); // cycle
  
  await br();
  await imgUpload(ep, sf, path.join(W, imgFiles[2])); // cost
  
  await br();
  await imgUpload(ep, sf, path.join(W, imgFiles[3])); // channel
  
  await br();
  await imgUpload(ep, sf, path.join(W, imgFiles[4])); // after
  
  await br();
  await imgUpload(ep, sf, path.join(W, imgFiles[5])); // cta

  // Center alignment
  await sf.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelectorAll('.se-section-image').forEach(s => {
      s.classList.add('se-section-align-center');
      s.style.textAlign = 'center';
    });
  });

  // Verify
  const st = await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    const ps = document.querySelectorAll('.se-text-paragraph');
    const imgs = document.querySelectorAll('.se-image-resource');
    return {
      title: se.getDocumentTitle(),
      len: se.getContentText().length,
      paras: ps.length,
      centerParas: document.querySelectorAll('.se-text-paragraph-align-center').length === ps.length ? '100%' : '?',
      imgs: imgs.length,
    };
  });

  console.log('\n=== 최종 ===');
  console.log(JSON.stringify(st, null, 2));
  await b.close();
  console.log('=== 완료 ===');
}

main().catch(e => console.error('FATAL:', e));
