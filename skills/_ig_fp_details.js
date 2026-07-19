// details 페이지에서 이미지 추가 가능한지 확인
const { chromium } = require('playwright');
const path = require('path');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const MORE_FILES = [
  path.join(W, 'aicut_blog_fp_card1.png'),
  path.join(W, 'aicut_blog_fp_card2.png'),
  path.join(W, 'aicut_blog_fp_card3.png'),
  path.join(W, 'aicut_blog_fp_cta.png'),
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/details/')) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('details 탭 없음'); await b.disconnect(); return; }
  
  console.log('현재:', page.url());
  
  // 이미지 영역 구조 진단
  const diag = await page.evaluate(() => {
    const result = [];
    
    // 모든 button과 아이콘
    document.querySelectorAll('button').forEach(b => {
      const text = b.innerText?.trim().slice(0,30) || '';
      const aria = b.getAttribute('aria-label') || '';
      const html = b.innerHTML.slice(0,100);
      if (text || aria || html.includes('svg')) {
        result.push({ tag: 'button', text, aria: aria.slice(0,30), hasSVG: !!b.querySelector('svg') });
      }
    });
    
    // 이미지 관련 div
    document.querySelectorAll('[role="list"], [role="listbox"], [class*="image"], [class*="media"], [class*="thumbnail"]').forEach(el => {
      result.push({ tag: el.tagName, role: el.getAttribute('role'), cls: (el.className||'').slice(0,40), children: el.children.length });
    });
    
    return result;
  });
  
  console.log('=== details 페이지 진단 ===');
  diag.forEach(d => console.log(`  ${d.tag} | text="${d.text}" | aria="${d.aria}" | hasSVG=${d.hasSVG} | role=${d.role} | cls=${d.cls}`));
  
  // "+" 추가 버튼 찾기 시도
  const added = await page.evaluate(() => {
    // aria-label에 Add나 plus 포함
    const svgs = document.querySelectorAll('svg[aria-label]');
    for (const s of svgs) {
      const label = s.getAttribute('aria-label') || '';
      if (label.includes('추가') || label.includes('Add') || label.includes('plus')) {
        const parent = s.closest('button, [role="button"]');
        if (parent) { parent.click(); return 'svg parent click: ' + label; }
        s.click(); return 'svg click: ' + label;
      }
    }
    return '추가 버튼 없음';
  });
  console.log('\n추가 시도:', added);
  
  await page.waitForTimeout(2000);
  
  if (added.includes('클릭')) {
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(1000);
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(MORE_FILES);
      console.log('✅ 4장 추가 업로드됨');
    } else {
      console.log('❌ file chooser 없음');
    }
    await page.waitForTimeout(5000);
  }
  
  const finalText = await page.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('\n최종:', finalText);
  
  await page.screenshot({ path: 'debug_ig_fp_details.png', fullPage: true });
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
