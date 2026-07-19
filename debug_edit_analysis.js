// 블로그봇 v5 — Naver post view → 수정 버튼 분석 및 진입
const { chromium } = require('playwright');
const fs = require('fs');

const CDP_PORT = 9224;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes('logNo='));
  if (!page) page = await ctx.newPage();

  console.log('=== PostView → 수정 URL 분석 ===\n');

  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224341544476', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await sleep(5000);

  // Deep analysis of the page structure and all 수정-related elements
  const analysis = await page.evaluate(() => {
    const results = [];
    
    // 1. All links with 수정 text
    const links = document.querySelectorAll('a');
    links.forEach(a => {
      if (a.textContent.includes('수정') || a.href.includes('PostWrite') || a.href.includes('edit') || a.href.includes('modify')) {
        results.push({
          tag: a.tagName,
          text: a.textContent.trim().substring(0, 50),
          href: (a.href || '').substring(0, 150),
          class: a.className.substring(0, 80),
          id: a.id,
          onclick: (a.getAttribute('onclick') || '').substring(0, 100),
          rect: (() => { const r = a.getBoundingClientRect(); return `${r.left.toFixed(0)},${r.top.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`; })()
        });
      }
    });
    
    // 2. All buttons with 수정 text
    const buttons = document.querySelectorAll('button');
    buttons.forEach(b => {
      if (b.textContent.includes('수정')) {
        results.push({
          tag: 'BUTTON',
          text: b.textContent.trim().substring(0, 80),
          class: b.className.substring(0, 80),
          id: b.id,
          onclick: (b.getAttribute('onclick') || '').substring(0, 100),
          rect: (() => { const r = b.getBoundingClientRect(); return `${r.left.toFixed(0)},${r.top.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`; })()
        });
      }
    });
    
    // 3. Any element with onclick containing PostWrite
    const all = document.querySelectorAll('*');
    all.forEach(el => {
      const oc = el.getAttribute('onclick');
      if (oc && (oc.includes('PostWrite') || oc.includes('modify') || oc.includes('edit'))) {
        results.push({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          class: el.className.substring(0, 80),
          onclick: oc.substring(0, 200),
          rect: (() => { const r = el.getBoundingClientRect(); return `${r.left.toFixed(0)},${r.top.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`; })()
        });
      }
    });

    // 4. Check all iframes and their inner content
    const frames = document.querySelectorAll('iframe');
    const frameInfo = Array.from(frames).map(f => ({
      id: f.id,
      name: f.name,
      src: (f.src || '').substring(0, 100),
      rect: (() => { const r = f.getBoundingClientRect(); return r.width > 0 ? `${r.left.toFixed(0)},${r.top.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}` : 'hidden'; })()
    }));
    
    return { results, frameInfo, pageTitle: document.title };
  });

  console.log('=== 수정 관련 요소 ===');
  analysis.results.forEach((r, i) => {
    console.log(`\n[${i+1}] ${r.tag} "${r.text}"`);
    console.log(`    href: ${r.href || '-'}`);
    console.log(`    onclick: ${r.onclick || '-'}`);
    console.log(`    class: ${r.class}`);
    console.log(`    rect: ${r.rect}`);
  });

  console.log('\n=== 모든 iframe ===');
  analysis.frameInfo.forEach((f, i) => {
    console.log(`[${i+1}] id="${f.id}" name="${f.name}" src="${f.src}" rect="${f.rect}"`);
  });
  
  console.log(`\n페이지 제목: ${analysis.pageTitle}`);

  // Now try to click the correct element
  console.log('\n=== 수정 버튼 실제 클릭 시도 ===');
  
  const clickResult = await page.evaluate(() => {
    // Priority: Find a link with onClick that navigates
    const links = document.querySelectorAll('a');
    
    for (const a of links) {
      const text = a.textContent.trim();
      if (text === '수정' || text.startsWith('수정')) {
        const onclick = a.getAttribute('onclick') || '';
        const href = a.href || '';
        if (href && (href.includes('PostWrite') || href.includes('modify') || href.includes('PostEdit'))) {
          a.click();
          return { method: 'a.href', href: href.substring(0, 150), text: text };
        }
        if (onclick.includes('PostWrite') || onclick.includes('modify')) {
          a.click();
          return { method: 'a.onclick', onclick: onclick.substring(0, 150), text: text };
        }
      }
    }
    
    // Try any visible 수정 link
    for (const a of links) {
      if (a.textContent.trim() === '수정' && a.offsetParent !== null) {
        const rect = a.getBoundingClientRect();
        if (rect.width > 0 && rect.width < 200) {  // small button, not wide div
          a.click();
          return { method: 'visible_a', href: a.href || '', rect: `${rect.width.toFixed(0)}x${rect.height.toFixed(0)}` };
        }
      }
    }
    
    return null;
  });
  
  if (clickResult) {
    console.log('클릭 성공:', JSON.stringify(clickResult));
  } else {
    console.log('클릭할 요소를 찾지 못함');
  }
  
  await sleep(5000);
  
  const afterClickUrl = page.url();
  console.log(`\n클릭 후 URL: ${afterClickUrl.substring(0, 150)}`);
  
  // Take screenshot
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v5_after_click.png' });
  
  // Check what frames are available now
  console.log('\n=== 클릭 후 프레임 ===');
  const frames = page.frames();
  for (const f of frames) {
    try {
      const url = f.url();
      if (url !== 'about:blank') {
        console.log(`  "${f.name()}": ${url.substring(0, 100)}`);
      }
    } catch (e) {}
  }
  
  // Print body text for context
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500)).catch(() => '');
  console.log(`\n페이지 내용 (처음 500자):\n${bodyText}`);
  
  browser.disconnect();
  console.log('\n🔌 연결 해제');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
