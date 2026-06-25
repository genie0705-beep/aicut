const WebSocket = require('ws');
const http = require('http');

const CDP_PORT = 9224;
const LIST_URL = 'https://editmon.com/work/employ_list.html';
const MAX_PAGES = 10;
const allResults = [];
const failedPosts = [];

function getTargets() {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:${CDP_PORT}/json`, r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
    });
}

// Direct CDP connection to a page target
class PageClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this._msgHandlers = new Map();
        this._eventHandlers = new Map();
        this._msgId = 1;
    }
    
    async connect() {
        this.ws = new WebSocket(this.wsUrl);
        await new Promise((resolve, reject) => {
            this.ws.on('open', resolve);
            this.ws.on('error', reject);
            setTimeout(() => reject(new Error('WS timeout')), 10000);
        });
        
        this.ws.on('message', (data) => {
            try {
                const p = JSON.parse(data.toString());
                if (p.id && this._msgHandlers.has(p.id)) {
                    this._msgHandlers.get(p.id)(p);
                    this._msgHandlers.delete(p.id);
                }
                if (p.method && this._eventHandlers.has(p.method)) {
                    this._eventHandlers.get(p.method)(p);
                }
            } catch(e) {}
        });
    }
    
    on(event, handler) {
        this._eventHandlers.set(event, handler);
    }
    
    async send(method, params = {}) {
        const id = this._msgId++;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this._msgHandlers.delete(id);
                reject(new Error(`Timeout: ${method}`));
            }, 20000);
            
            this._msgHandlers.set(id, (p) => {
                clearTimeout(timeout);
                if (p.error) reject(new Error(p.error.message));
                else resolve(p);
            });
            
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }
    
    async eval(expr) {
        const r = await this.send('Runtime.evaluate', {
            expression: expr,
            returnByValue: true,
            awaitPromise: true
        });
        if (r.result?.exceptionDetails) {
            console.log('  JS Warn:', r.result.exceptionDetails.text);
            return null;
        }
        return r.result?.result?.value;
    }
    
    async navigate(url) {
        const loadPromise = new Promise(resolve => {
            this.on('Page.frameStoppedLoading', resolve);
            this.on('Page.loadEventFired', resolve);
            setTimeout(() => resolve(), 15000);
        });
        await this.send('Page.navigate', { url });
        await loadPromise;
        await new Promise(r => setTimeout(r, 1500));
    }
    
    close() {
        if (this.ws) this.ws.close();
    }
}

// Extract email from text
function extractEmail(text) {
    if (!text) return null;
    const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return m ? m[0].replace(/[<>()"]/g, '').trim() : null;
}

async function main() {
    try {
        const targets = await getTargets();
        const editmonTarget = targets.find(t => t.url && t.url.includes('editmon.com'));
        
        if (!editmonTarget) {
            console.log('No editmon tab found!');
            console.log('Available pages:', targets.filter(t=>t.type==='page').map(t=>t.title).join(', '));
            return;
        }
        
        console.log(`Using tab: ${editmonTarget.title}`);
        
        const page = new PageClient(editmonTarget.webSocketDebuggerUrl);
        await page.connect();
        console.log('Connected');
        
        // Enable domains
        await page.send('Page.enable');
        await page.send('Runtime.enable');
        console.log('Domains enabled');
        
        // Navigate to listing page
        console.log('\nNavigating to listing...');
        await page.navigate(LIST_URL);
        console.log('Title:', await page.eval('document.title'));
        
        for (let pn = 1; pn <= MAX_PAGES; pn++) {
            const url = pn === 1 ? LIST_URL : `${LIST_URL}?page=${pn}`;
            console.log(`\n=== Page ${pn} ===`);
            
            await page.navigate(url);
            console.log('  URL:', await page.eval('window.location.href'));
            
            // Extract links - try multiple selectors
            let links = await page.eval(`
                (() => {
                    const items = [];
                    const anchors = document.querySelectorAll('a[href*="employ_detail.html?no="]');
                    const seen = new Set();
                    anchors.forEach(a => {
                        const href = a.getAttribute('href');
                        const m = href && href.match(/no=(\\d+)/);
                        if (m && !seen.has(m[1])) {
                            seen.add(m[1]);
                            const tr = a.closest('tr');
                            const cells = tr ? tr.querySelectorAll('td') : [];
                            let company = '', title = '';
                            cells.forEach((td, i) => {
                                const txt = td.textContent.trim();
                                if (i === 1) company = txt;
                                if (i === 2) title = txt;
                            });
                            if (!title) title = a.textContent.trim();
                            const fullUrl = href.startsWith('http') ? href : 'https://editmon.com/work/' + href;
                            items.push({ no: m[1], url: fullUrl, company, title });
                        }
                    });
                    return items;
                })()
            `);
            
            if (!links || links.length === 0) {
                console.log('  No links found');
                // Debug: dump table HTML
                const dbg = await page.eval(`(function(){
                    const t = document.querySelector('table');
                    return t ? t.outerHTML.substring(0,1000) : 'no table';
                })()`);
                console.log('  Debug:', dbg ? dbg.substring(0,300) : 'null');
                continue;
            }
            
            console.log(`  Found ${links.length} posts`);
            
            for (let i = 0; i < links.length; i++) {
                const post = links[i];
                process.stdout.write(`  [${i+1}/${links.length}] #${post.no}`);
                
                try {
                    await page.navigate(post.url);
                    
                    // Extract info
                    const info = await page.eval(`
                        (() => {
                            const text = document.body.textContent;
                            const r = { email: null, mailto: null, company: '', title: '' };
                            
                            // Email from text
                            const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
                            if (m) r.email = m[0];
                            
                            // mailto link
                            const ml = document.querySelector('a[href^="mailto:"]');
                            if (ml) r.mailto = ml.getAttribute('href').replace('mailto:','').split('?')[0];
                            
                            // Company
                            const h4 = document.querySelector('h4');
                            if (h4) r.company = h4.textContent.trim();
                            
                            // Table info
                            const tbl = document.querySelector('table');
                            if (tbl) {
                                tbl.querySelectorAll('tr').forEach(row => {
                                    const th = row.querySelector('th');
                                    const td = row.querySelector('td');
                                    if (th && td) {
                                        const l = th.textContent.trim();
                                        if (l.includes('업체명') || l.includes('회사명')) r.company = td.textContent.trim();
                                        if (l.includes('제목')) r.title = td.textContent.trim();
                                    }
                                });
                            }
                            
                            return r;
                        })()
                    `);
                    
                    const email = info?.email || info?.mailto;
                    
                    if (email && email.includes('@')) {
                        allResults.push({
                            no: post.no,
                            company: info?.company || post.company || 'N/A',
                            title: info?.title || post.title || 'N/A',
                            email,
                            url: post.url
                        });
                        console.log(` ✅ ${email}`);
                    } else {
                        // Try raw text extraction
                        const pageText = await page.eval('document.body.innerText');
                        const extracted = extractEmail(pageText);
                        if (extracted) {
                            allResults.push({
                                no: post.no,
                                company: info?.company || post.company || 'N/A',
                                title: info?.title || post.title || 'N/A',
                                email: extracted,
                                url: post.url
                            });
                            console.log(` ✅ ${extracted}`);
                        } else {
                            failedPosts.push({
                                no: post.no,
                                url: post.url,
                                company: info?.company || post.company || 'N/A',
                                title: info?.title || post.title || 'N/A',
                                reason: '이메일 없음'
                            });
                            console.log(` ❌`);
                        }
                    }
                } catch (err) {
                    console.log(` ❌ Error: ${err.message}`);
                    failedPosts.push({
                        no: post.no,
                        url: post.url,
                        company: 'N/A',
                        title: 'N/A',
                        reason: `오류: ${err.message}`
                    });
                }
            }
        }
        
        page.close();
        
        // Output
        console.log('\n\n========================================');
        console.log('=== 편집몬 이메일 수집 결과 ===');
        console.log(`총 ${allResults.length}개 수집 (1~${MAX_PAGES}페이지)`);
        console.log('========================================\n');
        
        allResults.forEach((r, i) => {
            console.log(`${i+1}. ${r.company} - ${r.title}`);
            console.log(`   이메일: ${r.email}`);
            console.log(`   링크: ${r.url}\n`);
        });
        
        if (failedPosts.length > 0) {
            console.log('\n수집 실패:');
            failedPosts.forEach((r, i) => {
                console.log(`  ${i+1}. #${r.no} ${r.company} - ${r.title}`);
                console.log(`     ${r.url} - ${r.reason}`);
            });
        }
        
        console.log('\n===JSON_START===');
        console.log(JSON.stringify({ success: allResults, failed: failedPosts }));
        console.log('===JSON_END===');
        
    } catch(err) {
        console.error('FATAL:', err.message);
        console.error(err.stack);
    }
}

main();
