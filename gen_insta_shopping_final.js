/**
 * gen_insta_shopping_final.js — 최종본
 * 박스 없이 5구역 균등 배분, 자간 최소화
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
const PAD = 68;

function hex(h, a=1) {
  const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function rr(ctx,x,y,w,h,r,fill) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
}

const cv = createCanvas(W,H);
const ctx = cv.getContext('2d');

// 배경
ctx.fillStyle='#ECEEFF'; ctx.fillRect(0,0,W,H);

// 상단 그라디언트 바
const tg=ctx.createLinearGradient(0,0,W,0);
tg.addColorStop(0,'#8B6FFF'); tg.addColorStop(1,'#FF6EB4');
ctx.fillStyle=tg; ctx.fillRect(0,0,W,10);

// ─────────────────────────────────────
// 구역 배분 (총 1080px)
// 상단바:   10px
// 태그:     y=28, h=44  → 끝 72
// 여백:     28px
// 헤드라인: y=100, 3줄×80px = 240 → 끝 340
// 언더라인: y=352, h=5   → 끝 357
// 여백:     28px
// 체크3개:  y=385, 3줄×72 = 216 → 끝 601
// 여백:     32px
// 구분선:   y=633
// 여백:     28px
// 서브카피: y=661, 2줄×52 = 104 → 끝 765
// 여백:     28px
// CTA버튼:  y=793, h=62  → 끝 855
// 여백:     (855~1040=185 / 2 = 92)
// 브랜드:   y=1048
// ─────────────────────────────────────

// 1. 태그
ctx.font=`bold 26px "${F}"`;
const tTxt='🛒 쇼핑몰 마케팅';
const tW=ctx.measureText(tTxt).width;
rr(ctx,PAD,28,tW+44,44,22,'#6B4FEE');
ctx.fillStyle='#FFFFFF'; ctx.fillText(tTxt,PAD+22,60);

// 2. 헤드라인 (70px, 태그 아래 y=104부터)
ctx.font=`bold 70px "${F}"`;
ctx.fillStyle='#111111';
[['쇼핑몰 영상,',116],['월 20편 올리는',196],['팀의 비밀',276]].forEach(([txt,y])=>{
  ctx.fillText(txt, PAD, y);
});

// 언더라인
ctx.fillStyle='#6B4FEE'; ctx.fillRect(PAD,290,56,5);

// 3. 체크리스트
const checks=[
  {b:'전담 에디터', r:' — 매달 교체 없음'},
  {b:'브랜드 톤 고정', r:' — 한 번 설정으로 끝'},
  {b:'48시간 납품', r:' — 시즌 캠페인도 OK'},
];
const CY=320, CLH=76;
checks.forEach((c,i)=>{
  const y=CY+i*CLH;
  rr(ctx,PAD,y-24,32,32,6,'#6B4FEE');
  ctx.font=`bold 18px "${F}"`; ctx.fillStyle='#FFFFFF';
  ctx.textAlign='center'; ctx.fillText('✓',PAD+16,y-3); ctx.textAlign='left';
  ctx.font=`bold 34px "${F}"`; ctx.fillStyle='#111111';
  ctx.fillText(c.b, PAD+46, y);
  const bw=ctx.measureText(c.b).width;
  ctx.font=`30px "${F}"`; ctx.fillStyle='#666666';
  ctx.fillText(c.r, PAD+46+bw, y);
});

// 4. 구분선
const DY=CY+CLH*3+20;
ctx.strokeStyle=hex('#6B4FEE',0.2); ctx.lineWidth=1;
ctx.beginPath(); ctx.moveTo(PAD,DY); ctx.lineTo(W-PAD,DY); ctx.stroke();

// 5. 서브 카피
const SY=DY+52;
ctx.font=`bold 36px "${F}"`; ctx.fillStyle='#5548C8';
ctx.textAlign='center';
ctx.fillText('소스만 넘기면 전담팀이 처리합니다.', W/2, SY);
ctx.font=`34px "${F}"`; ctx.fillStyle='#7B6FD0';
ctx.fillText('채용 없이 바로 시작 가능해요.', W/2, SY+50);
ctx.textAlign='left';

// 6. CTA 버튼
const BTN_Y=SY+104;
const cg=ctx.createLinearGradient(PAD,0,W-PAD,0);
cg.addColorStop(0,'#8B6FFF'); cg.addColorStop(1,'#FF6EB4');
rr(ctx,PAD,BTN_Y,W-PAD*2,62,31,null);
ctx.fillStyle=cg; ctx.fill();
ctx.font=`bold 30px "${F}"`; ctx.fillStyle='#FFFFFF';
ctx.textAlign='center'; ctx.fillText('무료 상담 → aicut.co.kr',W/2,BTN_Y+38); ctx.textAlign='left';

// 7. 브랜드
ctx.fillStyle='#6B4FEE';
ctx.beginPath(); ctx.arc(PAD+12,H-38,14,0,Math.PI*2); ctx.fill();
ctx.font=`bold 18px "${F}"`; ctx.fillStyle='#FFFFFF';
ctx.textAlign='center'; ctx.fillText('A',PAD+12,H-32); ctx.textAlign='left';
ctx.font=`24px "${F}"`; ctx.fillStyle='#555';
ctx.fillText('aicut.co.kr',PAD+34,H-32);
ctx.font=`22px "${F}"`; ctx.fillStyle=hex('#555',0.4);
ctx.textAlign='right'; ctx.fillText('01',W-PAD,H-32); ctx.textAlign='left';

const fp=path.join(__dirname,'insta_cards','card6_shopping.png');
fs.writeFileSync(fp, cv.toBuffer('image/png'));
console.log('✅ 저장 완료');
