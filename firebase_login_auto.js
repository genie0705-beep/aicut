const pty = require('node-pty');
const { chromium } = require('playwright');

(async () => {
  // Spawn PTY for firebase login
  const shell = pty.spawn('powershell.exe', ['-Command', 'firebase login --no-localhost'], {
    name: 'xterm-color',
    cols: 120,
    rows: 30,
    cwd: 'C:\\aicut',
    env: process.env
  });

  let fullOutput = '';
  let loginUrl = null;

  shell.on('data', (data) => {
    fullOutput += data;
    // Extract URL pattern
    const urlMatch = fullOutput.match(/https:\/\/accounts\.google\.com\/[^\s]+/);
    if (urlMatch && !loginUrl) {
      loginUrl = urlMatch[0];
      console.log('GOT LOGIN URL');
      openBrowser(urlMatch[0]);
    }
  });

  async function openBrowser(url) {
    try {
      const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
      const ctx = b.contexts()[0];
      const page = ctx.pages()[0];
      
      // Open the login URL in the browser
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('Opened login URL in browser');
      
      // Wait for user to authenticate
      await new Promise(r => setTimeout(r, 15000));
      
      const currentUrl = await page.url();
      console.log('Current URL after auth:', currentUrl);
      
      if (currentUrl.includes('localhost') || currentUrl.includes('?code=') || currentUrl.includes('?oauth')) {
        // Extract the code/redirect
        console.log('Auth callback detected');
        // Send to the shell
        const parsedUrl = new URL(currentUrl);
        const code = parsedUrl.searchParams.get('code') || parsedUrl.searchParams.get('oauth_code');
        if (code) {
          shell.write(code + '\n');
          console.log('Sent auth code');
        }
      }
      
      await new Promise(r => setTimeout(r, 5000));
      console.log('\nFinal output:', fullOutput.substring(0, 2000));
      
      await b.close();
    } catch(e) {
      console.log('Browser error:', e.message);
      console.log('\nOutput so far:', fullOutput.substring(0, 2000));
    }
    shell.kill();
  }

  // Timeout
  setTimeout(() => {
    if (!loginUrl) {
      console.log('No login URL found in output:');
      console.log(fullOutput.substring(0, 2000));
    }
    shell.kill();
  }, 30000);
})();
