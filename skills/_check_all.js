// 오늘 작업 전체 체크
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  console.log('=== 열린 탭 목록 ===');
  const tabInfo = [];
  
  for (const p of pages) {
    const url = p.url();
    let label = '';
    
    if (url.includes('postwrite')) label = '📝 네이버 블로그 에디터';
    else if (url.includes('/create/details/')) label = '📸 IG details';
    else if (url.includes('/create/style/')) label = '📸 IG style';
    else if (url.includes('/create/select/')) label = '📸 IG select';
    else if (url.includes('/create/location/')) label = '📸 IG location';
    else if (url.includes('instagram.com')) label = '📸 IG 프로필';
    else if (url.includes('searchad') || url.includes('ads.naver')) label = '📊 광고센터';
    else label = '🌐 기타';
    
    const text = await p.evaluate(() => (document.body.innerText || '').slice(0, 80)).catch(() => '?');
    console.log(`  ${label} | ${url.slice(0, 80)}`);
    
    tabInfo.push({ label, url, text });
  }
  
  console.log(`\n총 ${pages.length}개 탭`);
  
  // === SE4 에디터 체크 ===
  console.log('\n=== 📝 블로그 체크 ===');
  for (const p of pages) {
    if (p.url().includes('postwrite')) {
      const info = await p.evaluate(() => {
        const title = SmartEditor._editors['blogpc001']?.getDocumentTitle?.() || '';
        const imgs = document.querySelectorAll('.se-component.se-image');
        return {
          title,
          imgTotal: imgs.length,
          imgOk: Array.from(imgs).filter(c => !!c.querySelector('img')).length,
          imgBroken: Array.from(imgs).filter(c => c.innerText.includes('존재하지 않는 이미지')).length,
        };
      }).catch(() => ({ title: '❌ 접근 불가', imgTotal: 0, imgOk: 0, imgBroken: 0 }));
      
      console.log(`  제목: ${info.title.slice(0, 50)}`);
      console.log(`  이미지: ${info.imgOk}/${info.imgTotal} 정상 (깨짐 ${info.imgBroken})`);
    }
  }
  
  // === IG create/details 체크 ===
  console.log('\n=== 📸 인스타그램 체크 ===');
  for (const p of pages) {
    if (p.url().includes('/create/details/')) {
      const info = await p.evaluate(() => {
        const text = document.body.innerText || '';
        const hasCaption = text.includes('공유하기');
        const hasLocation = text.includes('서울') || text.includes('Seoul');
        const captionLen = Array.from(document.querySelectorAll('textarea')).reduce((a, t) => a + (t.value || '').length, 0);
        return { hasCaption, hasLocation, captionLen };
      }).catch(() => ({ hasCaption: false, hasLocation: false, captionLen: 0 }));
      
      console.log(`  📍 ${p.url().includes('details') ? '캡션 화면' : '기타'}`);
      console.log(`  캡션: ${info.captionLen}자 | 위치: ${info.hasLocation ? '✅' : '❌'}`);
    }
  }
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
