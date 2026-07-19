const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  // 모바일 뷰포트로 새 탭
  const mobilePage = await ctx.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  const url = wp.url();
  await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await mobilePage.waitForTimeout(5000);

  const mobileCheck = await mobilePage.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const fullText = se.getContentText();
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');
    const h2s = document.querySelectorAll('h2');
    const vw = window.innerWidth;

    // 이미지
    const imgRects = Array.from(imgs).map((img, i) => {
      const r = img.getBoundingClientRect();
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const style = img.getAttribute('style') || '';
      return {
        i,
        natural: natW + 'x' + natH,
        rendered: Math.round(r.width) + 'x' + Math.round(r.height),
        withinViewport: r.right <= vw + 2 && r.left >= -2 && r.width > 0,
        leftEdge: Math.round(r.left),
        rightEdge: Math.round(r.right),
        style: style.substring(0, 80)
      };
    });

    // 오버플로우 체크
    let overflowCount = 0;
    paras.forEach(p => {
      const r = p.getBoundingClientRect();
      if (r.right > vw + 5 || r.left < -5) overflowCount++;
    });

    // 문단이 화면 내에 있는지
    const paraWidthOk = Array.from(paras).filter(p => {
      const r = p.getBoundingClientRect();
      return r.right <= vw + 2 && r.left >= -2;
    }).length;

    // 문단 길이 통계
    const textParas = Array.from(paras).filter(p => {
      const t = (p.textContent || '').trim();
      return t.length > 0 && !t.startsWith('#');
    });
    const lens = textParas.map(p => (p.textContent || '').length);
    const over40 = lens.filter(l => l > 40).length;
    const over50 = lens.filter(l => l > 50).length;
    const over60 = lens.filter(l => l > 60).length;
    const over70 = lens.filter(l => l > 70).length;
    const avgLen = lens.length ? Math.round(lens.reduce((a,b) => a+b, 0) / lens.length) : 0;
    const maxLen = lens.length ? Math.max(...lens) : 0;

    // H2, Strong
    const h2sList = document.querySelectorAll('h2');
    const strongs = document.querySelectorAll('strong, b');
    const hashCount = (fullText.match(/#[가-힣a-zA-Z]+/g) || []).length;

    return {
      viewport: vw + 'x' + window.innerHeight,
      contentLen: fullText.length,
      paraCount: paras.length,
      textParaCount: textParas.length,
      avgLen: avgLen + '자',
      maxLen: maxLen + '자',
      over40, over50, over60, over70,
      paraWidthOk: paraWidthOk + '/' + paras.length,
      overflowCount,
      imgCount: imgs.length,
      images: imgRects,
      h2Count: h2sList.length,
      strongCount: strongs.length,
      hashCount
    };
  });

  console.log('=== 📱 모바일(375×812) 전체 최적화 체크 ===\n');

  console.log('📊 기본:');
  console.log('  뷰포트: ' + mobileCheck.viewport);
  console.log('  본문: ' + mobileCheck.contentLen + '자 / ' + mobileCheck.textParaCount + '개 텍스트문단');
  console.log('  H2: ' + mobileCheck.h2Count + '개 / Strong: ' + mobileCheck.strongCount + '개 / 해시태그: ' + mobileCheck.hashCount + '개');

  console.log('\n📐 문단 길이 (모바일 360~375px):');
  console.log('  평균: ' + mobileCheck.avgLen + ' (2줄 내외)');
  console.log('  최대: ' + mobileCheck.maxLen + '자');
  console.log('  40자↑: ' + mobileCheck.over40 + '개');
  console.log('  50자↑: ' + mobileCheck.over50 + '개');
  console.log('  60자↑: ' + mobileCheck.over60 + '개');
  console.log('  70자↑: ' + mobileCheck.over70 + '개');

  console.log('\n🖼️ 이미지 (모바일 렌더링):');
  mobileCheck.images.forEach(img => {
    const status = img.withinViewport ? '✅' : '❌ 잘림';
    console.log('  [' + img.i + '] ' + img.natural + ' → ' + img.rendered + ' (좌:' + img.leftEdge + ' 우:' + img.rightEdge + ') ' + status);
  });

  console.log('\n📐 화면 내 배치:');
  console.log('  문단 화면내 정상: ' + mobileCheck.paraWidthOk);
  console.log('  오버플로우 요소: ' + mobileCheck.overflowCount + '개');

  // 최종 평가
  console.log('\n=== 최종 평가 ===');
  const allOk = [];
  if (mobileCheck.avgLen <= 35) allOk.push('✅ 평균 문단 길이 ' + mobileCheck.avgLen + ' (2줄 내외)');
  else allOk.push('📐 평균 문단 길이 ' + mobileCheck.avgLen);
  
  if (mobileCheck.maxLen <= 80) allOk.push('✅ 최대 문단 길이 ' + mobileCheck.maxLen + '자 (3~4줄)');
  else allOk.push('⚠️ 최대 문단 길이 ' + mobileCheck.maxLen + '자');
  
  if (mobileCheck.over70 <= 1) allOk.push('✅ 70자 초과 ' + mobileCheck.over70 + '개');
  else allOk.push('📐 70자 초과 ' + mobileCheck.over70 + '개');
  
  const imgsOk = mobileCheck.images.filter(i => i.withinViewport).length;
  if (imgsOk >= mobileCheck.imgCount) allOk.push('✅ 이미지 ' + mobileCheck.imgCount + '장 모두 모바일 화면 내 정상 렌더링');
  else allOk.push('⚠️ 이미지 ' + (mobileCheck.imgCount - imgsOk) + '장 잘림');
  
  if (mobileCheck.overflowCount === 0) allOk.push('✅ 오버플로우 없음 (전체 화면 내 정상)');
  else allOk.push('⚠️ 오버플로우 ' + mobileCheck.overflowCount + '개');

  allOk.forEach(m => console.log(m));

  await mobilePage.screenshot({ path: path.join(WS, '_mobile_view.png') });
  console.log('\n📸 모바일 스크린샷 저장 완료');

  await mobilePage.close();
  await b.close();
}
main().catch(e => console.error('❌', e.message));
