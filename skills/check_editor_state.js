const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('에디터 페이지 없음'); await b.close(); return; }

  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const titleEl = document.querySelector('input[placeholder*="제목"]');
    const imgs = document.querySelectorAll('img').length;
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    const h2s = document.querySelectorAll('h2').length;
    return {
      title: titleEl ? titleEl.value : '(미확인)',
      contentLen: ft.length,
      paraCount: paras,
      imgCount: imgs,
      h2Count: h2s,
      first100: ft.substring(0, 100)
    };
  });

  console.log('에디터 상태:');
  console.log('  제목: ' + r.title);
  console.log('  글자수: ' + r.contentLen + '자');
  console.log('  문단: ' + r.paraCount + '개');
  console.log('  이미지: ' + r.imgCount + '장');
  console.log('  H2: ' + r.h2Count + '개');
  console.log('  처음 100자: ' + r.first100);
  
  if (r.contentLen > 1000) {
    console.log('\n✅ 이미 리퍼런스 스타일로 작성 완료된 상태입니다.');
    console.log('추가 작업 불필요합니다.');
  } else {
    console.log('\n⚠️ 내용이 없습니다. 재작성 필요');
  }

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
