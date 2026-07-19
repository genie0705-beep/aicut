// 초복 블로그 이미지 5장 일괄 생성 (브라우저 유지 방식)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const THEMES = {
  dark_purple: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    badgeBg: 'rgba(167,139,250,0.15)',
    badgeColor: '#a78bfa',
    badgeBorder: 'rgba(167,139,250,0.3)',
    textColor: '#fff',
    accent: '#a78bfa',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#5c3de8',
    ctaTo: '#7c5cf6',
  },
  light_warm: {
    bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)',
    glow: 'rgba(180,155,120,0.12)',
    badgeBg: 'rgba(180,155,120,0.12)',
    badgeColor: '#8b7355',
    badgeBorder: 'rgba(180,155,120,0.25)',
    textColor: '#3d3028',
    accent: '#8b7355',
    subColor: 'rgba(61,48,40,0.5)',
    ctaFrom: '#8b7355',
    ctaTo: '#5c3de8',
  },
  dark_green: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)',
    glow: 'rgba(52,211,153,0.35)',
    badgeBg: 'rgba(52,211,153,0.15)',
    badgeColor: '#34d399',
    badgeBorder: 'rgba(52,211,153,0.3)',
    textColor: '#fff',
    accent: '#34d399',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#059669',
    ctaTo: '#34d399',
  }
};

const TPLS = {
  main:    { w:700, h:700, theme:'dark_purple', padding:60, badgeFont:16, mainFont:42, subFont:18, ctaFont:20, ctaPad:'14px 48px' },
  card:    { w:600, h:338, theme:'light_warm',   padding:40, badgeFont:14, mainFont:36, subFont:16, ctaFont:18, ctaPad:'10px 36px' },
  cardDark:{ w:600, h:338, theme:'dark_purple',  padding:40, badgeFont:14, mainFont:36, subFont:16, ctaFont:18, ctaPad:'10px 36px' },
  ctaCard: { w:600, h:338, theme:'dark_green',   padding:40, badgeFont:14, mainFont:36, subFont:16, ctaFont:18, ctaPad:'10px 36px' },
};

async function genOne(browser, tpl, badge, main, sub, cta, outFile) {
  const T = TPLS[tpl];
  const C = THEMES[T.theme];
  const isDark = T.theme === 'dark_purple' || T.theme === 'dark_green';
  const textColor = isDark ? '#FFFFFF' : '#1a1a2e';
  const subC = isDark ? '#c0c0d0' : '#666680';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${C.bg};display:flex;align-items:center;justify-content:center;}
.card{width:${T.w}px;height:${T.h}px;overflow:hidden;background:${C.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${T.padding}px;position:relative;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${Math.round(T.w*0.64)}px;height:${Math.round(T.w*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%);}
.badge{background:${C.accent};color:#fff;padding:${T.theme==='light_warm'?'6px 18px':'6px 18px'};border-radius:20px;
  font-size:${T.badgeFont}px;font-weight:700;margin-bottom:20px;letter-spacing:1px;z-index:2;position:relative;}
.main{color:${textColor};font-size:${T.mainFont}px;font-weight:900;line-height:1.3;
  margin-bottom:12px;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;}
.main em{color:${C.accent};font-style:normal;}
.sub{color:${subC};font-size:${T.subFont}px;font-weight:400;line-height:1.5;
  margin-bottom:0;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;}
.cta{background:linear-gradient(135deg,${C.accent},#7c3aed);color:#fff;
  font-size:${T.ctaFont}px;font-weight:700;padding:${T.ctaPad};
  border-radius:50px;display:${cta?'inline-block':'none'};margin-top:24px;
  z-index:2;position:relative;}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${badge}</div>
  <div class="main">${main.replace(/\n/g,'<br>')}</div>
  <div class="sub">${sub}</div>
  <div class="cta">${cta||'AICUT →'}</div>
</div></body></html>`;

  const tmpFile = path.join(__dirname, '..', '_tmp_gen.html');
  fs.writeFileSync(tmpFile, html);
  const ctx = browser.contexts()[0];
  const p = await ctx.newPage();
  await p.setViewportSize({width:T.w, height:T.h});
  await p.goto('file:///'+tmpFile.replace(/\\/g,'/'), {waitUntil:'networkidle', timeout:15000});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  const outPath = path.join(__dirname, '..', outFile);
  await p.screenshot({path:outPath, fullPage:false});
  const size = fs.statSync(outPath).size;
  await p.close();
  fs.unlinkSync(tmpFile);
  return {file:outFile, sizeKB:Math.round(size/1024)};
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  try {
    const images = [
      { tpl:'main',    badge:'☀️ 초복 트렌드 분석',   main:'초복에 삼계탕\n먹으면서 본 영상\n전부 <em>이 패턴</em>\n이었습니다',  sub:'초복 당일 인기 콘텐츠의\n공통점 3가지',  cta:'AICUT →',     out:'aicut_blog_chobok_main.png' },
      { tpl:'card',     badge:'🥶 패턴 1',              main:'<em>청량함</em>을\n파는 영상',       sub:'에이드·빙수·아이스크림\nASMR 영상 조회수 50만+',  cta:'',            out:'aicut_blog_chobok_card1.png' },
      { tpl:'cardDark', badge:'🔥 패턴 2',              main:'더위를\n<em>기록하는</em> 영상',      sub:'폭염 속 현장·에어컨 없이 버티기\n공감형 콘텐츠의 힘',      cta:'',            out:'aicut_blog_chobok_card2.png' },
      { tpl:'card',     badge:'🍜 패턴 3',              main:'<em>계절 한정</em>\n먹방 콘텐츠',       sub:'삼계탕·냉면·콩국수·팥빙수\n계절 메뉴 숏폼이 필요한 이유', cta:'',       out:'aicut_blog_chobok_card3.png' },
      { tpl:'ctaCard',  badge:'📩 상담받기',            main:'<em>숏폼 마케팅</em>\n지금 시작하세요',   sub:'초복부터 말복까지\n에이컷이 함께합니다',      cta:'무료상담 →',  out:'aicut_blog_chobok_cta.png' }
    ];

    for (const img of images) {
      console.log(`🖼️ ${img.out} (${img.tpl})...`);
      const r = await genOne(browser, img.tpl, img.badge, img.main, img.sub, img.cta, img.out);
      console.log(`✅ ${r.file} (${r.sizeKB}KB)`);
    }
    console.log('\n🎉 5장 모두 생성 완료!');
  } catch (err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await browser.disconnect();
    console.log('🔌 브라우저 연결 종료 (유지)');
  }
})();
