const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const lines = ft.split('\n');
    const imgs = document.querySelectorAll('img');
    return {
      chars: ft.length, lines: lines.length, imgs: imgs.length,
      hasMerge: ft.includes('알려드립니다.☀'),
      preview: lines.slice(0, 15)
    };
  });
  console.log('본문:', r.chars + '자 / ' + r.lines + '줄');
  console.log('이미지:', r.imgs + '장');
  console.log('머지:', r.hasMerge);
  console.log('\n처음 15줄:');
  r.preview.forEach((l, i) => console.log('[' + i + '] "' + l + '"'));
  await b.close();
}
main().catch(e => console.log('err', e.message));
