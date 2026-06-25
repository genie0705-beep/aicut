const WebSocket = require('ws');
const http = require('http');

const CDP_PORT = 9224;
const BASE_URL = 'https://editmon.com/work';
const LIST_URL = `${BASE_URL}/employ_list.html`;
const MAX_PAGES = 10;

const allResults = [];
const failedPosts = [];

function connectCDP(wsUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => resolve(ws));
        ws.on('error', reject);
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 15000);
    });
}

function cdpSend(ws, method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = Date.now() + Math.random();
        const cmd = { id, method, params };
        let responded = false;
        
        const handler = (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                if (parsed.id === id) {
                    responded = true;
                    ws.removeListener('message', handler);
                    if (parsed.error) reject(new Error(parsed.error.message));
                    else resolve(parsed);
                }
            } catch (e) {}
        };
        
        ws.on('message', handler);
        ws.send(JSON.stringify(cmd));
        
        setTimeout(() => {
            if (!responded) {
                ws.removeListener('message', handler);
                reject(new Error(`Timeout for ${method}`));
            }
        }, 20000);
    });
}

function cdpEval(ws, expr) {
    return cdpSend(ws, 'Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
        timeout: 10000
    }).then(r => {
        if (r.result?.exceptionDetails) {
            console.log('JS Error:', r.result.exceptionDetails.text);
            return null;
        }
        return r.result?.result?.value;
    });
}

async function waitForLoad(ws) {
    return new Promise((resolve, reject) => {
        const handler = (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                if (parsed.method === 'Page.loadEventFired') {
                    ws.removeListener('message', handler);
                    resolve();
                }
            } catch (e) {}
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id: Date.now(), method: 'Page.enable' }));
        setTimeout(() => { ws.removeListener('message', handler); resolve(); }, 10000);
    });
}

async function navigate(ws, url) {
    await cdpSend(ws, 'Page.navigate', { url });
    // Wait for load
    await new Promise(resolve => {
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
        setTimeout(() => { ws.removeListener('message', handler); resolve(); }, 15000);
    });
    await new Promise(r => setTimeout(r, 2000));
}

async function getTargets() {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:${CDP_PORT}/json`, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function extractEmail(text) {
    if (!text) return null;
    const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return m ? m[0] : null;
}

async function main() {
    try {
        const targets = await getTargets();
        let editmonPage = targets.find(t => t.url && t.url.includes('editmon.com'));
        
        if (!editmonPage) {
            console.log('No editmon tab found!');
            return;
        }
        
        console.log('Found editmon tab:', editmonPage.title);
        console.log('URL:', editmonPage.url);
        
        // Create a NEW tab for the listing page so we don't disturb the existing detail page
        const ws = new WebSocket(editmonPage.webSocketDebuggerUrl);
        await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); setTimeout(() => j('timeout'), 10000); });
        
        // First, navigate to the listing page
        console.log('\nNavigating to employ_list.html...');
        
        // Enable Page domain
        await cdpSend(ws, 'Page.enable');
        
        const navResult = await cdpSend(ws, 'Page.navigate', { url: LIST_URL });
        console.log('Navigation started:', JSON.stringify(navResult.result).substring(0, 100));
        
        // Wait for load event
        await new Promise(resolve => {
            const handler = (data) => {
                try {
                    const p = JSON.parse(data.toString());
                    if (p.method === 'Page.loadEventFired') {
                        ws.removeListener('message', handler);
                        console.log('Page fully loaded');
                        resolve();
                    }
                } catch (e) {}
            };
            ws.on('message', handler);
            setTimeout(() => { ws.removeListener('message', handler); console.log('Load timeout, continuing...'); resolve(); }, 15000);
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Check page title
        const title = await cdpEval(ws, 'document.title');
        console.log('Current page title:', title);
        
        if (!title || !title.includes('편집몬')) {
            console.log('Navigation might have failed, trying alternative...');
            // Try evaluating directly
            const url = await cdpEval(ws, 'window.location.href');
            console.log('Current URL:', url);
        }
        
        for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
            const pageUrl = pageNum === 1 ? LIST_URL : `${LIST_URL}?page=${pageNum}`;
            console.log(`\n=== Page ${pageNum}: ${pageUrl} ===`);
            
            await navigate(ws, pageUrl);
            
            // Get page info
            const currentUrl = await cdpEval(ws, 'window.location.href');
            console.log('Current URL:', currentUrl);
            
            // Extract all post links
            const links = await cdpEval(ws, `
                (() => {
                    const items = [];
                    const anchors = document.querySelectorAll('a[href*="employ_detail.html?no="]');
                    const seen = new Set();
                    anchors.forEach(a => {
                        const href = a.getAttribute('href');
                        const m = href && href.match(/no=(\\d+)/);
                        if (m && !seen.has(m[1])) {
                            seen.add(m[1]);
                            // Find the row context
                            const tr = a.closest('tr');
                            const cells = tr ? tr.querySelectorAll('td') : [];
                            let company = '';
                            let title = '';
                            if (cells.length >= 2) {
                                company = cells[0].textContent.trim();
                                title = cells[1].textContent.trim();
                            }
                            const fullUrl = href.startsWith('http') ? href : 'https://editmon.com/work/' + href;
                            items.push({ no: m[1], company, title, url: fullUrl });
                        }
                    });
                    return items;
                })()
            `);
            
            console.log(`Found ${links ? links.length : 0} posts`);
            
            if (!links || links.length === 0) {
                continue;
            }
            
            for (let i = 0; i < links.length; i++) {
                const post = links[i];
                console.log(`  [${i+1}/${links.length}] Post #${post.no} - ${post.title || 'N/A'}`);
                
                try {
                    await navigate(ws, post.url);
                    
                    // Wait a bit for the page to fully render
                    await new Promise(r => setTimeout(r, 1500));
                    
                    // Extract email - method 1: full body text regex
                    let email = await cdpEval(ws, `
                        (() => {
                            const text = document.body.innerText;
                            const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
                            if (m) return m[0];
                            
                            // Try with explicit @ sign matching
                            const allText = document.body.textContent;
                            const m2 = allText.match(/[\\w.-]+@[\\w.-]+\\.\\w{2,}/);
                            return m2 ? m2[0] : null;
                        })()
                    `);
                    
                    if (email) {
                        // Clean email
                        email = email.trim().replace(/[<>()"]/g, '');
                        allResults.push({
                            no: post.no,
                            company: post.company || 'N/A',
                            title: post.title || 'N/A',
                            email,
                            url: post.url
                        });
                        console.log(`    ✅ Email: ${email}`);
                    } else {
                        // Try finding in mailto links
                        const mailto = await cdpEval(ws, `
                            (() => {
                                const a = document.querySelector('a[href^="mailto:"]');
                                if (a) return a.getAttribute('href').replace('mailto:', '').split('?')[0];
                                return null;
                            })()
                        `);
                        
                        if (mailto) {
                            allResults.push({
                                no: post.no,
                                company: post.company || 'N/A',
                                title: post.title || 'N/A',
                                email: mailto,
                                url: post.url
                            });
                            console.log(`    ✅ Email (mailto): ${mailto}`);
                        } else {
                            // Try extracting from page content more broadly
                            const pageText = await cdpEval(ws, 'document.body.textContent');
                            const extracted = extractEmail(pageText);
                            if (extracted) {
                                email = extracted.trim().replace(/[<>()"]/g, '');
                                allResults.push({
                                    no: post.no,
                                    company: post.company || 'N/A',
                                    title: post.title || 'N/A',
                                    email,
                                    url: post.url
                                });
                                console.log(`    ✅ Email (broad): ${email}`);
                            } else {
                                failedPosts.push({
                                    no: post.no,
                                    url: post.url,
                                    company: post.company || 'N/A',
                                    title: post.title || 'N/A',
                                    reason: '이메일을 찾을 수 없음'
                                });
                                console.log(`    ❌ No email found`);
                            }
                        }
                    }
                } catch (err) {
                    console.log(`    ❌ Error: ${err.message}`);
                    failedPosts.push({
                        no: post.no,
                        url: post.url,
                        company: post.company || 'N/A',
                        title: post.title || 'N/A',
                        reason: `오류: ${err.message}`
                    });
                }
            }
        }
        
        ws.close();
        
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
        
        console.log('\n=== RESULT_JSON_START ===');
        console.log(JSON.stringify({ success: allResults, failed: failedPosts }));
        console.log('=== RESULT_JSON_END ===');
        
    } catch (err) {
        console.error('FATAL:', err.message);
        console.error(err.stack);
    }
}

main();
