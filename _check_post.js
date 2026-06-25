// 게시물 이미지 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  
  var postPage = await ctx.newPage();
  await postPage.goto('https://blog.naver.com/aicut/224319537693', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(function(r) { setTimeout(r, 5000); });
  
  var mainFrame = null;
  for (var i = 0; i < postPage.frames().length; i++) {
    if (postPage.frames()[i].name() === 'mainFrame') { mainFrame = postPage.frames()[i]; break; }
  }
  
  if (!mainFrame) { console.log('mainFrame 없음'); await b.close(); return; }
  
  var imgInfo = await mainFrame.evaluate(function() {
    var r = { totalImgs: 0, postImgs: 0, postImgSrcs: [] };
    document.querySelectorAll('img').forEach(function(img) {
      r.totalImgs++;
      var src = (img.src || '');
      if (src.indexOf('aicut_blog_edu') >= 0) {
        r.postImgs++;
        r.postImgSrcs.push(src.substring(0, 80));
      }
    });
    return r;
  });
  
  console.log('이미지 확인:', JSON.stringify(imgInfo, null, 2));
  
  var content = await mainFrame.evaluate(function() {
    var postBody = document.querySelector('.se-main-container, .post-content, .blogview_content, [class*=\"postView\"]');
    if (postBody) return postBody.innerText.substring(0, 300);
    return (document.body.innerText || '').substring(0, 300);
  });
  
  console.log('\n본문:', content);
  
  await b.close();
})();
