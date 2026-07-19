// SE4 — _documentService 완전 탐색 + setContents 시도
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  const blogPage = await ctx.newPage();
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(8000);
  
  // 2. SE4 API 완전 탐색
  console.log('2️⃣ DocumentService 완전 탐색...');
  const dsMethods = await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (!ed || !ed._documentService) return null;
    const ds = ed._documentService;
    const all = new Set();
    let proto = ds;
    while (proto && proto !== Object.prototype) {
      Object.getOwnPropertyNames(proto).forEach(n => {
        if (n !== 'constructor' && typeof proto[n] === 'function') all.add(n);
      });
      proto = Object.getPrototypeOf(proto);
    }
    const ownProps = Object.getOwnPropertyNames(ds).filter(n => !n.startsWith('_'));
    return { methods: [...all].sort(), own: ownProps };
  });
  console.log('DocumentService:', JSON.stringify(dsMethods, null, 2));
  
  // 3. EditingService 메서드
  const esMethods = await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (!ed || !ed._editingService) return null;
    const es = ed._editingService;
    const all = new Set();
    let proto = es;
    while (proto && proto !== Object.prototype) {
      Object.getOwnPropertyNames(proto).forEach(n => {
        if (n !== 'constructor' && typeof proto[n] === 'function') all.add(n);
      });
      proto = Object.getPrototypeOf(proto);
    }
    return [...all].sort();
  });
  console.log('EditingService:', JSON.stringify(esMethods, null, 2));
  
  // 4. VirtualEditable 메서드
  const veMethods = await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (!ed || !ed._virtualEditable) return null;
    const ve = ed._virtualEditable;
    const all = new Set();
    let proto = ve;
    while (proto && proto !== Object.prototype) {
      Object.getOwnPropertyNames(proto).forEach(n => {
        if (n !== 'constructor' && typeof proto[n] === 'function') all.add(n);
      });
      proto = Object.getPrototypeOf(proto);
    }
    return [...all].sort();
  });
  console.log('VirtualEditable:', JSON.stringify(veMethods, null, 2));
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });