const WebSocket = require('ws');
const http = require('http');

const CDP_PORT = 9224;

function getTargets() {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:${CDP_PORT}/json`, r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
    });
}

class PageClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this._msgHandlers = new Map();
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
            } catch(e) {}
        });
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
        if (r.result?.exceptionDetails) return null;
        return r.result?.result?.value;
    }
    
    async navigate(url) {
        const loadPromise = new Promise(resolve => {
            const handler = (data) => {
                try {
                    const p = JSON.parse(data.toString());
                    if (p.method === 'Page.loadEventFired' || p.method === 'Page.frameStoppedLoading') {
                        this.ws.removeListener('message', handler);
                        resolve();
                    }
                } catch(e) {}
            };
            this.ws.on('message', handler);
            setTimeout(() => { this.ws.removeListener('message', handler); resolve(); }, 15000);
        });
        await this.send('Page.navigate', { url });
        await loadPromise;
        await new Promise(r => setTimeout(r, 2000));
    }
    
    close() { if (this.ws) this.ws.close(); }
}

async function main() {
    try {
        const targets = await getTargets();
        const editmonTarget = targets.find(t => t.url && t.url.includes('editmon.com'));
        
        if (!editmonTarget) {
            console.log('No editmon tab');
            return;
        }
        
        const page = new PageClient(editmonTarget.webSocketDebuggerUrl);
        await page.connect();
        await page.send('Page.enable');
        await page.send('Runtime.enable');
        
        // Go to listing
        await page.navigate('https://editmon.com/work/employ_list.html');
        console.log('Title:', await page.eval('document.title'));
        
        // Dump full body HTML
        const html = await page.eval('document.body.outerHTML');
        console.log('\n=== BODY HTML ===');
        console.log(html);
        
        page.close();
    } catch(err) {
        console.error('Error:', err);
    }
}

main();
