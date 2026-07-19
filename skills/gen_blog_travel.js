// 여행지 숏폼 촬영 꿀팁 — 이미지 5장 생성
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const W = 700, H = 700, CW = 600, CH = 338;

function render(opt) {
  const isMain = opt.type === 'main';
  const isCta = opt.type === 'cta';
  const iW = isMain ? W : CW;
  const iH = isMain ? H : CH;
  const pad = isMain ? 60 : 40;
  const mainFont = isMain ? 42 : 36;
  const badgeFont = isMain ? 16 : 14;
  const subFont = isMain ? 18 : 16;
  const ctaFont = isMain ? 20 : 18;
  const textColor = '#1a1a2e';
  const subColor = '#666680';

  let ctaHtml = '';
  if (isMain || isCta) {
    ctaHtml = '<div class="cta">' + (opt.cta || 'AICUT →') + '</div>';
  }

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'html,body{width:100%;height:100%;overflow:hidden;font-family:Noto Sans KR,Malgun Gothic,sans-serif;background:' + opt.bg + ';display:flex;align-items:center;justify-content:center;}' +
    '.card{width:' + iW + 'px;height:' + iH + 'px;overflow:hidden;background:' + opt.bg + ';display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:' + pad + 'px;position:relative;}' +
    '.card .glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.15) 0%,transparent 60%);width:' + Math.round(iW*0.64) + 'px;height:' + Math.round(iW*0.64) + 'px;top:50%;left:50%;transform:translate(-50%,-50%);}' +
    '.badge{background:' + opt.accent + ';color:#fff;padding:' + (isMain?'8px 24px':'6px 18px') + ';border-radius:20px;font-size:' + badgeFont + 'px;font-weight:700;margin-bottom:20px;letter-spacing:1px;z-index:2;position:relative;}' +
    '.main{color:' + textColor + ';font-size:' + mainFont + 'px;font-weight:900;line-height:1.3;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;}' +
    '.main em{color:' + opt.accent + ';font-style:normal;}' +
    '.sub{color:' + subColor + ';font-size:' + subFont + 'px;font-weight:400;line-height:1.5;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;margin-top:12px;}' +
    '.cta{background:linear-gradient(135deg,' + opt.accent + ',#7c3aed);color:#fff;font-size:' + ctaFont + 'px;font-weight:700;padding:' + (isMain?'14px 48px':'10px 36px') + ';border-radius:50px;display:inline-block;margin-top:20px;z-index:2;position:relative;}' +
    '</style></head><body>' +
    '<div class="card"><div class="glow"></div>' +
    '<div class="badge">' + opt.badge + '</div>' +
    '<div class="main">' + opt.main.replace(/\n/g, '<br>') + '</div>' +
    '<div class="sub">' + opt.sub + '</div>' + ctaHtml +
    '</div></body></html>';
}

async function main() {
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];

  const images = [
    {
      out: 'aicut_blog_travel_main.png', type: 'main',
      bg: 'linear-gradient(160deg, #e8f4f8, #d6ecf5, #c5e4f2)',
      accent: '#0284c7',
      badge: '\u2708\uFE0F 여행 숏폼 촬영',
      main: '제주도 가기 전에\n<em>숏폼 영상</em> 찍는 법\n알고 가세요',
      sub: '스마트폰 하나면 누구나\n프로처럼 찍는 꿀팁 4가지',
      cta: 'AICUT 무료상담 →',
    },
    {
      out: 'aicut_blog_travel_card1.png', type: 'card',
      bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)',
      accent: '#b8860b',
      badge: '\u23F0 첫째, 구도 잡기',
      main: '항공권 인증샷도\n<em>구도</em>가 반이다',
      sub: '제주공항·후쿠오카 공항\n도착부터 영상 시작하세요',
    },
    {
      out: 'aicut_blog_travel_card2.png', type: 'card',
      bg: 'linear-gradient(160deg, #e8f4f8, #d6ecf5, #c5e4f2)',
      accent: '#0284c7',
      badge: '\uD83C\uDF1F 둘째, 움직이는 숏폼',
      main: '맛집·호텔·카페\n<em>30초</em>로 압축하는 법',
      sub: '제주도맛집·제주도호텔·카페\n정적인 사진은 이제 그만',
    },
    {
      out: 'aicut_blog_travel_card3.png', type: 'card',
      bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)',
      accent: '#b8860b',
      badge: '\uD83C\uDFA5 셋째, 편집 꿀팁',
      main: '촬영은 5분\n<em>편집이</em> 퀄리티를 만든다',
      sub: '자막·BGM·색보정\n에이컷이 다 해드립니다',
    },
    {
      out: 'aicut_blog_travel_cta.png', type: 'cta',
      bg: 'linear-gradient(160deg, #e8f4f8, #d6ecf5, #c5e4f2)',
      accent: '#0284c7',
      badge: '\uD83D\uDCE9 지금 시작하세요',
      main: '촬영만 하면\n<em>에이컷</em>이 편집합니다',
      sub: '제주도·후쿠오카 여행 영상\n전문 에디터가 깔끔하게',
      cta: 'AICUT 무료상담 →',
    },
  ];

  for (const img of images) {
    const html = render(img);
    const tmpFile = path.join(__dirname, '..', '_tmp_' + img.out.replace('.png', '.html'));
    fs.writeFileSync(tmpFile, html);
    const iW = img.type === 'main' ? W : CW;
    const iH = img.type === 'main' ? H : CH;
    const p = await ctx.newPage();
    await p.setViewportSize({ width: iW, height: iH });
    await p.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(2000);
    const outPath = path.join(__dirname, '..', img.out);
    await p.screenshot({ path: outPath, fullPage: false });
    const size = fs.statSync(outPath).size;
    console.log('\u2705 ' + img.out + ' (' + Math.round(size/1024) + 'KB)');
    await p.close();
    fs.unlinkSync(tmpFile);
  }

  await b.close();
  console.log('\uD83C\uDF89 이미지 5장 생성 완료');
}

main().catch(e => { console.error('\u274C', e.message); process.exit(1); });
