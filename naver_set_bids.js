const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  const HIGH = ['영상편집', '동영상편집', '영상제작', '동영상제작', '숏폼영상제작', '숏폼영상편집', '인스타그램릴스'];
  const MED = ['영상편집대행', '영상편집가격', '영상마케팅', '유튜브영상편집', '릴스제작', '릴스편집', '인스타그램영상편집', '인스타릴스편집', '컴퓨터영상편집', '영상편집외주', '유튜브동영상편집'];

  function targetBid(kw) {
    if (HIGH.includes(kw)) return '1800';
    if (MED.includes(kw)) return '1600';
    return null;
  }

  async function editBid(kw, bid) {
    // Find and click the keyword's bid button
    const r1 = await page.evaluate(({ kw }) => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'));
        const el = row.querySelector('.keyword_text') || cells[2];
        const t = (el?.innerText || cells[2]?.innerText || '').trim().replace(/\s+/g, ' ');
        if (t !== kw) continue;
        const st = (cells[3]?.innerText || '').trim();
        if (st.includes('중지')) return 'off';
        const btn = row.querySelector('.input-bid-amt');
        if (!btn) return 'nobtn';
        btn.click();
        btn.scrollIntoView({ block: 'center' });
        return 'ok';
      }
      return 'notfound';
    }, { kw });

    if (r1 !== 'ok') return r1;

    await new Promise(r => setTimeout(r, 800));

    // Set the input value and click 변경
    const r2 = await page.evaluate(({ bid }) => {
      const inp = document.querySelector('input.ad-cms-input-number-input');
      if (!inp) return 'noinput';
      const allBtns = Array.from(document.querySelectorAll('button'));
      const changeBtn = allBtns.find(b => b.innerText?.trim() === '변경' && b.offsetParent !== null);
      
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(inp, bid);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));

      if (changeBtn) {
        changeBtn.click();
        return 'done';
      }
      return 'set_no_change';
    }, { bid });

    await new Promise(r => setTimeout(r, 800));
    return r2;
  }

  let done = 0;
  let skipped = 0;
  let err = 0;
  const log = [];

  // Go to page 1
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  for (let p = 1; p <= 12; p++) {
    if (p > 1) {
      const ok = await page.evaluate(({ p }) => {
        const els = Array.from(document.querySelectorAll('button, li, a, span'));
        const el = els.find(e => e.innerText?.trim() === String(p) && e.offsetParent !== null);
        if (el) { el.click(); return true; }
        return false;
      }, { p });

      if (!ok) {
        const nok = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('button, li, a'));
          const e = els.find(x => (x.innerText?.trim() === '다음' || x.getAttribute('aria-label') === '다음') && !x.disabled);
          if (e) { e.click(); return true; }
          return false;
        });
        if (!nok) break;
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    // Get target keywords on this page
    const kws = await page.evaluate(({ high, med }) => {
      const all = [...high, ...med];
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const el = row.querySelector('.keyword_text') || cells[2];
        return (el?.innerText || cells[2]?.innerText || '').trim().replace(/\s+/g, ' ');
      }).filter(k => all.includes(k));
    }, { high: HIGH, med: MED });

    if (kws.length === 0) continue;

    console.log('\n=== 페이지 ' + p + ' ===');
    for (const kw of kws) {
      const bid = targetBid(kw);
      const r = await editBid(kw, bid);
      const status = r === 'done' ? '✅' : r === 'off' ? '⏭️' : '❌';
      const msg = status + ' ' + kw + ' → ' + bid + '원 [' + r + ']';
      console.log('  ' + msg);
      log.push(msg);
      if (r === 'done') done++;
      else if (r === 'off') skipped++;
      else err++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 결과: 완료 ' + done + ' / SKIP ' + skipped + ' / 오류 ' + err);
  console.log('전체: ' + (done + skipped + err) + '개');

  await b.close();
})().catch(e => console.log('ERR:', e.message));
