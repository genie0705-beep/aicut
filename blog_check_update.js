const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  
  // Check if the editor tab is still open
  for (const pg of ctx.pages()) {
    const url = pg.url();
    
    if (url.includes('PostView.naver') && url.includes('224315539820')) {
      await pg.bringToFront();
      await pg.waitForTimeout(3000);
      
      const frame = pg.frame({ name: 'mainFrame' });
      if (frame) {
        const imgInfo = await frame.evaluate(() => {
          const imgs = document.querySelectorAll('img');
          return {
            count: imgs.length,
            sources: Array.from(imgs).slice(0, 3).map(i => i.src.substring(0, 80))
          };
        }).catch(() => ({ count: 0, sources: [] }));
        console.log('PostView images:', JSON.stringify(imgInfo));
      } else {
        console.log('PostView - no mainFrame found');
        console.log('URL:', url.substring(0, 100));
        const text = await pg.evaluate(() => document.body.innerText.substring(0, 400)).catch(() => '');
        console.log('Body:', text.substring(0, 200));
      }
    }
  }
  
  // Also check the postupdate tab
  for (const pg of ctx.pages()) {
    if (pg.url().includes('postupdate')) {
      await pg.bringToFront();
      await pg.waitForTimeout(1000);
      console.log('\n✅ 에디터 탭 여전히 열려있음:', pg.url().substring(0, 100));
    }
  }
  
  await b.close();
}

main().catch(e => console.error(e.message));
