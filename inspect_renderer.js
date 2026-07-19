const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    await p.bringToFront();
    await sleep(1000);

    const renderInfo = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed) return { error: 'no ed' };
      
      const r = {};
      
      // renderer
      if (ed._renderer) {
        const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(ed._renderer));
        r.rendererMethods = keys.filter(k => k.includes('render') || k.includes('update') || k.includes('refresh')).slice(0, 10);
      }
      
      // canvasLayoutService
      if (ed._canvasLayoutService) {
        const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(ed._canvasLayoutService));
        r.layoutMethods = keys.filter(k => k.includes('render') || k.includes('update')).slice(0, 10);
      }
      
      // stateUpdateBroadcaster
      if (ed._stateUpdateBroadcaster) {
        const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(ed._stateUpdateBroadcaster));
        r.broadcastMethods = keys.slice(0, 10);
      }

      // _documentService에서 documentData 재설정 없이 알림만 보내는 방법
      if (ed._documentService) {
        const ds = ed._documentService;
        const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(ds));
        r.dsMethods = proto.filter(k => k.includes('set') || k.includes('update') || k.includes('notify') || k.includes('change')).slice(0, 10);
      }

      return r;
    });

    console.log(JSON.stringify(renderInfo, null, 2));
    break; // just one tab
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
