const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  let targetFrame = null;
  let targetPage = null;

  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        try {
          if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
            targetPage = p;
            targetFrame = f;
            break;
          }
        } catch(e) {}
      }
    }
    if (targetFrame) break;
  }

  if (!targetFrame) { console.log('no editor'); await b.close(); return; }

  console.log('Editor found');
  console.log('URL:', targetFrame.url().substring(0, 100));

  // Check image components in detail
  const imgInfo = await targetFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const comps = data.document.components;

    const imageComps = comps.filter(c => c['@ctype'] === 'image');
    const textComps = comps.filter(c => c['@ctype'] === 'text');

    // Check image URLs
    const imgDetails = imageComps.map(c => {
      return {
        id: c.id,
        src: (c.src || '').substring(0, 100),
        srcType: c.src ? (c.src.startsWith('data:') ? 'dataURI' : c.src.startsWith('http') ? 'http' : 'empty') : 'undefined',
        align: c.align,
        caption: c.caption,
        link: c.link ? c.link.substring(0, 60) : null,
        width: c.width,
        height: c.height,
        alt: c.alt || '',
        // Check meta
        meta: c.meta ? JSON.stringify(c.meta).substring(0, 100) : null,
      };
    });

    return {
      totalComps: comps.length,
      images: imageComps.length,
      texts: textComps.length,
      imageDetails: imgDetails,
      firstTextPreview: textComps.length > 0 ? JSON.stringify(textComps[0]).substring(0, 200) : 'none',
    };
  });

  console.log(JSON.stringify(imgInfo, null, 2));

  // Check if there's a "발행" button that's visible
  const btnInfo = await targetFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    const result = [];
    for (const btn of btns) {
      const text = btn.textContent.trim();
      if (text === '발행' || text === '저장') {
        const rect = btn.getBoundingClientRect();
        result.push({
          text,
          visible: btn.offsetParent !== null,
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          inPopup: !!btn.closest('.layer_popup'),
          cls: (btn.className || '').substring(0, 40),
        });
      }
    }
    return result;
  });
  console.log('\n발행/저장 버튼들:', JSON.stringify(btnInfo, null, 2));

  await b.close();
})().catch(e => console.log('E:', e.message));
