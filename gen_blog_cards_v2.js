/**
 * gen_blog_cards_v2.js — 부동산 중개법인 블로그 카드 5장
 * 스타일: target_02_marketer / target_05_cta 기준
 */

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'blog_imgs');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

try {
  registerFont('C:\\Windows\\Fonts\\malgunbd.ttf', { family: 'MG', weight: 'bold' });
  registerFont('C:\\Windows\\Fonts\\malgun.ttf',   { family: 'MG', weight: 'normal' });
  console.log('폰트 등록 완료');
} catch(e) { console.warn('폰트 오류:', e.message); }

const F = 'MG';
const W = 1080, H = 1080;
const PAD = 72;

// ── 컬러 ──
const PURPLE     = '#6B4FEE';
const PURPLE_L   = '#9B8FFF';
const LAVENDER   = '#ECEEFF';
const LAVENDER_D = '#DDE0FF';
const DARK       = '#111111';
const GRAY       = '#555555';
const WHITE      = '#FFFFFF';
const GREEN_BOX  = '#E8F9F0';
const INFO_BOX   = '#E8EAFF';

function hex(h, a=1) {
  const r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke, sw=2) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=sw; ctx.stroke(); }
}

// 상단 퍼플 그라디언트 바
function drawTopBar(ctx) {
  const g = ctx.createLinearGradient(0,0,W,0);
  g.addColorStop(0,'#8B6FFF'); g.addColorStop(1,'#FF6EB4');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,14);
}

// 태그 pill
function drawTag(ctx, text, x, y) {
  ctx.font = `bold 30px "${F}"`;
  const tw = ctx.measureText(text).width;
  roundRect(ctx, x, y, tw+56, 52, 26, PURPLE);
  ctx.fillStyle = WHITE;
  ctx.fillText(text, x+28, y+37);
}

// aicut 브랜드 하단
function drawBrand(ctx, light=true) {
  // A 원형 로고
  ctx.fillStyle = PURPLE;
  ctx.beginPath(); ctx.arc(PAD+18, H-58, 18, 0, Math.PI*2); ctx.fill();
  ctx.font = `bold 22px "${F}"`;
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  ctx.fillText('A', PAD+18, H-51);
  ctx.textAlign = 'left';
  ctx.font = `28px "${F}"`;
  ctx.fillStyle = light ? GRAY : hex(WHITE,0.6);
  ctx.fillText('aicut.co.kr', PAD+46, H-50);
}

// ── 카드 1: Summary (라벤더 bg, target_02 스타일) ──
function card1() {
  const c = createCanvas(W,H); const ctx = c.getContext('2d');
  ctx.fillStyle = LAVENDER; ctx.fillRect(0,0,W,H);
  drawTopBar(ctx);

  drawTag(ctx, '🏠 고객사례 · 부동산 중개법인', PAD, 44);

  // 헤드라인
  ctx.font = `bold 92px "${F}"`;
  ctx.fillStyle = DARK;
  ctx.fillText('매물 영상,', PAD, 230);
  ctx.fillText('올리고 싶은', PAD, 340);
  ctx.fillText('만큼 올렸어요', PAD, 450);

  // 퍼플 언더라인
  ctx.fillStyle = PURPLE; ctx.fillRect(PAD, 480, 80, 6);

  // KPI 3개 — 체크 스타일
  const kpis = [
    { icon:'✅', text:'월 20편', sub:'정시 납품 달성' },
    { icon:'✅', text:'주 2시간', sub:'영상 업무로 단축' },
    { icon:'✅', text:'구독자 3배', sub:'채널 성장' },
  ];
  kpis.forEach((k, i) => {
    const y = 540 + i*82;
    ctx.font = `34px "${F}"`; ctx.fillStyle = DARK;
    ctx.fillText(k.icon, PAD, y);
    ctx.font = `bold 34px "${F}"`; ctx.fillStyle = DARK;
    ctx.fillText(k.text, PAD+56, y);
    ctx.font = `30px "${F}"`; ctx.fillStyle = GRAY;
    ctx.fillText(k.sub, PAD+56 + ctx.measureText(k.text+'  ').width, y);
  });

  // 하단 정보박스
  roundRect(ctx, PAD, 810, W-PAD*2, 180, 18, INFO_BOX);
  ctx.font = `bold 34px "${F}"`; ctx.fillStyle = PURPLE;
  ctx.fillText('소스만 넘기면 전담팀이 처리합니다.', PAD+32, 868);
  ctx.font = `bold 34px "${F}"`; ctx.fillStyle = PURPLE;
  ctx.fillText('채용 없이 바로 시작 가능해요.', PAD+32, 916);

  drawBrand(ctx, true);
  // 페이지 번호
  ctx.font = `28px "${F}"`; ctx.fillStyle = hex(GRAY,0.5);
  ctx.textAlign='right'; ctx.fillText('01 / 05', W-PAD, H-50); ctx.textAlign='left';

  return c;
}

// ── 카드 2: Problem (라벤더, 체크리스트) ──
function card2() {
  const c = createCanvas(W,H); const ctx = c.getContext('2d');
  ctx.fillStyle = LAVENDER; ctx.fillRect(0,0,W,H);
  drawTopBar(ctx);

  drawTag(ctx, '💬 이런 상황이었나요?', PAD, 44);

  ctx.font = `bold 86px "${F}"`; ctx.fillStyle = DARK;
  ctx.fillText('편집 때문에', PAD, 230);
  ctx.fillText('매달 지치고', PAD, 330);
  ctx.fillText('있지 않나요?', PAD, 430);

  ctx.fillStyle = PURPLE; ctx.fillRect(PAD, 458, 80, 6);

  const items = [
    { bold: '편집할 사람이 없다', rest: '— 기획은 되는데' },
    { bold: '매달 꾸준히', rest: '올려야 하는데 밀린다' },
    { bold: '채용은 부담스럽다', rest: '— 월 300만원+' },
  ];
  items.forEach((it, i) => {
    const y = 518 + i * 86;
    ctx.font = `34px "${F}"`; ctx.fillStyle = DARK;
    ctx.fillText('✅', PAD, y);
    const bw = (() => {
      ctx.font = `bold 34px "${F}"`;
      ctx.fillStyle = DARK;
      ctx.fillText(it.bold, PAD+56, y);
      return ctx.measureText(it.bold).width;
    })();
    ctx.font = `34px "${F}"`; ctx.fillStyle = GRAY;
    ctx.fillText('  ' + it.rest, PAD+56+bw, y);
  });

  roundRect(ctx, PAD, 790, W-PAD*2, 190, 18, INFO_BOX);
  ctx.font = `bold 34px "${F}"`; ctx.fillStyle = PURPLE;
  ctx.fillText('소스만 넘기면 전담팀이 처리합니다.', PAD+32, 850);
  ctx.font = `bold 34px "${F}"`; ctx.fillStyle = PURPLE;
  ctx.fillText('채용 없이 바로 시작 가능해요.', PAD+32, 900);

  drawBrand(ctx, true);
  ctx.font=`28px "${F}"`; ctx.fillStyle=hex(GRAY,0.5);
  ctx.textAlign='right'; ctx.fillText('02 / 05',W-PAD,H-50); ctx.textAlign='left';

  return c;
}

// ── 카드 3: Reason (그라디언트, target_05 스타일) ──
function card3() {
  const c = createCanvas(W,H); const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0,'#7B5EF6'); g.addColorStop(0.6,'#9B6BEF'); g.addColorStop(1,'#FF6EB4');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  // 이모지
  ctx.font=`90px "${F}"`; ctx.textAlign='center'; ctx.fillText('🏆', W/2, 180);

  ctx.font=`bold 82px "${F}"`; ctx.fillStyle=WHITE;
  ctx.fillText('에이컷을', W/2, 310);
  ctx.fillText('선택한 이유', W/2, 410);

  ctx.textAlign='left';
  const reasons = [
    '01  부동산 매물 포트폴리오 직접 확인',
    '02  자막 템플릿 온보딩 1회로 저장',
    '03  약정 없이 첫 달 테스트 가능',
  ];
  reasons.forEach((r,i) => {
    ctx.font=`38px "${F}"`; ctx.fillStyle=hex(WHITE,0.9);
    ctx.fillText(r, PAD, 530+i*82);
  });

  // 구분선
  ctx.strokeStyle=hex(WHITE,0.3); ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(PAD,780); ctx.lineTo(W-PAD,780); ctx.stroke();

  ctx.font=`bold 36px "${F}"`; ctx.fillStyle=hex(WHITE,0.75);
  ctx.textAlign='center';
  ctx.fillText('온보딩 한 번, 이후엔 원본만 업로드.', W/2, 840);
  ctx.font=`28px "${F}"`; ctx.fillStyle=hex(WHITE,0.5);
  ctx.fillText('aicut.co.kr', W/2, H-54);

  ctx.textAlign='left';
  return c;
}

// ── 카드 4: Result (라벤더, Before/After) ──
function card4() {
  const c = createCanvas(W,H); const ctx = c.getContext('2d');
  ctx.fillStyle = LAVENDER; ctx.fillRect(0,0,W,H);
  drawTopBar(ctx);

  drawTag(ctx, '📊 도입 후 달라진 것들', PAD, 44);

  ctx.font=`bold 80px "${F}"`; ctx.fillStyle=DARK;
  ctx.fillText('숫자로 보는', PAD, 220);
  ctx.fillText('변화', PAD, 318);
  ctx.fillStyle=PURPLE; ctx.fillRect(PAD,345,80,6);

  const rows = [
    { before:'월 5~6편 발행',      arrow:'→', after:'월 20편 정시 납품' },
    { before:'주 14시간 영상 업무', arrow:'→', after:'주 2시간으로 단축' },
    { before:'매달 편집자 교체',    arrow:'→', after:'전담 에디터 고정' },
    { before:'납품 6일 지연',       arrow:'→', after:'영업일 2~3일 납품' },
  ];
  rows.forEach((row,i) => {
    const y = 400 + i * 100;
    if(i%2===0) roundRect(ctx,PAD-10,y-38,W-PAD*2+20,80,10,hex(PURPLE,0.06));

    ctx.font=`32px "${F}"`; ctx.fillStyle=hex(GRAY,0.7);
    ctx.fillText(row.before, PAD, y+10);
    const bw = ctx.measureText(row.before).width;
    ctx.strokeStyle=hex(GRAY,0.5); ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(PAD,y-5); ctx.lineTo(PAD+bw,y-5); ctx.stroke();

    ctx.font=`bold 32px "${F}"`; ctx.fillStyle=PURPLE;
    ctx.fillText(row.arrow, PAD+bw+20, y+10);

    ctx.font=`bold 34px "${F}"`; ctx.fillStyle=DARK;
    ctx.fillText(row.after, PAD+bw+70, y+10);
  });

  // 하이라이트
  roundRect(ctx,PAD,830,W-PAD*2,120,16,INFO_BOX);
  ctx.font=`34px "${F}"`; ctx.fillStyle=DARK; ctx.textAlign='center';
  ctx.fillText('유튜브 구독자 도입 전 대비', W/2, 888);
  ctx.font=`bold 52px "${F}"`; ctx.fillStyle='#E84040';
  ctx.fillText('3배 성장', W/2, 940);
  ctx.textAlign='left';

  drawBrand(ctx,true);
  ctx.font=`28px "${F}"`; ctx.fillStyle=hex(GRAY,0.5);
  ctx.textAlign='right'; ctx.fillText('04 / 05',W-PAD,H-50); ctx.textAlign='left';

  return c;
}

// ── 카드 5: CTA (그라디언트, target_05 스타일) ──
function card5() {
  const c = createCanvas(W,H); const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0,'#7B5EF6'); g.addColorStop(0.55,'#A06EF0'); g.addColorStop(1,'#FF6EB4');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  ctx.textAlign='center';

  // 이모지
  ctx.font=`100px "${F}"`; ctx.fillText('🙋', W/2, 240);

  // 헤드라인
  ctx.font=`bold 96px "${F}"`; ctx.fillStyle=WHITE;
  ctx.fillText('해당되신다면', W/2, 390);
  ctx.fillText('에이컷이', W/2, 500);
  ctx.fillText('딱입니다', W/2, 610);

  // 서브
  ctx.font=`38px "${F}"`; ctx.fillStyle=hex(WHITE,0.85);
  ctx.fillText('소스만 주시면', W/2, 690);
  ctx.fillText('전담팀이 48시간 안에 납품합니다', W/2, 738);

  // 버튼
  roundRect(ctx, 240, 790, W-480, 110, 55, WHITE);
  ctx.font=`bold 42px "${F}"`; ctx.fillStyle=PURPLE;
  ctx.fillText('무료 상담 시작하기', W/2, 858);

  // 브랜드
  ctx.font=`30px "${F}"`; ctx.fillStyle=hex(WHITE,0.55);
  ctx.fillText('aicut.co.kr', W/2, H-54);

  ctx.textAlign='left';
  return c;
}

// ── 저장 ──
[card1,card2,card3,card4,card5].forEach((fn,i) => {
  const canvas = fn();
  const fp = path.join(OUT_DIR, `realestate_0${i+1}.png`);
  fs.writeFileSync(fp, canvas.toBuffer('image/png'));
  console.log(`✅ realestate_0${i+1}.png`);
});
console.log('\n완료 — blog_imgs/ 5장 (target_02/05 스타일)');
