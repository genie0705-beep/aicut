const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  var pages = ctx.pages();
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('PostWriteForm')) {
      try {
        var info = await pages[i].evaluate(function() {
          try {
            var ed = SmartEditor._editors['blogpc001'];
            var len = ed.getContentText ? ed.getContentText().length : 0;
            var data = ed.getDocumentData ? ed.getDocumentData() : null;
            var imgCount = 0;
            if (data && data.document) {
              imgCount = data.document.components.filter(function(c) { return c['@ctype'] === 'image'; }).length;
            }
            return { len: len, imgs: imgCount };
          } catch(e) { return { len: -1, imgs: -1 }; }
        });
        if (info.len > 0 || info.imgs > 0) {
          console.log(i + ': len=' + info.len + ' imgs=' + info.imgs);
        }
      } catch(e) { console.log(i + ': error'); }
    }
  }
  await b.close();
})();
