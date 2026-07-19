const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const IMG_DIR = __dirname;
const CARDS = [
  {
    badge: '📜 제헌절 특집',
    main: '2026 제헌절,<br>19년 만의 <em>공휴일</em><br>3일 연휴 즐기기',
    sub: '7월 17일 금요일, 가족·연인과 함께하는\n서울 행사·축제 총정리',
    cta: 'AICUT 자세히 보기 →',
    theme: 'dark_purple'
  },
  {
    badge: '🎶 7/17 당일 무료',
    main: '사운드나루@서울<br><em>한일 뮤지션</em><br>쇼케이스',
    sub: '서교스퀘어 18:00~20:00, 무료 입장\n데이트 코스로 제격!',
    cta: '',
    theme: 'light_warm'
  },
  {
    badge: '🏛️ 광화문 미디어아트',
    main: '헌법 전문(前文)<br><em>미디어아트</em>로<br>만나다',
    sub: '광화문스퀘어 전광판 상영\n제헌절 의미 되새기기 좋은 장소',
    cta: '',
    theme: 'light_warm'
  },
  {
    badge: '🏖️ 7월 서울 축제',
    main: '서울썸머비치 · DDP<br><em>여름 축제</em><br>총정리',
    sub: '광화문·DDP·성북구까지\n7월 주말 나들이 필수 코스',
    cta: '',
    theme: 'dark_purple'
  },
  {
    badge: '🎥 추억은 영상으로',
    main: '소중한 연휴,<br><em>영상 편집</em>으로<br>간직하세요',
    sub: '에이컷이 숏폼부터 롱폼까지\n맞춤 제작해드립니다',
    cta: 'AICUT 무료상담 →',
    theme: 'dark_green'
  }
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  const THEMES = {
    dark_purple: { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow:'rgba(92,61,232,0.5)', tc:'#fff', accent:'#a78bfa', sub:'rgba(255,255,255,0.6)', bbg:'rgba(167,139,250,0.15)', bco:'#a78bfa', bbo:'rgba(167,139,250,0.3)', cf:'#5c3de8', ct:'#7c5cf6' },
    light_warm: { bg:'linear-gradient(160deg,#fef9f0,#f8f4ec,#fdf2f8)', glow:'rgba(124,58,237,0.2)', tc:'#1e1b2e', accent:'#7c3aed', sub:'rgba(30,27,46,0.5)', bbg:'rgba(124,58,237,0.08)', bco:'#7c3aed', bbo:'rgba(124,58,237,0.2)', cf:'#7c3aed', ct:'#a78bfa' },
    dark_green: { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#064e3b)', glow:'rgba(52,211,153,0.35)', tc:'#fff', accent:'#34d399', sub:'rgba(255,255,255,0.6)', bbg:'rgba(52,211,153,0.15)', bco:'#34d399', bbo:'rgba(52,211,153,0.3)', cf:'#059669', ct:'#34d399' },
  };
  
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const T = THEMES[card.theme] || THEMES.dark_purple;
    const name = `insta_constitution_${i+1}.png`;
    const ctaHtml = card.cta ? `<div class="cta">${card.cta}</div>` : '';
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:1080px;height:1080px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;
        background:${T.bg};display:flex;justify-content:center;align-items:center}
      .card{width:1080px;height:1080px;position:relative;overflow:hidden;display:flex;flex-direction:column;
        justify-content:center;align-items:center;text-align:center;padding:80px}
      .glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);
        width:691px;height:691px;top:50%;left:50%;transform:translate(-50%,-50%)}
      .badge{display:inline-block;background:${T.bbg};color:${T.bco};
        font-size:20px;font-weight:700;padding:10px 28px;
        border:1px solid ${T.bbo};border-radius:30px;margin-bottom:32px;z-index:2;position:relative}
      .main{color:${T.tc};font-size:52px;font-weight:800;line-height:1.4;z-index:2;position:relative;
        margin-bottom:20px;word-break:keep-all;letter-spacing:-1px}
      .main em{color:${T.accent};font-style:normal}
      .sub{color:${T.sub};font-size:22px;font-weight:500;line-height:1.5;white-space:pre-line;z-index:2;position:relative;margin-bottom:36px}
      .cta{background:linear-gradient(135deg,${T.cf},${T.ct});color:#fff;font-size:22px;
        font-weight:700;padding:16px 52px;border-radius:50px;z-index:2;position:relative;display:inline-block}
    </style></head><body><div class="card">
      <div class="glow"></div>
      <div class="badge">${card.badge}</div>
      <div class="main">${card.main}</div>
      <div class="sub">${card.sub}</div>
      ${ctaHtml}
    </div></body></html>`;
    
    const tmpFile = path.join(IMG_DIR, '_tmp_gen.html');
    fs.writeFileSync(tmpFile, html);
    
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1080, height: 1080 });
    await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(IMG_DIR, name), fullPage: false });
    await page.close();
    fs.unlinkSync(tmpFile);
    console.log(`✅ ${i+1}/${CARDS.length} ${name}`);
  }
  
  console.log('\n✅ 인스타 카드 5장 생성 완료!');
  console.log('파일 목록:');
  CARDS.forEach((_, i) => console.log(`   insta_constitution_${i+1}.png`));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
