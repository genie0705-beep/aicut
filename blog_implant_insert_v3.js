// 블로그봇 v3 — PostView → 수정 버튼 → SE4 에디터 이미지 삽입
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CDP_PORT = 9224;

const IMAGES = [
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_main.png', label: '대표' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card1.png', label: 'card1' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card2.png', label: 'card2' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card3.png', label: 'card3' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_cta.png', label: 'CTA' }
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('=== 블로그 이미지 삽입 v3 시작 ===');
  
  for (const img of IMAGES) {
    if (!fs.existsSync(img.file)) {
      console.error(`❌ 없음: ${img.file}`);
      process.exit(1);
    }
    console.log(`✅ ${img.label}: ${path.basename(img.file)}`);
  }
  
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];
  
  // Find or create a page for the blog post
  let page = ctx.pages().find(p => p.url().includes('logNo=224341544476'));
  
  if (!page) {
    console.log('기존 블로그 페이지 없음. 새 탭 생성...');
    page = await ctx.newPage();
  }
  
  console.log(`현재 페이지: ${page.url().substring(0, 100)}`);
  
  // Navigate to PostView
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224341544476', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await sleep(3000);
  
  const title = await page.title();
  console.log(`페이지 제목: ${title}`);
  
  // Wait for the page to fully load (Naver blog has iframes)
  await sleep(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v3_postview.png' });
  console.log('PostView 스크린샷 저장');
  
  // Find the "수정" button — Naver blog typically has it in the blog admin ribbon
  // Try several approaches
  console.log('\n--- 수정 버튼 찾기 ---');
  
  let editClicked = false;
  
  // Approach 1: text content
  const editBtnByText = await page.evaluate(() => {
    const allElements = document.querySelectorAll('a, button, span, div, li');
    for (const el of allElements) {
      const text = el.textContent.trim();
      if (text === '수정' || text === '관리' || text.startsWith('수정')) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          console.log(`Found: "${text}" at (${rect.left}, ${rect.top}) - ${rect.width}x${rect.height}`);
          return { tag: el.tagName, text, x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
        }
      }
    }
    return null;
  });
  
  if (editBtnByText) {
    console.log(`수정 버튼 발견: ${editBtnByText.tag} "${editBtnByText.text}" at (${editBtnByText.x}, ${editBtnByText.y})`);
    await page.mouse.click(editBtnByText.x, editBtnByText.y);
    await sleep(5000);
    editClicked = true;
  }
  
  if (!editClicked) {
    // Approach 2: Look for iframes that might contain the edit button
    console.log('수정 버튼 직접 찾기 실패. iframe 탐색...');
    const frames = page.frames();
    for (const f of frames) {
      const fUrl = f.url();
      if (fUrl.includes('blog') || fUrl.includes('naver') || fUrl.includes('main')) {
        try {
          const editInFrame = await f.evaluate(() => {
            const el = document.querySelector('a[href*="edit"], a[href*="modify"], a[href*="PostEdit"], a[href*="PostWrite"], button:has-text("수정")');
            if (el) {
              const rect = el.getBoundingClientRect();
              return { tag: el.tagName, text: el.textContent.trim(), x: rect.left + rect.width/2, y: rect.top + rect.height/2, href: el.href || '' };
            }
            // Try all links/buttons
            const all = document.querySelectorAll('a, button');
            for (const a of all) {
              if (a.textContent.trim() === '수정' || a.href?.includes('edit') || a.href?.includes('modify')) {
                const rect = a.getBoundingClientRect();
                return { tag: a.tagName, text: a.textContent.trim(), x: rect.left + rect.width/2, y: rect.top + rect.height/2, href: a.href || '' };
              }
            }
            return null;
          });
          if (editInFrame) {
            console.log(`iframe(${f.name})에서 수정 버튼 발견: ${editInFrame.text} -> ${editInFrame.href}`);
            await page.mouse.click(editInFrame.x, editInFrame.y);
            await sleep(5000);
            editClicked = true;
            break;
          }
        } catch (e) {
          console.log(`iframe 탐색 중 오류: ${e.message.substring(0, 80)}`);
        }
      }
    }
  }
  
  if (!editClicked) {
    // Approach 3: Use the blog main page and navigate from there
    console.log('현재 페이지에서 수정 버튼 못 찾음. 블로그 메인으로 이동...');
    await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);
    
    // Try to find "내블로그" or "관리" button
    const manageBtn = await page.evaluate(() => {
      const all = document.querySelectorAll('a, button, span, div');
      for (const el of all) {
        const t = el.textContent.trim();
        if (t === '내블로그' || t === '블로그관리' || t === '관리') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0) return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
        }
      }
      return null;
    });
    
    if (manageBtn) {
      console.log(`블로그 관리 버튼 발견`);
      await page.mouse.click(manageBtn.x, manageBtn.y);
      await sleep(4000);
      
      // Now on the blog admin page, find the post and edit it
      // Try loading the specific post in edit mode
      await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(4000);
    }
    
    // Take screenshot of current state
    await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v3_admin.png' });
    console.log('관리자 페이지 스크린샷 저장');
    
    // Try to find edit links for our post in any iframe
    console.log('포스트 목록에서 수정 링크 찾기...');
    
    const allFrames = page.frames();
    for (const f of allFrames) {
      try {
        const editLink = await f.evaluate((logNo) => {
          const links = document.querySelectorAll('a');
          for (const a of links) {
            if (a.href && a.href.includes(logNo)) {
              return { href: a.href, text: a.textContent.trim(), tag: a.tagName };
            }
          }
          return null;
        }, '224341544476');
        
        if (editLink) {
          console.log(`수정 링크 발견: ${editLink.href.substring(0, 100)}`);
          
          // Check if it's an edit link
          if (editLink.href.includes('edit') || editLink.href.includes('modify') || editLink.href.includes('PostWrite')) {
            console.log('수정 URL로 이동...');
            await page.goto(editLink.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(5000);
            editClicked = true;
            break;
          } else {
            // Click the link
            await f.goto(editLink.href);
            await sleep(4000);
            // Now on the post page, find edit button again
            const editInPostView = await page.evaluate(() => {
              const all = document.querySelectorAll('a');
              for (const a of all) {
                if (a.textContent.trim() === '수정') {
                  return a.href || '';
                }
              }
              return '';
            });
            if (editInPostView) {
              console.log(`수정 URL 발견: ${editInPostView.substring(0, 100)}`);
              await page.goto(editInPostView, { waitUntil: 'domcontentloaded', timeout: 30000 });
              await sleep(5000);
              editClicked = true;
              break;
            }
          }
        }
      } catch (e) {
        console.log(`프레임 탐색 오류: ${e.message.substring(0, 60)}`);
      }
    }
  }
  
  // Last resort: Try common Naver SmartEdit URLs
  if (!editClicked) {
    console.log('\n직접 수정 URL 시도...');
    const candidates = [
      `https://blog.naver.com/PostWrite.naver?blogId=aicut&logNo=224341544476&isEdit=true`,
      `https://blog.naver.com/PostEdit.naver?blogId=aicut&logNo=224341544476&from=postList`,
    ];
    
    for (const url of candidates) {
      console.log(`시도: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(5000);
      
      const hasEditor = await page.evaluate(() => {
        return !!(document.querySelector('iframe[title="SE"]') || 
                 document.querySelector('.se-editor') ||
                 document.querySelector('[class*="smart-editor"]') ||
                 document.title.includes('글쓰기'));
      });
      
      if (hasEditor) {
        console.log('✅ SE4 에디터 로드됨!');
        editClicked = true;
        break;
      }
    }
  }
  
  if (!editClicked) {
    console.error('❌ 수정 페이지 진입 실패');
    await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v3_fail.png' });
    browser.disconnect();
    process.exit(1);
  }
  
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v3_editor.png' });
  console.log('에디터 스크린샷 저장');
  
  // Find SE4 iframe
  console.log('\n--- SE4 에디터 iframe 찾기 ---');
  let seFrame = null;
  
  for (const f of page.frames()) {
    console.log(`프레임: "${f.name()}" url="${f.url().substring(0, 80)}"`);
    if (f.name().includes('SE') || f.url().includes('smart') || f.url().includes('se4') || 
        f.url().includes('/SE/') || f.name().includes('smart')) {
      seFrame = f;
    }
  }
  
  if (!seFrame) {
    const seTitleIframe = page.frame({ name: 'SE' }) || 
                          page.frame({ name: 'smartEditor' }) ||
                          page.frame({ url: /smart/ });
    if (seTitleIframe) seFrame = seTitleIframe;
  }
  
  if (!seFrame) {
    console.log('SE4 iframe not found, checking if editor is embedded...');
    const hasDirect = await page.evaluate(() => {
      return !!(document.querySelector('[contenteditable]') || document.querySelector('.se-component'));
    });
    if (hasDirect) {
      console.log('에디터가 메인 페이지에 직접 있음');
      seFrame = page;
    }
  }
  
  if (!seFrame) {
    console.error('❌ SE4 에디터를 찾을 수 없음');
    browser.disconnect();
    process.exit(1);
  }
  console.log('✅ SE4 에디터 컨텍스트 확보');
  
  const target = seFrame;
  
  // Insert images
  console.log('\n--- 이미지 삽입 ---');
  
  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    console.log(`\n[${i+1}/${IMAGES.length}] ${img.label}: ${path.basename(img.file)}`);
    
    // Try file input first
    let inserted = false;
    
    // Strategy A: Find input[type=file] in the editor
    const fileInput = await target.$('input[type="file"]');
    if (fileInput) {
      try {
        await fileInput.setInputFiles(img.file);
        console.log('  ✅ input[type=file] 직접 설정 성공');
        inserted = true;
        await sleep(3000);
      } catch (e) {
        console.log(`  ⚠️ input 설정 실패: ${e.message.substring(0, 60)}`);
      }
    }
    
    if (!inserted) {
      // Strategy B: 사진 버튼 클릭 → file chooser
      const photoBtn = await target.$('button:has-text("사진"), [class*="photo"], [class*="image"]');
      if (photoBtn) {
        try {
          const [fc] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 8000 }),
            photoBtn.click()
          ]);
          await sleep(300);
          await fc.setFiles(img.file);
          console.log('  ✅ 사진 버튼 → 파일선택 성공');
          inserted = true;
          await sleep(3000);
        } catch (e) {
          console.log(`  ⚠️ 파일선택기 실패: ${e.message.substring(0, 60)}`);
        }
      }
    }
    
    if (!inserted) {
      // Strategy C: Clipboard paste (images work per RULES.md 6-2-3)
      try {
        const buf = fs.readFileSync(img.file);
        const b64 = buf.toString('base64');
        
        await target.evaluate(async (base64data) => {
          const resp = await fetch(`data:image/png;base64,${base64data}`);
          const blob = await resp.blob();
          const dt = new DataTransfer();
          dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
          document.activeElement.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: dt, bubbles: true, cancelable: true
          }));
        }, b64);
        
        console.log('  ✅ 클립보드 paste 성공');
        inserted = true;
        await sleep(3000);
      } catch (e) {
        console.log(`  ⚠️ paste 실패: ${e.message.substring(0, 60)}`);
      }
    }
    
    if (!inserted) {
      console.log('  ❌ 이미지 삽입 실패');
    }
  }
  
  // Center alignment
  console.log('\n--- 센터 정렬 ---');
  try {
    await target.evaluate(() => {
      const items = document.querySelectorAll('.se-image-component, .se-component, [class*="se-component"]');
      items.forEach(el => {
        if (el.querySelector('img') || el.tagName === 'IMG' || el.querySelector('img')) {
          el.style.textAlign = 'center';
          el.classList.add('se-text-paragraph-align-center');
        }
      });
      document.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    });
    console.log('✅ 센터 정렬 적용');
  } catch (e) {
    console.log(`⚠️ 정렬 오류: ${e.message}`);
  }
  
  await sleep(2000);
  
  // Save
  console.log('\n--- 저장 ---');
  const saveBtn = await page.$('button:has-text("저장"), [class*="save"], a:has-text("저장")');
  if (saveBtn) {
    await saveBtn.click();
    await sleep(3000);
    console.log('✅ 저장 버튼 클릭');
  } else {
    // Try script-based search
    const savedOk = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, span');
      for (const b of btns) {
        if (b.textContent.trim() === '저장' && b.offsetParent !== null) {
          b.click();
          return true;
        }
      }
      return false;
    });
    console.log(savedOk ? '✅ 저장 버튼 클릭 (스크립트)' : '⚠️ 저장 버튼 미발견');
    await sleep(3000);
  }
  
  // Final screenshot
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_v3_final.png', fullPage: true });
  
  // Check for save confirmation
  const savedMsg = await page.evaluate(() => {
    const body = document.body.innerText;
    if (body.includes('저장되었습니다')) return true;
    return false;
  });
  
  console.log(`\n=== 결과 ===`);
  console.log(`저장 확인: ${savedMsg ? '✅' : '⚠️ 스크린샷 확인 필요'}`);
  console.log('스크린샷: debug_v3_final.png');
  console.log('에디터: debug_v3_editor.png');
  
  browser.disconnect();
  console.log('🔌 연결 해제');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
