const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    
    // 기존 Redirect=Update 탭 닫고 새로 열기
    for (const p of ctx.pages()) {
      if (p.url().includes('Redirect=Update') || p.url().includes('PostUpdate')) {
        await p.close().catch(() => {});
      }
    }
    
    // 새 탭 열기
    const page = await ctx.newPage();
    page.on('dialog', async (d) => await d.dismiss());
    
    await page.goto('https://blog.naver.com/aicut?Redirect=Update&logNo=224326578253', {
      timeout: 30000, waitUntil: 'domcontentloaded'
    }).catch(() => {});
    console.log('페이지 로드:', page.url().substring(0, 80));
    await page.waitForTimeout(6000);
    
    // PostUpdateForm 찾기
    let pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) {
      console.log('PostUpdateForm 없음, 프레임:');
      page.frames().forEach(f => console.log(' -', f.url().substring(0, 100)));
      // 리다이렉트 처리
      await page.goto('https://blog.naver.com/aicut?Redirect=Update&logNo=224326578253', {
        timeout: 30000, waitUntil: 'domcontentloaded'
      }).catch(() => {});
      await page.waitForTimeout(6000);
      pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
      if (!pf) { await ctx.close(); return; }
    }
    console.log('PostUpdateForm 발견');
    
    // SE4 주요 서비스 메서드 탐색
    const apiDetail = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      const ds = se._documentService;
      
      // _editingService 메서드
      const es = se._editingService;
      const esMethods = es ? Object.getOwnPropertyNames(Object.getPrototypeOf(es)).filter(k => typeof es[k] === 'function') : [];
      
      // _documentService의 모든 메서드 (재확인)
      const dsMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(ds)).filter(k => typeof ds[k] === 'function');
      
      // _componentFactory 상세
      const factory = ds._componentFactory;
      const factoryMethods = factory ? Object.getOwnPropertyNames(Object.getPrototypeOf(factory)) : [];
      
      return {
        editingServiceMethods: esMethods.slice(0, 30),
        docServiceMethods: dsMethods.slice(0, 30),
        factoryMethods: factoryMethods.slice(0, 20),
        factoryAvailableTypes: factory ? factory.getAvailableCompType() : []
      };
    }).catch(e => ({ error: e.message }));
    console.log('API 상세:', JSON.stringify(apiDetail, null, 2));
    
    // _editingService에 텍스트 설정 메서드가 있는지 확인
    const editingOps = apiDetail.editingServiceMethods || [];
    const insertMethods = editingOps.filter(m => 
      m.includes('insert') || m.includes('set') || m.includes('replace') || m.includes('add') || m.includes('input')
    );
    if (insertMethods.length > 0) {
      console.log('편집 메서드 발견:', insertMethods);
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
    console.error(e.stack);
  }
})();
