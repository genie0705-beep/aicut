const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }

  // 현재 페이지에서 모바일 뷰포트로 직접 확인
  await wp.setViewportSize({ width: 375, height: 812 });
  await wp.waitForTimeout(3000);

  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const imgs = document.querySelectorAll('img');
    const allParas = document.querySelectorAll('.se-text-paragraph');
    const h2s = document.querySelectorAll('h2');
    const vw = window.innerWidth;

    // 모든 이미지 위치
    const imgPos = Array.from(imgs).map((img, i) => {
      const r = img.getBoundingClientRect();
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      return {
        i, size: natW + 'x' + natH,
        rendered: Math.round(r.width) + 'x' + Math.round(r.height),
        inView: r.width > 0 && r.right <= vw + 2 && r.left >= -2,
        overflow: Math.round(r.right) > vw ? (Math.round(r.right) - vw) + 'px 초과' : '정상',
        style: img.getAttribute('style') ? '✅ 반응형' : '❌ 고정'
      };
    });

    // 모든 텍스트 문단 위치
    const paras = Array.from(allParas).filter(p => {
      const t = (p.textContent || '').trim();
      return t.length > 0 && !t.startsWith('#');
    });
    
    const paraPos = paras.map((p, i) => {
      const r = p.getBoundingClientRect();
      return {
        i, text: (p.textContent || '').substring(0, 40),
        len: (p.textContent || '').length,
        lines: Math.ceil((p.textContent || '').length / 19), // 375px에서 한글 약 19자
        inView: r.right <= vw + 2 && r.left >= -2,
        overflow: r.right > vw ? (Math.round(r.right) - vw) + 'px 초과' : '정상'
      };
    });
    
    // H2 위치
    const h2Pos = Array.from(h2s).map(h => {
      const r = h.getBoundingClientRect();
      return { text: (h.textContent || '').substring(0, 30), inView: r.right <= vw + 2 && r.left >= -2 };
    });

    // 오버플로우 통계
    const overflowParas = paraPos.filter(p => p.inView === false);
    const overflowImgs = imgPos.filter(p => p.inView === false);

    return {
      viewport: vw + 'x' + window.innerHeight,
      contentLen: ft.length,
      totalTextParas: paras.length,
      totalImgs: imgs.length,
      images: imgPos,
      paragraphs: paraPos.filter(p => p.len > 50).slice(0, 8),
      h2s: h2Pos,
      overflowParas: overflowParas.length,
      overflowParasDetail: overflowParas.slice(0, 5),
      overflowImgs: overflowImgs.length,
      overflowImgsDetail: overflowImgs.slice(0, 5),
      // 4줄 초과 문단
      over3lines: paraPos.filter(p => p.lines > 3).length,
      over4lines: paraPos.filter(p => p.lines > 4).length
    };
  });

  console.log('=== 📱 모바일(375×812) 실제 렌더링 체크 ===\n');
  
  console.log('📌 기본: ' + r.contentLen + '자 / ' + r.totalTextParas + '개 문단 / ' + r.totalImgs + '장 이미지');
  
  console.log('\n🖼️ 이미지:');
  r.images.forEach(img => {
    console.log('  [' + img.i + '] ' + img.size + ' → 렌더 ' + img.rendered + ' ' + img.overflow + ' ' + img.style);
  });

  console.log('\n📐 H2 위치:');
  r.h2s.forEach(h => console.log('  ' + (h.inView ? '✅' : '❌') + ' ' + h.text));

  console.log('\n📐 50자↑ 문단 상세:');
  r.paragraphs.forEach(p => {
    console.log('  ' + (p.inView ? '✅' : '❌') + ' ' + p.len + '자 (' + p.lines + '줄) ' + p.text);
  });

  console.log('\n⚠️ 이상 유무:');
  if (r.overflowImgs === 0) console.log('✅ 이미지 오버플로우 없음');
  else console.log('❌ 이미지 ' + r.overflowImgs + '개 화면 밖: ' + JSON.stringify(r.overflowImgsDetail));
  
  if (r.overflowParas === 0) console.log('✅ 문단 오버플로우 없음');
  else console.log('❌ 문단 ' + r.overflowParas + '개 화면 밖: ' + JSON.stringify(r.overflowParasDetail));

  console.log('\n📏 줄 수 분석:');
  console.log('  4줄 초과 문단: ' + r.over3lines + '개');
  console.log('  5줄 초과 문단: ' + r.over4lines + '개');

  const totalOk = r.overflowImgs + r.overflowParas;
  if (totalOk === 0 && r.over4lines <= 2) {
    console.log('\n✅ 결론: 모바일 최적화 완료 — 추가 보완 불필요');
  } else if (totalOk === 0) {
    console.log('\n📐 결론: 대부분 양호, 일부 긴 문단 자연스러움');
  } else {
    console.log('\n⚠️ 결론: ' + totalOk + '개 오버플로우 있음 → 보완 필요');
  }

  await b.close();
}
main().catch(e => console.error('❌', e.message));
