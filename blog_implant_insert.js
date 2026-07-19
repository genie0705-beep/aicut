// 블로그봇: 임플란트 포스트 이미지 삽입 (SE4 에디터)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const POST_URL = 'https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224341544476';
const CDP_PORT = 9224;

const IMAGE_MAP = [
  {
    file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_main.png',
    marker: '대표',
    afterText: null // 제목/도입부 첫 문단 뒤
  },
  {
    file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card1.png',
    marker: 'card1',
    afterText: '임플란트 수술 영상이 주는 신뢰감'
  },
  {
    file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card2.png',
    marker: 'card2',
    afterText: '영상 편집 아웃소싱, 에이컷이 해결합니다'
  },
  {
    file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card3.png',
    marker: 'card3',
    afterText: '지금 시작해야 하는 3가지 이유'
  },
  {
    file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_cta.png',
    marker: 'cta',
    afterText: '지금 바로 시작하세요'
  }
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function connectChrome() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0] || await ctx.newPage();
  if (!pages.length) page = await ctx.newPage();
  return { browser, page };
}

async function waitForSE4Editor(page) {
  // Wait for SE4 iframe or editor area
  try {
    await page.waitForSelector('iframe[title="SE"]', { timeout: 15000 });
    console.log('SE4 iframe found');
  } catch {
    console.log('No SE4 iframe, checking for editor container...');
  }
  await sleep(2000);
}

async function getSE4Context(page) {
  // Try to find the SE editor element
  const hasIframe = await page.$('iframe[title="SE"]');
  if (hasIframe) {
    const frame = await page.frame({ name: /SE|smart|editor/ });
    if (frame) return { page: frame, isIframe: true };
    const frames = page.frames();
    for (const f of frames) {
      const name = await f.title().catch(() => '');
      if (name.includes('SE') || f.url().includes('smart')) {
        return { page: f, isIframe: true };
      }
    }
  }
  return { page, isIframe: false };
}

async function navigateToEdit(page) {
  console.log(`Navigating to: ${POST_URL}`);
  await page.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  // Try to find and click "수정" edit button
  const editBtn = await page.$('text=수정');
  if (editBtn) {
    console.log('Clicking 수정 button');
    await editBtn.click();
    await sleep(5000);
    await waitForSE4Editor(page);
    return true;
  }

  // Try alternative: right-click area or manage button
  console.log('수정 button not found directly, trying alternative approaches...');
  
  // Check if we're already on manage blog page
  // Take screenshot for debugging
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_edit_page.png', fullPage: true });
  console.log('Screenshot saved for debugging');
  
  return false;
}

async function insertImageAtCursor(page, filePath) {
  console.log(`Inserting image: ${filePath}`);
  
  // Strategy 1: Try to find the file input element
  const fileInput = await page.$('input[type="file"][accept*="image"]');
  if (fileInput) {
    console.log('Found file input, uploading directly...');
    await fileInput.setInputFiles(filePath);
    await sleep(3000);
    return true;
  }

  // Strategy 2: Try to click on 사진 button and wait for file dialog
  console.log('Trying 사진 button...');
  const photoBtn = await page.$('button:has-text("사진")');
  if (photoBtn) {
    console.log('Clicking 사진 button');
    
    // Set up file chooser listener before clicking
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      photoBtn.click()
    ]);
    
    if (fileChooser) {
      console.log('File chooser detected, setting files...');
      await fileChooser.setFiles(filePath);
      await sleep(3000);
      return true;
    }
  }
  
  // Strategy 3: Clip board paste (works for images per RULES.md 6-2-3)
  console.log('Trying clipboard paste for image...');
  const imgBuffer = fs.readFileSync(filePath);
  const base64 = imgBuffer.toString('base64');
  const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;
  
  // Focus on editor body
  const editorEl = await page.$('.se-editor, .se-content-editor, [contenteditable="true"]');
  if (editorEl) {
    await editorEl.click();
    await sleep(500);
    
    try {
      await page.evaluate(async (dataUrl) => {
        const blob = await (await fetch(dataUrl)).blob();
        const dt = new DataTransfer();
        dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        document.activeElement.dispatchEvent(pasteEvent);
      }, dataUrl);
      console.log('Clipboard paste dispatched');
      await sleep(3000);
      return true;
    } catch (e) {
      console.log('Clipboard paste failed:', e.message);
    }
  }
  
  return false;
}

async function centerAlignImages(page) {
  console.log('Applying center alignment to images...');
  
  try {
    const ctx = await getSE4Context(page);
    const target = ctx.page;
    
    // Find image components and add center alignment
    await target.evaluate(() => {
      // Try multiple selector patterns
      const selectors = [
        '.se-image-component',
        '.se-component.se-image',
        '.se-component[contenteditable] .se-image-component',
        '.se-component > div[style*="width"]',  // image containers
        '.se-component.se-section-image',
        '.se-module-image',
        '.se-image'
      ];
      
      let images = [];
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) {
          images = found;
          console.log(`Found ${found.length} images via: ${sel}`);
          break;
        }
      }
      
      if (images.length === 0) {
        // Fallback: any wrapper that contains img tag
        images = document.querySelectorAll('.se-component, .se-component-wrapper');
        images = Array.from(images).filter(el => el.querySelector('img'));
      }
      
      console.log(`Total images to align: ${images.length}`);
      
      images.forEach((img, i) => {
        // Add inline style
        (img).style.textAlign = 'center';
        (img).style.display = 'block';
        (img).style.marginLeft = 'auto';
        (img).style.marginRight = 'auto';
      });
      
      // Dispatch change event to notify SE4
      document.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    });
    
    console.log('Center alignment applied');
    return true;
  } catch (e) {
    console.log('Center alignment error:', e.message);
    return false;
  }
}

async function saveBlog(page) {
  console.log('Attempting to save blog post...');
  
  // Try various save button selectors
  const saveSelectors = [
    'button:has-text("저장")',
    'text=저장',
    'a:has-text("저장")',
    '[class*="save"]',
    '[data-testid*="save"]',
    function() { return document.querySelector('button:has-text("저장")'); }
  ];
  
  for (const sel of saveSelectors) {
    try {
      if (typeof sel === 'function') {
        const el = await page.evaluate(sel);
        if (el) {
          console.log('Found save button via function');
          await page.evaluate((el) => {
            // Get element's selector info for clicking
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            el.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
          }, el);
          await sleep(3000);
          return true;
        }
      } else {
        const el = await page.$(sel);
        if (el) {
          console.log(`Found save button via: ${sel}`);
          await el.click();
          await sleep(3000);
          return true;
        }
      }
    } catch (e) {
      console.log(`Save button selector failed: ${sel} - ${e.message}`);
    }
  }
  
  console.log('Auto-save failed. Post may be auto-saved by SE4 already.');
  return false;
}

async function verifySave(page) {
  await sleep(2000);
  
  // Check for success toast or confirmation
  const successMsg = await page.$('text=저장되었습니다');
  if (successMsg) {
    console.log('✅ Save confirmed: 저장되었습니다 message found');
    return true;
  }
  
  // Take screenshot for verification
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_save_result.png', fullPage: true });
  console.log('Save result screenshot saved');
  return false;
}

async function findParagraphAndClick(page, text) {
  // Find a paragraph containing the specified text and click near it
  const ctx = await getSE4Context(page);
  const target = ctx.page;
  
  // Search for the paragraph text
  const found = await target.evaluate((searchText) => {
    const paragraphs = document.querySelectorAll('.se-text-paragraph, p, .se-component-content span, .se-component-content div');
    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].textContent.includes(searchText)) {
        const rect = paragraphs[i].getBoundingClientRect();
        return { found: true, index: i, x: rect.left + rect.width / 2, y: rect.bottom + 20, text: paragraphs[i].textContent.trim().substring(0, 50) };
      }
    }
    return { found: false, total: paragraphs.length };
  }, text);
  
  console.log(`Search for "${text}": ${JSON.stringify(found)}`);
  
  if (found && found.found) {
    // Click below the paragraph to position cursor after it
    await target.mouse.click(found.x, found.y);
    await sleep(500);
    return true;
  }
  return false;
}

async function main() {
  console.log('=== 블로그 이미지 삽입 시작 ===');
  
  // Verify all images exist
  for (const img of IMAGE_MAP) {
    if (!fs.existsSync(img.file)) {
      console.error(`❌ Image not found: ${img.file}`);
      process.exit(1);
    }
    console.log(`✅ Image found: ${img.file}`);
  }
  
  let browser, page;
  
  try {
    const conn = await connectChrome();
    browser = conn.browser;
    page = conn.page;
    
    // Step 1: Navigate and enter edit mode
    console.log('\n--- Step 1: Enter edit mode ---');
    const editSuccess = await navigateToEdit(page);
    
    if (!editSuccess) {
      console.log('Could not auto-enter edit mode. Trying alternative URL...');
      // Try direct SmartEdit URL
      const editUrl = POST_URL.replace('PostView.naver', 'PostEdit.naver');
      await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(5000);
      await waitForSE4Editor(page);
    }
    
    // Step 2-7: Insert each image
    for (let i = 0; i < IMAGE_MAP.length; i++) {
      const img = IMAGE_MAP[i];
      console.log(`\n--- Step ${i + 2}: Insert ${img.marker} (${path.basename(img.file)}) ---`);
      
      // Navigate cursor to correct position
      if (img.afterText) {
        const found = await findParagraphAndClick(page, img.afterText);
        if (!found) {
          console.warn(`⚠️ Could not find paragraph with text: "${img.afterText}". Trying cursor at end of editor.`);
        }
      } else {
        // First image: click at the beginning (after first paragraph)
        const ctx = await getSE4Context(page);
        const target = ctx.page;
        const firstPara = await target.$('.se-text-paragraph');
        if (firstPara) {
          const box = await firstPara.boundingBox();
          if (box) {
            await target.mouse.click(box.x + box.width / 2, box.y + box.height + 20);
          }
        }
        await sleep(500);
      }
      
      // Insert image
      const inserted = await insertImageAtCursor(page, img.file);
      if (!inserted) {
        console.error(`❌ Failed to insert image: ${img.file}`);
        console.log('Manual intervention needed for this image.');
      } else {
        console.log(`✅ Image inserted: ${img.marker}`);
      }
      
      await sleep(2000);
    }
    
    // Step 8: Center align images
    console.log('\n--- Step 8: Center align images ---');
    await centerAlignImages(page);
    await sleep(1000);
    
    // Step 9: Save
    console.log('\n--- Step 9: Save ---');
    const saved = await saveBlog(page);
    
    // Verify
    console.log('\n--- Step 10: Verify save ---');
    // Take final screenshot
    await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_final_state.png', fullPage: true });
    console.log('Final state screenshot saved');
    
    // Try to verify
    const verified = await verifySave(page);
    
    // Summary
    console.log('\n=== 결과 보고 ===');
    console.log(`포스트: ${POST_URL}`);
    console.log(`이미지 목록:`);
    for (const img of IMAGE_MAP) {
      const exists = fs.existsSync(img.file);
      console.log(`  ${exists ? '✅' : '❌'} ${img.marker}: ${path.basename(img.file)}`);
    }
    console.log(`저장 상태: ${saved ? '✅ 저장 버튼 클릭 완료' : '⚠️ 수동 저장 필요'}`);
    console.log(`저장 확인: ${verified ? '✅ 확인됨' : '⚠️ 미확인 (스크린샷 참조)'}`);
    
    // Don't close browser, just disconnect
    browser.disconnect();
    console.log('\n🔌 Disconnected from browser. 브라우저는 유지됨.');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    try {
      if (browser) browser.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

main();
