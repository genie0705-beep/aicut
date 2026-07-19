const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const sp = b.contexts()[0].pages().find(p => p.url().includes('/stat/'));
  if (!sp) { console.log('통계 페이지 없음'); await b.close(); return; }

  await sp.bringToFront();
  // 더 오래 대기
  await sp.waitForTimeout(8000);

  const r = await sp.evaluate(() => {
    // iframe 확인
    const iframes = document.querySelectorAll('iframe');
    const iframeInfo = Array.from(iframes).map(f => ({
      src: f.src.substring(0, 100),
      id: f.id,
      width: f.width
    }));

    // 전체 HTML 구조
    const bodyHTML = document.body ? document.body.innerHTML.substring(0, 1000) : 'body 없음';
    
    // 주요 영역
    const mainAreas = [];
    document.querySelectorAll('section, main, article, div[class*="content"], div[class*="wrap"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 50) {
        mainAreas.push({
          tag: el.tagName,
          cls: el.className.substring(0, 60),
          size: Math.round(rect.width) + 'x' + Math.round(rect.height),
          text: (el.textContent || '').substring(0, 80).replace(/\s+/g, ' ').trim()
        });
      }
    });

    return {
      title: document.title,
      iframes: iframeInfo,
      mainAreas: mainAreas.slice(0, 15),
      url: location.href
    };
  });

  console.log('제목:', r.title);
  console.log('URL:', r.url);

  if (r.iframes.length > 0) {
    console.log('\n📦 iframe 발견:');
    r.iframes.forEach(f => console.log('  src:', f.src, 'id:', f.id));
  }

  console.log('\n📐 주요 영역:');
  r.mainAreas.forEach((a, i) => {
    console.log('  [' + i + '] ' + a.tag + '.' + a.cls);
    console.log('      크기:' + a.size + ' 내용:' + a.text);
  });

  // iframe이 있으면 내부 데이터 확인
  if (r.iframes.length > 0) {
    for (const f of r.iframes) {
      if (f.src && f.src.length > 5) {
        try {
          const frame = sp.frame({ url: f.src });
          if (frame) {
            const ftext = await frame.evaluate(() => document.body.textContent || '');
            console.log('\n🔍 iframe 데이터 (' + f.id + '):', ftext.substring(0, 300).replace(/\s+/g, ' ').trim());
          }
        } catch (e) {
          console.log('  iframe 접근 실패:', f.id);
        }
      }
    }
  }

  await b.close();
}
main().catch(e => console.error('에러:', e.message));
