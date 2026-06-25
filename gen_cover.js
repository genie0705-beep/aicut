const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'blog_images');

registerFont('C:\\Windows\\Fonts\\malgun.ttf',   { family: 'Malgun', weight: '400' });
registerFont('C:\\Windows\\Fonts\\malgunbd.ttf', { family: 'Malgun', weight: '700' });

function save(canvas, name) {
  fs.writeFileSync(path.join(OUT, name), canvas.toBuffer('image/png'));
  console.log('✓', name, canvas.width + 'x' + canvas.height);
}

const W = 966, H = 966;
const BG  = '#0F0F1E';
const CYN = '#00D4FF';
const PNL = 180;
const TX  = 64;  // 왼쪽 여백

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 배경
ctx.fillStyle = BG;
ctx.fillRect(0, 0, W, H);

// 우측 그라디언트 패널
const g = ctx.createLinearGradient(W-PNL, 0, W-PNL, H);
g.addColorStop(0, '#7B5EA7'); g.addColorStop(0.5, '#6055C8'); g.addColorStop(1, '#38BFFF');
ctx.fillStyle = g; ctx.fillRect(W-PNL, 0, PNL, H);

// CASE STUDY 세로 텍스트
ctx.save();
ctx.fillStyle = 'rgba(255,255,255,0.60)';
ctx.font = '400 13px "Malgun"';
ctx.translate(W-26, H*0.65); ctx.rotate(-Math.PI/2);
let cx2=0;
for (const ch of 'CASE STUDY') { ctx.fillText(ch, cx2, 0); cx2 += ctx.measureText(ch).width + 3.8; }
ctx.restore();

// ── 레이아웃: 세로 배치 계산
// 태그(46h) + 간격20 + 밑줄 + 간격20 + 타이틀3줄(68px × 1.2 = 82×3=246) + 간격28 + 서브2줄(21px×2+8=50) + 간격40 + KPI(108h) + 간격30 + brand(14px)
// 총: 46+20+12+20+246+28+50+40+108+30+14 = 614px
// 시작 Y: (966 - 614) / 2 = 176

const START_Y = 210;

// 1. 태그 배지 (y=START_Y)
const TH = 46, TR = 23;
const TW = W - PNL - TX - 20;
ctx.fillStyle = 'rgba(255,255,255,0.10)';
ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
rr(ctx, TX, START_Y, TW, TH, TR); ctx.fill();
rr(ctx, TX, START_Y, TW, TH, TR); ctx.stroke();
ctx.fillStyle = CYN;
ctx.beginPath(); ctx.arc(TX+22, START_Y+TH/2, 5, 0, Math.PI*2); ctx.fill();
ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.font = '400 17px "Malgun"';
ctx.fillText('고객사례  02', TX+36, START_Y+30);

// 2. 밑줄 (태그 아래 20px)
const LINE_Y = START_Y + TH + 20;
ctx.strokeStyle = CYN; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
ctx.beginPath(); ctx.moveTo(TX, LINE_Y); ctx.lineTo(TX+56, LINE_Y); ctx.stroke();

// 3. 타이틀 (밑줄 아래 58px부터, 베이스라인 기준)
const TITLE_Y = LINE_Y + 58;
ctx.font = 'bold 68px "Malgun"';
const lines = ['매달 바뀌던 편집자,', '이커머스 쇼핑몰이', '선택한 방법'];
lines.forEach((line, i) => {
  ctx.fillStyle = (i === 2) ? CYN : '#FFFFFF';
  ctx.fillText(line, TX, TITLE_Y + i * 84);
});

// 4. 서브텍스트 (타이틀 마지막줄 아래 30px)
const SUB_Y = TITLE_Y + 2 * 84 + 84 * 0.3 + 30;
ctx.fillStyle = 'rgba(255,255,255,0.62)'; ctx.font = '400 21px "Malgun"';
ctx.fillText('B사 → 에이컷 전환 후', TX, SUB_Y);
ctx.fillText('2개월 만에 달라진 것들', TX, SUB_Y + 34);

// 5. KPI 카드 (서브텍스트 아래 44px)
const KY = SUB_Y + 34 + 44;
const KW = 152, KH = 108, KR = 14;
[{ n:'10편', l:'월 발행' }, { n:'2일', l:'리드타임' }, { n:'1h', l:'편집 업무' }].forEach((k, i) => {
  const kx = TX + i * 168;
  ctx.fillStyle = '#1E1E38'; rr(ctx, kx, KY, KW, KH, KR); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 44px "Malgun"';
  ctx.textAlign = 'center'; ctx.fillText(k.n, kx+KW/2, KY+62);
  ctx.fillStyle = 'rgba(255,255,255,0.60)'; ctx.font = '400 16px "Malgun"';
  ctx.fillText(k.l, kx+KW/2, KY+90); ctx.textAlign = 'left';
});

// 6. 브랜드
ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '400 14px "Malgun"';
ctx.fillText('AICUT.CO.KR', TX, H-30);

save(canvas, '01_summary.png');
