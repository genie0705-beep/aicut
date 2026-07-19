// 인스타그램 — create flow 상세 진단
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com')) {
      page = p;
      console.log('Instagram 탭:', p.url());
      break;
    }
  }
  if (!page) {
    console.log('Instagram 탭 없음');
    await b.disconnect();
    return;
  }
  
  // 현재 화면 전체 HTML 진단
  const diag = await page.evaluate(() => {
    const result = {};
    
    // 모든 버튼과 그 텍스트
    const buttons = [];
    document.querySelectorAll('a, button, [role="button"], span').forEach(el => {
      const text = (el.innerText || '').trim().slice(0, 40);
      const role = el.getAttribute('role') || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const href = el.getAttribute('href') || '';
      const cls = typeof el.className === 'string' ? el.className.slice(0, 30) : '';
      if (text || ariaLabel) {
        buttons.push({ tag: el.tagName, text, role, aria: ariaLabel.slice(0, 30), href: href.slice(0, 60), cls });
      }
    });
    result.buttons = buttons.slice(0, 50);
    
    // file input
    result.fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).map(f => ({
      id: f.id,
      accept: f.getAttribute('accept'),
      hidden: f.offsetParent === null,
    }));
    
    // 모달/다이얼로그
    result.modals = [];
    document.querySelectorAll('[role="dialog"], [role="presentation"], [class*="modal"], [class*="dialog"]').forEach(el => {
      result.modals.push({
        tag: el.tagName,
        role: el.getAttribute('role'),
        cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
        text: (el.innerText || '').slice(0, 100),
      });
    });
    
    return result;
  });
  
  console.log('=== 버튼/링크 ===');
  diag.buttons.forEach(b => console.log(`  ${b.tag} | "${b.text}" | role=${b.role} | aria=${b.aria} | href=${b.href.slice(0,40)}`));
  
  console.log('\n=== file inputs ===');
  diag.fileInputs.forEach(f => console.log(`  id=${f.id} accept=${f.accept} hidden=${f.hidden}`));
  
  console.log('\n=== 모달 ===');
  diag.modals.forEach(m => console.log(`  ${m.tag} | role=${m.role} | cls=${m.cls} | "${m.text.slice(0,60)}"`));
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
