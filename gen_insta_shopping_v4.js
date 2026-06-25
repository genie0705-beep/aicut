/**
 * gen_insta_shopping_v4.js — 최종 비율 정리
 * 1080px 세로 균등 5구역으로 분할
 */
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

try {
  registerFont('C:\\Windows\\Fonts\\malgunbd.ttf', { family: 'MG', weight: 'bold' });
  registerFont('C:\\Windows\\Fonts\\malgun.ttf',   { family: 'MG', weight: 'normal' });
} catch(e) {}

const F = 'MG';
const W = 1080, H = 1080;
const PAD = 64;

function hex(h, a=1) {
  const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function roundRect(ctx,x,y,w,h,r,fill,gradient) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  if(gradient){ ctx.fillStyle=gradient; ctx.fill(); }
  else if(fill){ ctx.fillStyle=fill; ctx.fill(); }
}
function tight(ctx, text, x, y, sp=-4) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + sp;
  }
}

const cv = createCanvas(W, H);
const ctx = cv.getContext('2d');

// ── 배경 ──
ctx.fillStyle = '#ECEEFF'; ctx.fillRect(0,0,W,H);

// 상단 바 (8px)
const tg = ctx.createLinearGradient(0,0,W,0);
tg.addColorStop(0,'#8B6FFF'); tg.addColorStop(1,'#FF6EB4');
ctx.fillStyle=tg; ctx.fillRect(0,0,W,8);

// ━━━ 구역 정의 ━━━
// 태그:    y=24
// 헤드라인: y=90 ~ 310  (72px × 3줄, 줄간격 76)
// 구분:    y=326 (언더라인)
// 체크:    y=360 ~ 520  (3줄, 줄간격 80)
// 박스:    y=558 ~ 918  (360px)
// 브랜드:  y=952

// ── 1. 태그 pill ──
ctx.font = `bold 26px "${F}"`;
const tagTxt = '🛒 쇼핑몰 마케팅';
const tagW = (() => { let w=0; for(const ch of tagTxt) w+=ctx.measureText(ch).width; return w; })();
roundRect(ctx, PAD, 22, tagW+44, 44, 22, '#6B4FEE');
ctx.fillStyle='#FFFFFF'; ctx.fillText(tagTxt, PAD+22, 54);

// ── 2. 헤드라인 ──
ctx.font = `bold 76px "${F}"`;
ctx.fillStyle = '#111111';
tight(ctx, '쇼핑몰 영상,', PAD, 152, -5);
tight(ctx, '월 20편 올리는', PAD, 228, -5);
tight(ctx, '팀의 비밀', PAD, 304, -5);

// 언더라인
ctx.fillStyle='#6B4FEE'; ctx.fillRect(PAD, 322, 56, 5);

// ── 3. 체크리스트 ──
const items = [
  { bold:'전담 에디터', rest:' — 매달 교체 없음' },
  { bold:'브랜드 톤 고정', rest:' — 한 번 설정으로 끝' },
  { bold:'48시간 납품', rest:' — 시즌 캠페인도 OK' },
];
const CY = 376;
const CLH = 72;
items.forEach((it,i)=>{
  const y = CY + i*CLH;
  // 체크박스
  roundRect(ctx, PAD, y-24, 34, 34, 6, '#6B4FEE');
  ctx.font=`bold 18px "${F}"`; ctx.fillStyle='#FFFFFF';
  ctx.textAlign='center'; ctx.fillText('✓', PAD+17, y-2); ctx.textAlign='left';
  // bold
  ctx.font=`bold 34px "${F}"`; ctx.fillStyle='#111111';
  let bx=PAD+48, bw=0;
  for(const ch of it.bold){ ctx.fillText(ch,bx+bw,y); bw+=ctx.measureText(ch).width-2; }
  // regular
  ctx.font=`30px "${F}"`; ctx.fillStyle='#555555';
  ctx.fillText(it.rest, bx+bw, y);
});

// ── 4. 정보박스 (y=560 ~ 900, 340px) ──
const BY=558, BH=H-BY-70;
roundRect(ctx, PAD, BY, W-PAD*2, BH, 18, '#E8EAFF');

// 박스 내 아이콘
ctx.font=`40px "${F}"`; ctx.fillStyle='#6B4FEE';
ctx.textAlign='center'; ctx.fillText('💡', W/2, BY+68); ctx.textAlign='left';

ctx.font=`bold 32px "${F}"`; ctx.fillStyle='#6B4FEE';
ctx.textAlign='center';
const infoLines = ['소스만 넘기면 전담팀이 처리합니다.', '채용 없이 바로 시작 가능해요.'];
infoLines.forEach((line, i) => {
  ctx.fillText(line, W/2, BY+122 + i*50);
});
ctx.textAlign='left';

// CTA 버튼 (박스 내 하단)
const BTN_Y = BY + BH - 78;
const cg = ctx.createLinearGradient(PAD+20, 0, W-PAD-20, 0);
cg.addColorStop(0,'#8B6FFF'); cg.addColorStop(1,'#FF6EB4');
roundRect(ctx, PAD+20, BTN_Y, W-PAD*2-40, 58, 29, null, cg);
ctx.font=`bold 28px "${F}"`; ctx.fillStyle='#FFFFFF';
ctx.textAlign='center'; ctx.fillText('무료 상담 → aicut.co.kr', W/2, BTN_Y+36); ctx.textAlign='left';

// ── 5. 브랜드 워터마크 ──
ctx.fillStyle='#6B4FEE';
ctx.beginPath(); ctx.arc(PAD+12, H-36, 14, 0, Math.PI*2); ctx.fill();
ctx.font=`bold 18px "${F}"`; ctx.fillStyle='#FFFFFF';
ctx.textAlign='center'; ctx.fillText('A', PAD+12, H-30); ctx.textAlign='left';
ctx.font=`24px "${F}"`; ctx.fillStyle='#555555';
ctx.fillText('aicut.co.kr', PAD+34, H-30);
ctx.font=`22px "${F}"`; ctx.fillStyle=hex('#555555',0.4);
ctx.textAlign='right'; ctx.fillText('01', W-PAD, H-30); ctx.textAlign='left';

const fp = path.join(__dirname,'insta_cards','card6_shopping.png');
fs.writeFileSync(fp, cv.toBuffer('image/png'));
console.log('✅ 저장 완료');
