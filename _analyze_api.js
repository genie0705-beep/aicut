const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('=== SmartEditor 전체 API 분석 ===\n');
  
  // 1. SmartEditor의 모든 메서드와 속성
  const apiInfo = await page.evaluate(() => {
    const results = {};
    
    // SmartEditor global
    results.globalKeys = Object.keys(SmartEditor || {}).filter(k => !k.startsWith('_'));
    results.globalAllKeys = Object.keys(SmartEditor || {}).slice(0, 30);
    
    // Editor instance for blogpc001
    const editor = SmartEditor._editors && SmartEditor._editors['blogpc001'];
    if (!editor) {
      results.editorExists = false;
      results.allEditorKeys = Object.keys(SmartEditor._editors || {});
      return results;
    }
    
    results.editorExists = true;
    
    // Get all method names (functions)
    const methods = [];
    const props = [];
    let proto = editor;
    while (proto) {
      Object.getOwnPropertyNames(proto).forEach(k => {
        if (typeof proto[k] === 'function' && !k.startsWith('_') && !methods.includes(k)) {
          methods.push(k);
        } else if (!k.startsWith('_') && !props.includes(k)) {
          try { 
            const v = editor[k];
            if (typeof v !== 'function' && typeof v !== 'object') props.push(k + '=' + String(v).substring(0, 30));
          } catch(e) {}
        }
      });
      proto = Object.getPrototypeOf(proto);
      if (proto && proto.constructor && proto.constructor.name === 'Object') break;
    }
    
    results.methods = methods.sort();
    results.props = props;
    
    // Try specific known methods
    const methodTests = {};
    ['setDocumentData', 'setContent', 'getDocumentData', 'getContent', 'getDocumentTitle', 'setDocumentTitle', 
     'insertDocumentData', 'appendDocumentData', 'setHtml', 'setText'].forEach(m => {
      try {
        if (typeof editor[m] === 'function') {
          methodTests[m] = 'function exists';
          // Try calling with empty string to test
          // Don't actually modify content here
        } else {
          methodTests[m] = typeof editor[m];
        }
      } catch(e) { methodTests[m] = 'error: ' + e.message; }
    });
    results.methodTests = methodTests;
    
    // Check editor's internal state
    try { results.currentTitle = editor.getDocumentTitle(); } catch(e) {}
    
    return results;
  });
  
  console.log('--- SmartEditor 전역 키 (일부) ---');
  console.log('  전체 키:', apiInfo.globalAllKeys.join(', '));
  console.log('  공개 키:', apiInfo.globalKeys.join(', '));
  
  console.log('\n--- Editor instance (blogpc001) ---');
  console.log('  존재:', apiInfo.editorExists);
  if (!apiInfo.editorExists) {
    console.log('  사용 가능한 에디터:', apiInfo.allEditorKeys.join(', '));
  } else {
    console.log('  현재 제목:', apiInfo.currentTitle);
    console.log('  메서드 목록:', apiInfo.methods.join(', '));
    console.log('  속성 (일부):', apiInfo.props.join(', '));
    console.log('\n  주요 메서드 테스트:');
    Object.entries(apiInfo.methodTests).forEach(([k,v]) => console.log(`    ${k}: ${v}`));
  }
  
  // 2. 에디터 iframe 분석
  console.log('\n\n=== 에디터 iframe & contentEditable 분석 ===');
  const frameInfo = await page.evaluate(() => {
    const mf = document.querySelector('#mainFrame');
    if (!mf || !mf.contentDocument) return { error: 'no mainFrame' };
    
    const doc = mf.contentDocument;
    const body = doc.body;
    
    return {
      bodyTag: body.tagName,
      contentEditable: body.contentEditable,
      childCount: body.children.length,
      innerTextPreview: (body.innerText || '').substring(0, 200),
      firstChildTag: body.firstElementChild ? body.firstElementChild.tagName : 'none',
      firstChildHTML: body.firstElementChild ? body.firstElementChild.outerHTML.substring(0, 200) : 'none'
    };
  });
  console.log('  body 태그:', frameInfo.bodyTag);
  console.log('  contentEditable:', frameInfo.contentEditable);
  console.log('  자식 수:', frameInfo.childCount);
  console.log('  텍스트 미리보기:', frameInfo.innerTextPreview);
  console.log('  첫 자식 태그:', frameInfo.firstChildTag);
  console.log('  첫 자식 HTML:', frameInfo.firstChildHTML);
  
  // 3. HTML 붙여넣기 테스트 (새 탭에서)
  console.log('\n\n=== execCommand 테스트 ===');
  const cmdTest = await page.evaluate(() => {
    const mf = document.querySelector('#mainFrame');
    if (!mf || !mf.contentDocument) return 'no frame';
    const doc = mf.contentDocument;
    
    // Focus the editor
    const editorDiv = doc.querySelector('[contenteditable="true"]') || doc.body;
    if (!editorDiv) return 'no editable element';
    
    // Test execCommand support
    const tests = {
      supportsBold: typeof doc.queryCommandSupported === 'function' ? doc.queryCommandSupported('bold') : 'unknown',
      supportsInsertHTML: typeof doc.queryCommandSupported === 'function' ? doc.queryCommandSupported('insertHTML') : 'unknown',
      supportsFormatBlock: typeof doc.queryCommandSupported === 'function' ? doc.queryCommandSupported('formatBlock') : 'unknown',
      editorTag: editorDiv.tagName,
      editorId: editorDiv.id,
      editorClass: (editorDiv.className || '').substring(0, 80)
    };
    
    return tests;
  });
  console.log('  Bold 지원:', cmdTest.supportsBold);
  console.log('  insertHTML 지원:', cmdTest.supportsInsertHTML);
  console.log('  formatBlock 지원:', cmdTest.supportsFormatBlock);
  console.log('  에디터 요소:', cmdTest.editorTag, cmdTest.editorId, cmdTest.editorClass);
  
  // 4. SmartEditor._editors 더 자세히
  console.log('\n\n=== SmartEditor 인스턴스 상세 ===');
  const detailInfo = await page.evaluate(() => {
    const results = {};
    const editors = SmartEditor._editors || {};
    Object.keys(editors).forEach(key => {
      const ed = editors[key];
      const info = {};
      
      // Check important properties
      ['_editorType', '_doc', '_editorArea', '_iframe'].forEach(p => {
        try {
          const val = ed[p];
          if (typeof val === 'object' && val) {
            info[p] = val.tagName || val.constructor.name || 'object';
          } else {
            info[p] = String(val).substring(0, 50);
          }
        } catch(e) { info[p] = 'error'; }
      });
      
      results[key] = info;
    });
    return results;
  });
  Object.entries(detailInfo).forEach(([key, info]) => {
    console.log(`  ${key}:`, JSON.stringify(info));
  });
  
  console.log('\n=== 분석 완료 ===');
  
  await browser.close();
})();
