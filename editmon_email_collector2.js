const WebSocket = require('ws');
const http = require('http');

const CDP_PORT = 9224;
const BASE_URL = 'https://editmon.com/work';
const LIST_URL = `${BASE_URL}/employ_list.html`;
const MAX_PAGES = 10;

const allResults = [];
const failedPosts = [];

// Get browser WebSocket URL
async function getBrowserWSUrl() {
    const data = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${CDP_PORT}/json/version`, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
    });
    return data.webSocketDebuggerUrl;
}

// Get all targets
async function getTargets() {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:${CDP_PORT}/json`, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
    });
}

// Connect to a target
function connect(wsUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => resolve(ws));
        ws.on('error', reject);
        setTimeout(() => reject(new Error('WS timeout')), 10000);
    });
}

// Send CDP command
async function send(ws, method, params = {}) {
    const id = Date.now() + Math.random();
    ws.send(JSON.stringify({ id, method, params }));
    
    return new Promise((resolve, reject) => {
        let done = false;
        const handler = (data) => {
            try {
                const p = JSON.parse(data.toString());
                if (p.id === id) {
                    done = true;
                    ws.removeListener('message', handler);
                    if (p.error) reject(new Error(p.error.message));
                    else resolve(p);
                }
            } catch (e) {}
        };
        ws.on('message', handler);
        setTimeout(() => {
            if (!done) {
                ws.removeListener('message', handler);
                reject(new Error(`Timeout: ${method}`));
            }
        }, 15000);
    });
}

// Evaluate JS
async function evalJS(ws, expr) {
    const r = await send(ws, 'Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
        timeout: 10000
    });
    if (r.result?.exceptionDetails) return null;
    return r.result?.result?.value;
}

async function main() {
    try {
        const browserWsUrl = await getBrowserWSUrl();
        console.log('Browser WS URL:', browserWsUrl);
        
        const bws = await connect(browserWsUrl);
        console.log('Connected to browser');
        
        // Create a new tab for our work
        const createResult = await send(bws, 'Target.createTarget', {
            url: 'about:blank',
            windowOpen: false,
            newWindow: false
        });
        const targetId = createResult.result.targetId;
        console.log('Created new tab:', targetId);
        
        // Get the page URL for this target
        const targets = await getTargets();
        const newTarget = targets.find(t => t.id === targetId);
        if (!newTarget) {
            console.log('New target not found yet, waiting...');
            await new Promise(r => setTimeout(r, 2000));
        }
        
        // Connect to the new target
        const pageWsUrl = `ws://localhost:${CDP_PORT}/devtools/page/${targetId}`;
        const ws = await connect(pageWsUrl);
        console.log('Connected to new tab');
        
        // Navigate to listing page
        console.log('\nNavigating to listing page...');
        await send(ws, 'Page.enable');
        
        // Wait for load after navigation
        const loadPromise = new Promise(resolve => {
            const handler = (data) => {
                try {
                    const p = JSON.parse(data.toString());
                    if (p.method === 'Page.loadEventFired') resolve();
                } catch (e) {}
            };
            ws.on('message', handler);
            setTimeout(() => { ws.removeListener('message', handler); resolve(); }, 20000);
        });
        
        await send(ws, 'Page.navigate', { url: LIST_URL });
        await loadPromise;
        await new Promise(r => setTimeout(r, 2000));
        
        console.log('Page loaded, title:', await evalJS(ws, 'document.title'));
        
        for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
            const pageUrl = pageNum === 1 ? LIST_URL : `${LIST_URL}?page=${pageNum}`;
            console.log(`\n=== Page ${pageNum} ===`);
            
            const loadPromise2 = new Promise(resolve => {
                const handler = (data) => {
                    try {
                        const p = JSON.parse(data.toString());
                        if (p.method === 'Page.loadEventFired') {
                            ws.removeListener('message', handler);
                            resolve();
                        }
                    } catch (e) {}
                };
                ws.on('message', handler);
                setTimeout(() => { ws.removeListener('message', handler); resolve(); }, 20000);
            });
            
            await send(ws, 'Page.navigate', { url: pageUrl });
            await loadPromise2;
            await new Promise(r => setTimeout(r, 2000));
            
            const currentUrl = await evalJS(ws, 'window.location.href');
            console.log('URL:', currentUrl);
            
            // Extract post links
            const links = await evalJS(ws, `
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
                            let company = '';
                            let title = a.textContent.trim();
                            if (cells.length >= 2) {
                                company = cells[0].textContent.trim();
                                // title might be in a different cell
                            }
                            // Try to get title from company cell + title cell
                            if (cells.length >= 1) {
                                // cells[0] might be the number, [1] company, [2] title
                                const allText = tr ? tr.textContent : '';
                            }
                            const fullUrl = href.startsWith('http') ? href : 'https://editmon.com/work/' + href;
                            items.push({ no: m[1], url: fullUrl });
                        }
                    });
                    return items;
                })()
            `);
            
            console.log(`Found ${links ? links.length : 0} posts`);
            
            if (!links || links.length === 0) {
                // Try alternate selectors
                console.log('No links found with primary selector, trying HTML dump...');
                const html = await evalJS(ws, `(document.querySelector('table') || document.body).outerHTML.substring(0, 2000)`);
                console.log('HTML snippet:', html ? html.substring(0, 500) : 'null');
                continue;
            }
            
            for (let i = 0; i < links.length; i++) {
                const post = links[i];
                console.log(`  [${i+1}/${links.length}] Post #${post.no}`);
                
                try {
                    const loadPromise3 = new Promise(resolve => {
                        const handler = (data) => {
                            try {
                                const p = JSON.parse(data.toString());
                                if (p.method === 'Page.loadEventFired') {
                                    ws.removeListener('message', handler);
                                    resolve();
                                }
                            } catch (e) {}
                        };
                        ws.on('message', handler);
                        setTimeout(() => { ws.removeListener('message', handler); resolve(); }, 20000);
                    });
                    
                    await send(ws, 'Page.navigate', { url: post.url });
                    await loadPromise3;
                    await new Promise(r => setTimeout(r, 2000));
                    
                    // Extract info
                    const info = await evalJS(ws, `
                        (() => {
                            const result = { email: null, mailto: null, text: '' };
                            const text = document.body.textContent;
                            result.text = text.substring(0, 500);
                            
                            // Find email
                            const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
                            if (m) result.email = m[0];
                            
                            // Also check mailto links
                            const mailtoLink = document.querySelector('a[href^="mailto:"]');
                            if (mailtoLink) {
                                result.mailto = mailtoLink.getAttribute('href').replace('mailto:', '').split('?')[0];
                            }
                            
                            // Find company name
                            let company = '';
                            const h4 = document.querySelector('h4');
                            if (h4) company = h4.textContent.trim();
                            
                            // Try to find in table
                            const table = document.querySelector('table');
                            let titleText = '';
                            if (table) {
                                const rows = table.querySelectorAll('tr');
                                rows.forEach(row => {
                                    const th = row.querySelector('th');
                                    const td = row.querySelector('td');
                                    if (th && td) {
                                        const l = th.textContent.trim();
                                        if (l.includes('업체명')) company = td.textContent.trim();
                                        if (l.includes('제목')) titleText = td.textContent.trim();
                                    }
                                });
                            }
                            
                            result.company = company;
                            result.title = titleText;
                            return result;
                        })()
                    `);
                    
                    const email = info?.email || info?.mailto;
                    
                    if (email && email.includes('@')) {
                        allResults.push({
                            no: post.no,
                            company: info?.company || 'N/A',
                            title: info?.title || 'N/A',
                            email: email,
                            url: post.url
                        });
                        console.log(`    ✅ Email: ${email} (${info?.company || 'N/A'})`);
                    } else {
                        failedPosts.push({
                            no: post.no,
                            url: post.url,
                            company: info?.company || 'N/A',
                            title: info?.title || 'N/A',
                            reason: '이메일을 찾을 수 없음'
                        });
                        console.log(`    ❌ No email found`);
                    }
                } catch (err) {
                    console.log(`    ❌ Error: ${err.message}`);
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
        
        ws.close();
        bws.close();
        
        // Print results
        console.log('\n\n========================================');
        console.log('=== 편집몬 이메일 수집 결과 ===');
        console.log(`총 ${allResults.length}개 게시물 수집 (1~${MAX_PAGES}페이지)`);
        console.log('========================================\n');
        
        allResults.forEach((r, idx) => {
            console.log(`${idx + 1}. ${r.company} - ${r.title}`);
            console.log(`   이메일: ${r.email}`);
            console.log(`   링크: ${r.url}`);
            console.log('');
        });
        
        if (failedPosts.length > 0) {
            console.log('\n수집 실패한 게시물:');
            failedPosts.forEach((r, idx) => {
                console.log(`  ${idx + 1}. #${r.no} (${r.company} - ${r.title})`);
                console.log(`     링크: ${r.url}`);
                console.log(`     사유: ${r.reason}`);
            });
        }
        
        console.log('\n===JSON_START===');
        console.log(JSON.stringify({ success: allResults, failed: failedPosts }));
        console.log('===JSON_END===');
        
    } catch (err) {
        console.error('FATAL:', err.message);
        console.error(err.stack);
    }
}

main();
