const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'blog_images');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

// ── 한글 폰트 등록
registerFont('C:\\Windows\\Fonts\\NotoSansKR-VF.ttf', { family: 'NotoKR', weight: '400' });
registerFont('C:\\Windows\\Fonts\\malgun.ttf',   { family: 'Malgun', weight: '400' });
registerFont('C:\\Windows\\Fonts\\malgunbd.ttf', { family: 'Malgun', weight: '700' });
registerFont('C:\\Windows\\Fonts\\malgunsl.ttf', { family: 'Malgun', weight: '300' });

function save(canvas, name) {
  fs.writeFileSync(path.join(OUT, name), canvas.toBuffer('image/png'));
  console.log('✓', name);
}

// ── 원본 실측 스펙
const W = 800, H = 500;
const BG   = '#0F0F1E';
const CYN  = '#00D4FF';
const PNL  = 140;

// 폰트 헬퍼 (NotoKR 기반)
const F = {
  tag:     '400 15px "Malgun"',
  sub:     '400 17px "Malgun"',
  kpiNum:  'bold 34px "Malgun"',
  kpiLbl:  '400 13px "Malgun"',
  card:    'bold 15px "Malgun"',
  cardSub: '400 12px "Malgun"',
  brand:   '400 12px "Malgun"',
  badge:   'bold 12px "Malgun"',
  row:     'bold 16px "Malgun"',
  rowSub:  '400 13px "Malgun"',
};

function titleFont(size) { return `bold ${size}px "Malgun"`; }

function drawBase(ctx) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const g = ctx.createLinearGradient(W - PNL, 0, W - PNL, H);
  g.addColorStop(0,   '#7B5EA7');
  g.addColorStop(0.5, '#6055C8');
  g.addColorStop(1,   '#38BFFF');
  ctx.fillStyle = g;
  ctx.fillRect(W - PNL, 0, PNL, H);

  // CASE STUDY 세로 텍스트
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.60)';
  ctx.font = '400 11px "Malgun"';
  ctx.translate(W - 20, H * 0.68);
  ctx.rotate(-Math.PI / 2);
  const cs = 'CASE STUDY';
  let cx2 = 0;
  for (const ch of cs) {
    ctx.fillText(ch, cx2, 0);
    cx2 += ctx.measureText(ch).width + 3.2;
  }
  ctx.restore();
}

function drawTagBadge(ctx, text, x, y) {
  const pW = W - PNL - x - 20;
  const pH = 38, R = 19;
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x+R, y); ctx.lineTo(x+pW-R, y);
  ctx.arcTo(x+pW, y, x+pW, y+R, R);
  ctx.lineTo(x+pW, y+pH-R);
  ctx.arcTo(x+pW, y+pH, x+pW-R, y+pH, R);
  ctx.lineTo(x+R, y+pH);
  ctx.arcTo(x, y+pH, x, y+pH-R, R);
  ctx.lineTo(x, y+R);
  ctx.arcTo(x, y, x+R, y, R);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = CYN;
  ctx.beginPath(); ctx.arc(x+20, y+pH/2, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = F.tag;
  ctx.fillText(text, x+32, y+25);
}

function drawAccentLine(ctx, x, y) {
  ctx.strokeStyle = CYN; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+48, y); ctx.stroke();
}

function drawTitle(ctx, lines, accentLine, startY, size=50) {
  ctx.font = titleFont(size);
  lines.forEach((line, i) => {
    ctx.fillStyle = (i === accentLine) ? CYN : '#FFFFFF';
    ctx.fillText(line, 44, startY + i * (size * 1.2));
  });
}

function drawSub(ctx, lines, startY) {
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.font = F.sub;
  lines.forEach((l, i) => ctx.fillText(l, 44, startY + i * 28));
}

function drawKpiCard(ctx, x, y, num, label) {
  const CW = 108, CH = 80, R = 12;
  ctx.fillStyle = '#1E1E38';
  ctx.beginPath();
  ctx.moveTo(x+R,y); ctx.lineTo(x+CW-R,y);
  ctx.arcTo(x+CW,y,x+CW,y+R,R); ctx.lineTo(x+CW,y+CH-R);
  ctx.arcTo(x+CW,y+CH,x+CW-R,y+CH,R); ctx.lineTo(x+R,y+CH);
  ctx.arcTo(x,y+CH,x,y+CH-R,R); ctx.lineTo(x,y+R);
  ctx.arcTo(x,y,x+R,y,R); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#FFFFFF'; ctx.font = F.kpiNum;
  ctx.textAlign = 'center'; ctx.fillText(num, x+CW/2, y+46);
  ctx.fillStyle = 'rgba(255,255,255,0.60)'; ctx.font = F.kpiLbl;
  ctx.fillText(label, x+CW/2, y+68); ctx.textAlign = 'left';
}

function drawBrand(ctx) {
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = F.brand; ctx.fillText('AICUT.CO.KR', 44, H-18);
}

// ── IMAGE 1: Summary
{
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBase(ctx);
  drawTagBadge(ctx, '고객사례  02', 44, 40);
  drawAccentLine(ctx, 44, 94);
  drawTitle(ctx, ['매달 바뀌던 편집자,', '이커머스 쇼핑몰이', '선택한 방법'], 2, 150, 48);
  drawSub(ctx, ['B사 → 에이컷 전환 후', '2개월 만에 달라진 것들'], 302);
  const kpis = [{ n:'10편', l:'월 발행' }, { n:'2일', l:'리드타임' }, { n:'1h', l:'편집 업무' }];
  kpis.forEach((k, i) => drawKpiCard(ctx, 44+i*122, 364, k.n, k.l));
  drawBrand(ctx);
  save(canvas, '01_summary.png');
}

// ── IMAGE 2: 문제 상황
{
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBase(ctx);
  drawTagBadge(ctx, '이런 상황이었어요', 44, 40);
  drawAccentLine(ctx, 44, 94);
  drawTitle(ctx, ['매달 반복되던', '3가지 문제'], 1, 150, 48);

  const probs = [
    { icon:'🔄', title:'매달 새 편집자 탐색', desc:'다음 달엔 없음 · 예산 예측 불가' },
    { icon:'🎨', title:'브랜드 톤 제각각',   desc:'영상마다 색감·자막 달라짐' },
    { icon:'⏰', title:'납기 지연 → 캠페인 붕괴', desc:'7일 지연 · 광고 예산 낭비' },
  ];
  probs.forEach((p, i) => {
    const cx=44+i*202, cy=306, CW=186, CH=150, R=12;
    ctx.fillStyle='#1E1E38';
    ctx.beginPath();
    ctx.moveTo(cx+R,cy); ctx.lineTo(cx+CW-R,cy);
    ctx.arcTo(cx+CW,cy,cx+CW,cy+R,R); ctx.lineTo(cx+CW,cy+CH-R);
    ctx.arcTo(cx+CW,cy+CH,cx+CW-R,cy+CH,R); ctx.lineTo(cx+R,cy+CH);
    ctx.arcTo(cx,cy+CH,cx,cy+CH-R,R); ctx.lineTo(cx,cy+R);
    ctx.arcTo(cx,cy,cx+R,cy,R); ctx.closePath(); ctx.fill();
    ctx.fillStyle=CYN; ctx.fillRect(cx, cy, CW, 4);

    ctx.font='24px "Malgun"'; ctx.fillText(p.icon, cx+14, cy+44);
    ctx.fillStyle='#FFFFFF'; ctx.font=F.card; ctx.fillText(p.title, cx+14, cy+80);
    ctx.fillStyle='rgba(255,255,255,0.58)'; ctx.font=F.cardSub; ctx.fillText(p.desc, cx+14, cy+104);
  });
  drawBrand(ctx);
  save(canvas, '02_problem.png');
}

// ── IMAGE 3: 에이컷 선택 이유
{
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBase(ctx);
  drawTagBadge(ctx, '에이컷을 알게 된 계기', 44, 40);
  drawAccentLine(ctx, 44, 94);
  drawTitle(ctx, ['"영상편집 월정액" 검색', '→  에이컷 발견'], 1, 150, 46);

  const reasons = [
    { n:'01', t:'전담 에디터 고정 배정',     d:'매달 같은 에디터 · 브랜드 가이드 학습' },
    { n:'02', t:'브랜드 가이드 저장 시스템', d:'한 번 설정 → 이후 영상 자동 반영' },
    { n:'03', t:'이커머스 전담 포트폴리오',  d:'숏폼/롱폼 분리팀 · 상품영상 전문' },
  ];
  reasons.forEach((r, i) => {
    const ry=308+i*62, RW=W-PNL-88, RH=52, RR=10;
    ctx.fillStyle='#1E1E38';
    ctx.beginPath();
    ctx.moveTo(44+RR,ry); ctx.lineTo(44+RW-RR,ry);
    ctx.arcTo(44+RW,ry,44+RW,ry+RR,RR); ctx.lineTo(44+RW,ry+RH-RR);
    ctx.arcTo(44+RW,ry+RH,44+RW-RR,ry+RH,RR); ctx.lineTo(44+RR,ry+RH);
    ctx.arcTo(44,ry+RH,44,ry+RH-RR,RR); ctx.lineTo(44,ry+RR);
    ctx.arcTo(44,ry,44+RR,ry,RR); ctx.closePath(); ctx.fill();

    ctx.fillStyle=CYN;
    ctx.beginPath(); ctx.arc(76, ry+26, 13, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle=BG; ctx.font=F.badge;
    ctx.textAlign='center'; ctx.fillText(r.n, 76, ry+30); ctx.textAlign='left';

    ctx.fillStyle='#FFFFFF'; ctx.font=F.row; ctx.fillText(r.t, 100, ry+22);
    ctx.fillStyle='rgba(255,255,255,0.58)'; ctx.font=F.rowSub; ctx.fillText(r.d, 100, ry+42);
  });
  drawBrand(ctx);
  save(canvas, '03_reason.png');
}

// ── IMAGE 4: 도입 후 결과
{
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBase(ctx);
  drawTagBadge(ctx, '도입 첫 달, 달라진 것들', 44, 40);
  drawAccentLine(ctx, 44, 94);
  drawTitle(ctx, ['에이컷 도입 2개월,', '숫자로 증명한 결과'], 1, 150, 46);

  const kpis2 = [
    { n:'10편', l:'월 발행',  s:'3~4편 → 10편' },
    { n:'2일',  l:'리드타임', s:'9일 → 2일' },
    { n:'0건',  l:'납기 지연', s:'2개월 연속' },
  ];
  kpis2.forEach((k, i) => {
    const kx=44+i*192, ky=318, KW=174, KH=130, R=14;
    ctx.fillStyle='#1E1E38';
    ctx.beginPath();
    ctx.moveTo(kx+R,ky); ctx.lineTo(kx+KW-R,ky);
    ctx.arcTo(kx+KW,ky,kx+KW,ky+R,R); ctx.lineTo(kx+KW,ky+KH-R);
    ctx.arcTo(kx+KW,ky+KH,kx+KW-R,ky+KH,R); ctx.lineTo(kx+R,ky+KH);
    ctx.arcTo(kx,ky+KH,kx,ky+KH-R,R); ctx.lineTo(kx,ky+R);
    ctx.arcTo(kx,ky,kx+R,ky,R); ctx.closePath(); ctx.fill();

    ctx.fillStyle=CYN; ctx.font=`bold 44px "Malgun"`;
    ctx.textAlign='center'; ctx.fillText(k.n, kx+KW/2, ky+66);
    ctx.fillStyle='#FFFFFF'; ctx.font=`bold 14px "Malgun"`;
    ctx.fillText(k.l, kx+KW/2, ky+96);
    ctx.fillStyle='rgba(255,255,255,0.48)'; ctx.font=`400 11px "Malgun"`;
    ctx.fillText(k.s, kx+KW/2, ky+116); ctx.textAlign='left';
  });
  drawBrand(ctx);
  save(canvas, '04_result.png');
}

// ── IMAGE 5: CTA
{
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBase(ctx);

  const gGlow = ctx.createRadialGradient(W*0.40,H*0.45,0,W*0.40,H*0.45,240);
  gGlow.addColorStop(0,'rgba(0,212,255,0.12)'); gGlow.addColorStop(1,'rgba(0,212,255,0)');
  ctx.fillStyle=gGlow; ctx.fillRect(0,0,W,H);

  ctx.strokeStyle=CYN; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W-PNL,0); ctx.stroke();

  const CX=(W-PNL)/2;
  ctx.fillStyle='rgba(255,255,255,0.52)'; ctx.font=`400 15px "Malgun"`;
  ctx.textAlign='center'; ctx.fillText('같은 고민을 하고 계신가요?', CX, 76);

  ctx.fillStyle='#FFFFFF'; ctx.font=`bold 44px "Malgun"`;
  ctx.fillText('에이컷 무료 상담 신청', CX, 144);

  ctx.fillStyle='rgba(255,255,255,0.58)'; ctx.font=`400 16px "Malgun"`;
  ctx.fillText('업종·월 제작량 맞춤 플랜 · 전담 매니저 직접 안내', CX, 188);

  const BW=300, BH=56, BR=28, BX=CX-BW/2, BY=212;
  const gBtn=ctx.createLinearGradient(BX,BY,BX+BW,BY);
  gBtn.addColorStop(0,CYN); gBtn.addColorStop(1,'#6055C8');
  ctx.fillStyle=gBtn;
  ctx.beginPath();
  ctx.moveTo(BX+BR,BY); ctx.lineTo(BX+BW-BR,BY);
  ctx.arcTo(BX+BW,BY,BX+BW,BY+BR,BR); ctx.lineTo(BX+BW,BY+BH-BR);
  ctx.arcTo(BX+BW,BY+BH,BX+BW-BR,BY+BH,BR); ctx.lineTo(BX+BR,BY+BH);
  ctx.arcTo(BX,BY+BH,BX,BY+BH-BR,BR); ctx.lineTo(BX,BY+BR);
  ctx.arcTo(BX,BY,BX+BR,BY,BR); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#FFFFFF'; ctx.font=`bold 17px "Malgun"`;
  ctx.fillText('aicut.co.kr  무료상담 신청', CX, BY+34);

  const badges=['재계약률 92%','납기 준수 100%','만족도 4.9점'];
  const totalBW=badges.length*160+(badges.length-1)*12;
  const bsx=CX-totalBW/2;
  badges.forEach((b,i) => {
    const bx=bsx+i*172, by=298;
    ctx.fillStyle='#1E1E38';
    ctx.beginPath();
    ctx.moveTo(bx+8,by); ctx.lineTo(bx+152,by);
    ctx.arcTo(bx+160,by,bx+160,by+8,8); ctx.lineTo(bx+160,by+40);
    ctx.arcTo(bx+160,by+48,bx+152,by+48,8); ctx.lineTo(bx+8,by+48);
    ctx.arcTo(bx,by+48,bx,by+40,8); ctx.lineTo(bx,by+8);
    ctx.arcTo(bx,by,bx+8,by,8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.16)'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.72)'; ctx.font=`400 13px "Malgun"`;
    ctx.fillText(b, bx+22, by+28);
  });

  ctx.textAlign='left';
  drawBrand(ctx);
  ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.font=`400 11px "Malgun"`;
  ctx.fillText('서울시 송파구 법원로 8길 8  SKV1 2차 1118호', 44, H-6);

  save(canvas, '05_cta.png');
}

console.log('\n✅ 완료');
