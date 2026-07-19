const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const postPage = pages[2];
  await postPage.goto('https://blog.naver.com/aicut/224348766674', {waitUntil:'networkidle',timeout:20000});
  await postPage.waitForTimeout(5000);
  const fe = await postPage.$('#mainFrame');
  const f = await fe.contentFrame();
  await f.waitForTimeout(2000);
  const r = await f.evaluate(() => {
    const body = document.body.innerText || '';
    const lines = body.split('\n').filter(l => l.trim());
    const titleLines = lines.filter(l => l.includes('피부과 영상 마케팅'));
    return { titleLines, totalLines: lines.length, preview: lines.slice(0, 25) };
  });
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}
main().catch(e => console.error(e.message));
